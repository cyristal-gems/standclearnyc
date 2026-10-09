import type {TransitData} from '../../components/TransitMap';
type Feature=TransitData['stations']['features'][number];
export type StationOption={id:string;name:string;routes:string[];members:Feature[];accessible:boolean;partiallyAccessible:boolean};
export function stationOptions(data:TransitData,options:{mode?:'day'|'night';line?:string;accessibility?:'all'|'full'|'any';search?:string}={}):StationOption[]{
 const groups=new Map<string,Feature[]>();
 for(const feature of data.stations.features){
  const p=feature.properties??{};
  if(options.mode&&!p[options.mode])continue;
  const key=p.complexId?`complex:${p.complexId}`:`stop:${p.id}`;
  groups.set(key,[...(groups.get(key)??[]),feature]);
 }
 return [...groups.values()].flatMap(members=>{
  const routes=[...new Set(members.flatMap(f=>String(options.mode?f.properties?.[options.mode+'Routes']:[f.properties?.dayRoutes,f.properties?.nightRoutes].join(' ')).split(' ').filter(Boolean)))];
  if(options.line&&!routes.includes(options.line))return [];
  const accessible=members.some(f=>String(f.properties?.ada)==='1');
  const partiallyAccessible=members.some(f=>String(f.properties?.ada)==='2');
  if(options.accessibility==='full'&&!accessible)return [];
  if(options.accessibility==='any'&&!accessible&&!partiallyAccessible)return [];
  const names=[...new Set(members.map(f=>String(f.properties?.name)))];
  if(options.search&&!names.some(name=>name.toLowerCase().includes(options.search!.toLowerCase())))return [];
  const representative=members.find(f=>!options.line||String(options.mode?f.properties?.[options.mode+'Routes']:[f.properties?.dayRoutes,f.properties?.nightRoutes].join(' ')).split(' ').includes(options.line))??members[0];
  return [{id:String(representative.properties?.id),name:names.join(' / '),routes,members,accessible,partiallyAccessible}];
 }).sort((a,b)=>a.name.localeCompare(b.name));
}
