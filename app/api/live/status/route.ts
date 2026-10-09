export const maxDuration=30;
import {readFile} from "node:fs/promises";
import {join} from "node:path";
import { getLive, verdict, stationAlerts } from "../../../../lib/mta/live";
import {getTrains} from "../../../../lib/mta/trains";
import type {TransitData} from "../../../../components/TransitMap";
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;const line=params.get("line"),station=params.get("station");
 if(line&&!/^(?:[1-7]X?|[A-Z]{1,3})$/.test(line))return Response.json({error:"Invalid route"},{status:400});
 if(station&&!/^[A-Z0-9]{1,10}$/.test(station))return Response.json({error:"Invalid station"},{status:400});
 try{
  let stationInfo:{name:string;stops:string[];routes:string[]}|null=null;
  if(station){const network:TransitData=JSON.parse(await readFile(join(process.cwd(),"public/data/transit.json"),"utf8"));const seed=network.stations.features.find(feature=>feature.properties?.id===station);if(!seed)return Response.json({error:"Unknown station"},{status:404});const members=network.stations.features.filter(feature=>feature.properties?.id===station||(seed.properties?.complexId&&feature.properties?.complexId===seed.properties.complexId));stationInfo={name:String(seed.properties?.name),stops:members.map(feature=>String(feature.properties?.id)),routes:[...new Set(members.flatMap(feature=>String(feature.properties?.dayRoutes??"").split(" ").concat(String(feature.properties?.nightRoutes??"").split(" ")).filter(Boolean)))]};}
  const feedLine=line?({FX:"F","6X":"6","7X":"7"}[line]??line):null;
  const data=await getLive();const routeAlerts=feedLine?data.alerts.filter(alert=>!alert.routes.length||alert.routes.includes(feedLine)).map(alert=>({...alert,priorities:alert.priorities?.filter(p=>!p.routeId||p.routeId===feedLine)})):data.alerts;
  const scoped=stationInfo?stationAlerts(routeAlerts,stationInfo.stops,stationInfo.routes):null;const alerts=scoped?.direct??routeAlerts;
  const trains=stationInfo||line?await getTrains():null;
  const result=verdict(alerts,trains?{trains,stops:stationInfo?.stops??[],routes:feedLine?[feedLine]:stationInfo?.routes??[],related:scoped?.related??[],scope:stationInfo?"station":"route"}:undefined);
  if(line&&feedLine!==line)result.explanation+=" Live reports cover the base line; express-only conditions may differ.";
  return Response.json({...data,alerts,relatedAlerts:scoped?.related??[],scope:stationInfo?"station":line?"line":"system",stationName:stationInfo?.name??null,verdict:result},{headers:{"Cache-Control":"no-store"}});
 }catch(error){const stale=error instanceof Error&&error.message.includes("Stale");return Response.json({error:stale?"MTA service-alert reports are currently stale. Waiting for a fresh update.":"Live MTA service alerts could not be reached. Retrying shortly.",reason:stale?"stale_upstream":"feed_unavailable",timestamp:null,alerts:[],relatedAlerts:[],verdict:null},{status:503,headers:{"Cache-Control":"no-store"}})}
}
