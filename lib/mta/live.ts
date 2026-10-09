import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import {mercuryAlerts} from "./mercury";
import type {TrainData} from "./trains";
export const ALERT_URL="https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts";
export type Alert = {id:string;routes:string[];header:string;description:string;effect:number;active:boolean;category?:string;priorities?:{routeId?:string|null;stopId?:string|null;priority:number}[];selectors?:{routeId?:string|null;stopId?:string|null}[]};
export function isActive(periods:{start?:number|Long|null;end?:number|Long|null}[],now:number):boolean {return !periods.length || periods.some(p=>(!p.start || Number(p.start)<=now)&&(!p.end || Number(p.end)>now));}
type Long={toString():string};
export function decodeAlerts(bytes:Uint8Array,now=Date.now()/1000){
 const feed=GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(bytes);
 const timestamp=Number(feed.header.timestamp??0);
 if(!timestamp||now-timestamp>600||timestamp-now>60)throw new Error("Stale upstream service feed");
 const translated=(value:{translation?:{language?:string|null;text:string}[]|null}|null|undefined)=>{const rows=value?.translation??[];return (rows.find(t=>t.language==="en")??rows[0])?.text??""};
 const metadata=mercuryAlerts(bytes);
 const alerts:Alert[]=feed.entity.flatMap(entity=>{const a=entity.alert;if(!a)return [];const extra=metadata.get(entity.id);return [{category:extra?.category,priorities:extra?.priorities,id:entity.id,routes:[...new Set((a.informedEntity??[]).map(e=>e.routeId).filter((r):r is string=>Boolean(r)))],selectors:[...(a.informedEntity??[]).map(e=>({routeId:e.routeId,stopId:e.stopId})),...(extra?.stations??[])],header:translated(a.headerText),description:translated(a.descriptionText),effect:Number(a.effect??0),active:isActive(a.activePeriod??[],now)}]});
 return {timestamp:new Date(timestamp*1000).toISOString(),alerts};
}
export async function getLive(){const response=await fetch(ALERT_URL,{cache:"no-store",signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error("MTA upstream unavailable");return {...decodeAlerts(new Uint8Array(await response.arrayBuffer())),checkedAt:new Date().toISOString(),source:ALERT_URL};}
export function verdict(alerts:Alert[],context?:{trains:TrainData;stops:string[];routes:string[];related:Alert[];now?:number;scope?:"route"|"station"}){
 const active=alerts.filter(a=>a.active);
 const disrupted=(a:Alert)=>[1,2,3].includes(a.effect)||a.priorities?.some(p=>[13,20,21,24,26,27,28,30,34,35].includes(p.priority));
 const degraded=active.filter(disrupted);
 if(degraded.length)return {verdict:"I'm Walkin' Here",explanation:"MTA reports delays, cancellations, reduced or suspended service in this scope. This is a service-condition verdict, not a walking-time comparison.",confidence:"MTA live advisories",signals:degraded.map(a=>a.header)};
 if(context){
  const {trains,stops,routes,related}=context;const now=context.now??Date.now()/1000;
  const fresh=!trains.error&&!trains.partial&&now-Date.parse(trains.checkedAt)/1000<=60&&now-Date.parse(trains.checkedAt)/1000>=-60;
  if(context.scope==="route"&&fresh&&!active.length){const operating=trains.trains.filter(train=>routes.includes(train.route)&&!train.awaitingUpdate&&!train.delayed);if(operating.length)return {verdict:"Catch That Train!",explanation:`${operating.length} trains are currently reporting on this route, with no active MTA advisory in the feed. This summarizes the entire route; check your station for its next arrival. It does not guarantee an on-time trip.`,confidence:"live route reports",signals:[]};}
  const upcoming=trains.arrivals.filter(a=>stops.includes(a.stop)&&routes.includes(a.route)&&a.time>=now&&a.time<=now+300&&!a.awaitingUpdate&&!a.delayed).sort((a,b)=>a.time-b.time);
  const advisories=[...active,...related.filter(a=>a.active)];
  if(context.scope!=="route"&&fresh&&upcoming.length&&!advisories.length)return {verdict:"Catch That Train!",explanation:`MTA predicts a ${upcoming[0].route} train at this station in ${Math.max(1,Math.ceil((upcoming[0].time-now)/60))} min, with no active station or serving-line advisory in the feed. Predictions can change; this is not an on-time or travel-time guarantee.`,confidence:"live arrival prediction",signals:[]};
 }
 return {verdict:null,explanation:active.length?"Current advisories do not establish a delay verdict. Check their details before traveling.":"No active disruption is reported in this scope. Select a station for a verdict based on live arrival predictions; absence of alerts alone does not confirm favorable service.",confidence:"insufficient data",signals:active.map(a=>a.header)};
}

export function stationAlerts(alerts:Alert[],stopIds:string[],routes:string[]){
 const stops=new Set(stopIds);const matches=(id:string)=>stops.has(id)||(/[NS]$/.test(id)&&stops.has(id.slice(0,-1)));
 const direct=alerts.filter(alert=>alert.selectors?.some(entity=>entity.stopId&&matches(entity.stopId)));
 const related=alerts.filter(alert=>!direct.includes(alert)&&(alert.routes.some(route=>routes.includes(route))||(!alert.routes.length&&!alert.selectors?.some(entity=>entity.stopId))));
 return {direct,related};
}
