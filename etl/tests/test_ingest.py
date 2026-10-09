from etl.jobs.ingest import normalize_station, Rider
from pydantic import ValidationError
import pytest

def test_complex_id_is_preserved_for_ridership_join():
    row={"complex_id":"001","stop_name":"Test","borough":"M","latitude":"40.7","longitude":"-73.9","daytime_routes":"A C","gtfs_stop_ids":"A01","ada":"1"}
    result=normalize_station(row)
    assert result["station_id"]=="001"
    assert result["borough"]=="Manhattan"
    assert result["gtfs_stop_ids"]=="A01"

def test_negative_ridership_fails_closed():
    with pytest.raises(ValidationError):
        Rider(station_complex_id="1",transit_timestamp="2026-01-01T01:00:00",payment_method="omny",fare_class_category="Full",ridership=-1,transfers=0,transit_mode="subway")

import os
from sqlalchemy import create_engine, text
from etl.jobs.ingest import upsert_rows

@pytest.mark.skipif(not os.environ.get("DATABASE_URL"),reason="Integration test requires PostgreSQL")
def test_postgres_upsert_is_idempotent_and_updates_changed_values():
    url=os.environ["DATABASE_URL"].replace("postgres://","postgresql+psycopg://",1).replace("postgresql://","postgresql+psycopg://",1)
    engine=create_engine(url)
    with engine.connect() as connection:
        transaction=connection.begin()
        try:
            row={"station_id":"integration-test-only","station_name":"Test station","borough":"Manhattan","latitude":40.7,"longitude":-73.9,"routes":"A","gtfs_stop_ids":"TEST","accessibility":"0"}
            assert upsert_rows(connection,"stations",[row],["station_id"])=={"inserted":1,"updated":0,"skipped":0}
            assert upsert_rows(connection,"stations",[row],["station_id"])=={"inserted":0,"updated":0,"skipped":1}
            changed={**row,"station_name":"Updated test station"}
            assert upsert_rows(connection,"stations",[changed],["station_id"])=={"inserted":0,"updated":1,"skipped":0}
            assert connection.execute(text("SELECT COUNT(*) FROM stations WHERE station_id='integration-test-only'")).scalar()==1
        finally:
            transaction.rollback()
    engine.dispose()
