from pathlib import Path
import csv,io,zipfile,json,collections,datetime,hashlib,sys
import httpx
from etl.service_periods import representative_mode, weekday_services
root=Path(__file__).resolve().parents[2]
response=httpx.get("https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip",timeout=60);response.raise_for_status()
digest=hashlib.sha256(response.content).hexdigest()
existing=root/'public/data/transit.json'
station_response=httpx.get("https://data.ny.gov/resource/39hk-dx4f.json",params={"$limit":1000},timeout=60);station_response.raise_for_status()
station_rows=station_response.json()
if len(station_rows)<400 or any(not all(k in r for k in ['gtfs_stop_id','complex_id','ada']) for r in station_rows):raise ValueError('Official station metadata schema or completeness changed')
station_meta={r['gtfs_stop_id']:r for r in station_rows}
station_digest=hashlib.sha256(json.dumps(station_rows,sort_keys=True).encode()).hexdigest()
transfer_config=json.loads((root/'data/out-of-system-transfers.json').read_text())
transfer_digest=hashlib.sha256(json.dumps(transfer_config,sort_keys=True).encode()).hexdigest()
if existing.exists():
 old=json.loads(existing.read_text())
 if old.get('feedHash')==digest and old.get('stationHash')==station_digest and old.get('transferHash')==transfer_digest and old.get('schemaVersion')==5 and old.get('serviceDate')==datetime.date.today().isoformat():
  print('Official schedule and station metadata unchanged');sys.exit(0)
z=zipfile.ZipFile(io.BytesIO(response.content))
def rows(name):return csv.DictReader(io.TextIOWrapper(z.open(name),encoding='utf-8-sig'))
routes={r['route_id']:r for r in rows('routes.txt')}
stops={r['stop_id']:r for r in rows('stops.txt')}
# Keep the renamed station current while upstream feeds catch up.
for stop in stops.values():
 if (stop['parent_station'] or stop['stop_id'])=='G05':stop['stop_name']='Jamaica Center-York College'
service_date,weekday=weekday_services(list(rows('calendar.txt')),list(rows('calendar_dates.txt')) if 'calendar_dates.txt' in z.namelist() else [],datetime.date.today())
trips={r['trip_id']:r for r in rows('trips.txt') if r['service_id'] in weekday}
for trip in trips.values():
 if trip['trip_headsign'].startswith('Jamaica Center'):trip['trip_headsign']='Jamaica Center-York College'
seq=collections.defaultdict(list)
for row in rows('stop_times.txt'):
 if row['trip_id'] in trips:seq[row['trip_id']].append(row)
patterns={};shape_modes=collections.defaultdict(set);station_routes=collections.defaultdict(lambda:collections.defaultdict(set))
classified=[];counts=collections.Counter()
for id,items in seq.items():
 t=trips[id];items.sort(key=lambda s:int(s['stop_sequence']));ids=[stops[s['stop_id']]['parent_station'] or s['stop_id'] for s in items]
 mode=representative_mode([item['departure_time'] for item in items])
 if mode is None:continue
 key=(t['route_id'],t['direction_id'],t['trip_headsign'],tuple(ids))
 counts[(key,mode)]+=1
 classified.append((t,items,ids,key,mode))
# Ignore occasional overnight transition/short-turn variants; keep sustained service.
max_night=collections.defaultdict(int)
for (key,mode),count in counts.items():
 if mode=='night':max_night[key[:2]]=max(max_night[key[:2]],count)
for t,items,ids,key,mode in classified:
 if mode=='night' and counts[(key,mode)] < max_night[key[:2]]*.25:continue
 if key not in patterns:patterns[key]={'route':t['route_id'],'headsign':t['trip_headsign'],'direction':t['direction_id'],'directionLabel': ('Northbound' if all(s['stop_id'].endswith('N') for s in items) else 'Southbound' if all(s['stop_id'].endswith('S') for s in items) else None),'stops':ids,'modes':set()}
 patterns[key]['modes'].add(mode)
 shape_modes[(t['route_id'],t['shape_id'])].add(mode)
 for stop in ids:station_routes[stop][mode].add(t['route_id'])
shapes=collections.defaultdict(list)
for row in rows('shapes.txt'):shapes[row['shape_id']].append((int(row['shape_pt_sequence']),[round(float(row['shape_pt_lon']),6),round(float(row['shape_pt_lat']),6)]))
features=[]
for (route,shape),modes in shape_modes.items():
 coordinates=[coords for _,coords in sorted(shapes[shape])]
 features.append({'type':'Feature','properties':{'route':route,'color':'#'+routes[route]['route_color'],'day':'day' in modes,'night':'night' in modes},'geometry':{'type':'LineString','coordinates':coordinates}})
stations=[]
for id,r in stops.items():
 if r['location_type']!='1':continue
 stations.append({'type':'Feature','properties':{'id':id,'name':r['stop_name'],'day':bool(station_routes[id]['day']),'night':bool(station_routes[id]['night']),'dayRoutes':' '.join(sorted(station_routes[id]['day'])),'nightRoutes':' '.join(sorted(station_routes[id]['night'])),'complexId':station_meta.get(id,{}).get('complex_id'),'ada':station_meta.get(id,{}).get('ada'),'adaNorthbound':station_meta.get(id,{}).get('ada_northbound'),'adaSouthbound':station_meta.get(id,{}).get('ada_southbound'),'adaNotes':None if station_meta.get(id,{}).get('ada_notes') in [None,'NaN'] else station_meta[id]['ada_notes']},'geometry':{'type':'Point','coordinates':[float(r['stop_lon']),float(r['stop_lat'])]}})
station_by_id={s['properties']['id']:s for s in stations}
transfer_features=[]
for pair in transfer_config['pairs']:
 endpoints=[station_by_id[pair['from'][0]],station_by_id[pair['to'][0]]]
 transfer_features.append({'type':'Feature','properties':{'name':pair['label'],'fromIds':pair['from'],'toIds':pair['to']},'geometry':{'type':'LineString','coordinates':[s['geometry']['coordinates'] for s in endpoints]}})
 for side,other in [('from','to'),('to','from')]:
  for id in pair[side]:station_by_id[id]['properties']['outOfStationTransfer']=' / '.join(station_by_id[to]['properties']['name'] for to in pair[other])
metadata=list(rows('feed_info.txt'))
out={'schemaVersion':5,'serviceDate':service_date,'serviceMapSources':{'day':'https://www.mta.info/map/5256','night':'https://www.mta.info/map/5336'},'serviceWindows':{'day':'Representative weekday trips, 7 AM–7 PM mid-trip','night':'Representative overnight trips, 1–4 AM mid-trip; MTA late-night map approximately 11 PM–5 AM'},'stationHash':station_digest,'transferHash':transfer_digest,'stationSource':'https://data.ny.gov/Transportation/MTA-Subway-Stations/39hk-dx4f','transferSource':transfer_config['source'],'transferVerifiedAt':transfer_config['verifiedAt'],'transfers':{'type':'FeatureCollection','features':transfer_features},'feedHash':digest,'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':'https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip','feed':metadata,'routes':[{'id':id,'name':r['route_long_name'],'color':'#'+r['route_color']} for id,r in routes.items()],'lines':{'type':'FeatureCollection','features':features},'stations':{'type':'FeatureCollection','features':stations},'patterns':[{**r,'modes':sorted(r['modes'])} for r in patterns.values()]}
p=root/'public/data';p.mkdir(parents=True,exist_ok=True);(p/'transit.json').write_text(json.dumps(out,separators=(',',':')))
print(len(features),'route shapes',len(stations),'stations',len(patterns),'official stop patterns')
