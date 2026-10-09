export type StopGraph = {
 stations: {features: {properties?: {id?: unknown;name?: unknown}|null}[]};
 patterns: {route:string;headsign:string;directionLabel?:string|null;stops:string[];modes:string[]}[];
};
export function getNextStops(data:StopGraph,stationId:string,route:string,mode:string){
 const found=new Map<string,{id:string|null;name:string;headsign:string;direction:string;terminal:boolean}>();
 for(const pattern of data.patterns){
  if(pattern.route!==route||!pattern.modes.includes(mode))continue;
  const index=pattern.stops.indexOf(stationId);if(index<0)continue;
  const nextId=pattern.stops[index+1]??null;
  const next=nextId?data.stations.features.find(s=>s.properties?.id===nextId):null;
  if(nextId&&!next)continue;
  const direction=pattern.directionLabel??"Toward destination";
  const result={id:nextId,name:next?String(next.properties?.name):"End of this route",headsign:pattern.headsign,direction,terminal:!nextId};
  found.set(`${direction}|${pattern.headsign}|${nextId}`,result);
 }
 return [...found.values()].sort((a,b)=>a.direction.localeCompare(b.direction)||a.headsign.localeCompare(b.headsign));
}

export function getRouteTerminals(data:StopGraph,route:string,mode:string){
 const terminals=new Map<string,{id:string;name:string;direction:string;length:number}>();
 for(const pattern of data.patterns){
  if(pattern.route!==route||!pattern.modes.includes(mode)||!pattern.stops.length)continue;
  const id=pattern.stops.at(-1)!;
  const station=data.stations.features.find(s=>s.properties?.id===id);
  if(!station)continue;
  const direction=pattern.directionLabel??"Toward destination";
  const key=`${direction}|${id}`;if((terminals.get(key)?.length??0)<pattern.stops.length)terminals.set(key,{id,name:String(station.properties?.name),direction,length:pattern.stops.length});
 }
 return [...terminals.values()].sort((a,b)=>a.direction.localeCompare(b.direction)||b.length-a.length||a.name.localeCompare(b.name)).map(({id,name,direction})=>({id,name,direction}));
}
