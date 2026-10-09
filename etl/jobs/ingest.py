"""Official MTA station-complex and hourly-ridership ingestion. Run as a module."""
import argparse
import logging
import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import httpx
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text
from etl.validation import Station

STATIONS="5f5g-n3cz"
RIDERSHIP="5wq4-mkjj"
BOROUGHS={"M":"Manhattan","B":"Brooklyn","Q":"Queens","Bx":"Bronx","SI":"Staten Island"}
log=logging.getLogger(__name__)
class Rider(BaseModel):
    station_complex_id:str=Field(min_length=1)
    transit_timestamp:datetime
    payment_method:str=Field(min_length=1)
    fare_class_category:str=Field(min_length=1)
    ridership:Decimal=Field(ge=0)
    transfers:Decimal=Field(ge=0)
    transit_mode:str

def extract(client:httpx.Client,dataset:str,params:dict):
    for attempt in range(3):
        try:
            response=client.get(f"https://data.ny.gov/resource/{dataset}.json",params=params)
            response.raise_for_status()
            rows=response.json()
            if not isinstance(rows,list):raise ValueError("Source schema changed: expected a row array")
            return rows
        except (httpx.TransportError,httpx.HTTPStatusError):
            if attempt==2:raise

def source_time(client:httpx.Client,dataset:str)->datetime:
    response=client.get(f"https://data.ny.gov/api/views/{dataset}.json");response.raise_for_status()
    return datetime.fromtimestamp(response.json()["rowsUpdatedAt"],timezone.utc)

def normalize_station(row:dict)->dict:
    station=Station(station_id=row["complex_id"],station_name=row["stop_name"],borough=BOROUGHS[row["borough"]],latitude=row["latitude"],longitude=row["longitude"])
    return {**station.model_dump(),"routes":row["daytime_routes"],"gtfs_stop_ids":row["gtfs_stop_ids"],"accessibility":row.get("ada")}

def upsert_rows(conn,table_name:str,rows:list[dict],keys:list[str])->dict:
    if not rows:return {"inserted":0,"updated":0,"skipped":0}
    from sqlalchemy import table, column, or_, literal_column
    from sqlalchemy.dialects.postgresql import insert
    target=table(table_name,*[column(name) for name in rows[0]])
    updates=[name for name in rows[0] if name not in keys]
    compared=[name for name in updates if name!="source_updated_at"]
    counts={"inserted":0,"updated":0,"skipped":0}
    for offset in range(0,len(rows),3000):
        batch=rows[offset:offset+3000]
        statement=insert(target).values(batch)
        statement=statement.on_conflict_do_update(index_elements=keys,set_={name:statement.excluded[name] for name in updates},where=or_(*[target.c[name].is_distinct_from(statement.excluded[name]) for name in compared])).returning(literal_column("(xmax = 0)").label("inserted"))
        changed=conn.execute(statement).fetchall()
        counts["inserted"]+=sum(bool(row[0]) for row in changed)
        counts["updated"]+=sum(not row[0] for row in changed)
        counts["skipped"]+=len(batch)-len(changed)
    return counts

def run(days:int=30):
    url=os.environ["DATABASE_URL"].replace("postgres://","postgresql+psycopg://",1).replace("postgresql://","postgresql+psycopg://",1)
    engine=create_engine(url)
    with httpx.Client(timeout=60,follow_redirects=True) as client,engine.begin() as conn:
        conn.execute(text("SELECT pg_advisory_xact_lock(726013)"))
        stamp=source_time(client,STATIONS)
        raw=extract(client,STATIONS,{"$limit":1000,"$order":"complex_id"})
        if len(raw)==1000:raise ValueError("Station source exceeds configured bound; implement pagination before loading")
        stations=[normalize_station(row) for row in raw]
        log.info("stations %s",upsert_rows(conn,"stations",stations,["station_id"]))
        known={s["station_id"] for s in stations}
        conn.execute(text("INSERT INTO source_metadata(source_name,source_identifier,last_checked_at,source_last_updated_at,last_successful_ingestion_at,row_count,status) VALUES ('stations',:id,NOW(),:stamp,NOW(),:count,'ok') ON CONFLICT(source_name) DO UPDATE SET last_checked_at=NOW(),source_last_updated_at=excluded.source_last_updated_at,last_successful_ingestion_at=NOW(),row_count=excluded.row_count,status='ok'"),{"id":STATIONS,"stamp":stamp,"count":len(stations)})
        stamp=source_time(client,RIDERSHIP)
        latest=extract(client,RIDERSHIP,{"$select":"max(transit_timestamp)"})[0]["max_transit_timestamp"]
        end=datetime.fromisoformat(latest).replace(hour=0,minute=0,second=0,microsecond=0)+timedelta(days=1)
        previous=conn.execute(text("SELECT MAX(timestamp) FROM ridership_hourly")).scalar()
        # Reprocess a correction window. Explicit backfill can be done with --days and clearing/rebuilding only in a separate reviewed operation.
        start=max(end-timedelta(days=days),previous.replace(hour=0,minute=0,second=0,microsecond=0)-timedelta(days=7)) if previous else end-timedelta(days=days)
        total={"inserted":0,"updated":0,"skipped":0,"non_subway":0,"duplicates":0,"invalid":0}
        while start<end:
            next_day=start+timedelta(days=1)
            offset=0
            while True:
                params={"$where":f"transit_timestamp >= '{start.isoformat()}' AND transit_timestamp < '{next_day.isoformat()}'","$order":":id","$limit":5000,"$offset":offset}
                raw=extract(client,RIDERSHIP,params)
                if not raw:break
                dedup={}
                for row in raw:
                    try:rider=Rider.model_validate(row)
                    except Exception:
                        total["invalid"]+=1
                        raise ValueError("Ridership source schema/values changed; transaction rolled back") from None
                    if rider.transit_mode!="subway":total["non_subway"]+=1;continue
                    if rider.station_complex_id not in known:raise ValueError("Unknown station complex; transaction rolled back")
                    key=(rider.station_complex_id,rider.transit_timestamp,rider.payment_method,rider.fare_class_category)
                    normalized={"station_id":rider.station_complex_id,"timestamp":rider.transit_timestamp,"payment_method":rider.payment_method,"fare_category":rider.fare_class_category,"ridership":rider.ridership,"transfers":rider.transfers,"source_updated_at":stamp}
                    if key in dedup:
                        if normalized!=dedup[key]:raise ValueError("Conflicting duplicate source rows")
                        total["duplicates"]+=1
                    dedup[key]=normalized
                counts=upsert_rows(conn,"ridership_hourly",list(dedup.values()),["station_id","timestamp","payment_method","fare_category"])
                for key,value in counts.items():total[key]+=value
                offset+=len(raw)
                if len(raw)<5000:break
            start=next_day
        conn.execute(text("REFRESH MATERIALIZED VIEW station_hourly_profiles"))
        count=conn.execute(text("SELECT COUNT(*) FROM ridership_hourly")).scalar()
        conn.execute(text("INSERT INTO source_metadata(source_name,source_identifier,last_checked_at,source_last_updated_at,last_successful_ingestion_at,row_count,status) VALUES ('ridership',:id,NOW(),:stamp,NOW(),:count,'ok') ON CONFLICT(source_name) DO UPDATE SET last_checked_at=NOW(),source_last_updated_at=excluded.source_last_updated_at,last_successful_ingestion_at=NOW(),row_count=excluded.row_count,status='ok'"),{"id":RIDERSHIP,"stamp":stamp,"count":count})
        log.info("ridership %s",total)

if __name__=="__main__":
    parser=argparse.ArgumentParser();parser.add_argument("--days",type=int,default=30);args=parser.parse_args()
    if not 1<=args.days<=366:parser.error("--days must be 1 through 366")
    logging.basicConfig(level=logging.INFO)
    try:
        run(args.days)
    except Exception as error:
        message=str(error) if isinstance(error,ValueError) else type(error).__name__
        log.error("Ingestion failed; rolled back: %s",message)
        try:
            url=os.environ["DATABASE_URL"].replace("postgres://","postgresql+psycopg://",1).replace("postgresql://","postgresql+psycopg://",1)
            with create_engine(url).begin() as failed:
                failed.execute(text("UPDATE source_metadata SET status='failed',last_checked_at=NOW() WHERE source_name IN ('stations','ridership')"))
        except Exception:
            log.error("Could not record failure metadata")
        raise SystemExit(1) from None
