"use client";
import {formatRouteText} from "../lib/mta/route-display";
import {useEffect,useState} from "react";
import type {Alert} from "../lib/mta/live";
import RouteBullet from "./RouteBullet";
type Data={timestamp:string|null;checkedAt?:string;alerts:Alert[];relatedAlerts?:Alert[];stationName?:string|null;error?:string;verdict?:{verdict:string|null;explanation:string;confidence:string}|null};
const effectLabel:Record<number,string>={1:"No service",2:"Reduced service",3:"Significant delays",4:"Detour",5:"Additional service",6:"Service change",7:"Advisory",8:"Unclassified",9:"Stop moved",10:"Notice",11:"Accessibility issue"};
function AlertCard({alert}:{alert:Alert}){
 const priority=Math.max(0,...(alert.priorities??[]).map(p=>p.priority));
 const severity=[21,35].includes(priority)||alert.effect===1?"critical":priority>=12||[2,3,4,6,9].includes(alert.effect)?"warning":"info";
 return <details className={`service-alert-card ${severity}`}><summary><span className="alert-icon" aria-hidden="true">{severity==="info"?"ⓘ":"⚠"}</span><span className="alert-card-content"><span className="alert-card-meta"><span className="alert-route-badges">{alert.routes.length?alert.routes.map(route=><RouteBullet key={route} id={route}/>):<span>System</span>}</span><span className="alert-status-badge">{alert.category||effectLabel[alert.effect]||"Advisory"}</span></span><strong>{formatRouteText(alert.header)||"MTA service advisory"}</strong></span><span className="alert-chevron" aria-hidden="true">⌄</span></summary>{alert.description&&alert.description!==alert.header&&<p>{formatRouteText(alert.description)}</p>}</details>;
}
export default function LiveService({line,station=""}:{line:string;station?:string}){
 const [data,setData]=useState<Data|null>(null);
 const [clock,setClock]=useState(()=>Date.now());
 useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),10000);return()=>clearInterval(timer)},[]);
 const stale=Boolean(data?.timestamp&&clock-new Date(data.timestamp).getTime()>600000);
 useEffect(()=>{let active=true;let pending=false;const controller=new AbortController();async function update(){if(pending||document.hidden)return;pending=true;try{const response=await fetch("/api/live/status?"+new URLSearchParams({...line?{line}:{},...station?{station}:{}}),{signal:controller.signal,cache:"no-store"});const result:Data=await response.json();if(active)setData(result)}catch{if(active)setData({timestamp:null,alerts:[],error:"Live service could not be refreshed"})}finally{pending=false}}update();const timer=setInterval(update,30000);document.addEventListener("visibilitychange",update);return()=>{active=false;controller.abort();clearInterval(timer);document.removeEventListener("visibilitychange",update)}},[line,station]);
 const alerts=data?.alerts.filter(a=>a.active)??[];const related=data?.relatedAlerts?.filter(a=>a.active)??[];
 return <section className="live"><div className="section-heading"><h3>{station?"Station service":"Service alerts"}</h3><span>LIVE · MTA</span></div>{!data?<p>Connecting to MTA…</p>:data.error||stale?<p role="status">{data.error||"Live reports have expired. Waiting for a fresh MTA update."}</p>:<>
 <p className="freshness">Updated {new Date(data.timestamp!).toLocaleTimeString("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit"})} ET · refreshes every 30 sec</p>
 {data.verdict&&<div className={`verdict verdict-status ${data.verdict.verdict==="Catch That Train!"?"favorable":data.verdict.verdict?"disrupted":"pending"}`}><span className="verdict-kicker">{station?"STATION VERDICT":line?"LINE VERDICT":"SYSTEM VERDICT"}</span><strong>{data.verdict.verdict??"Verdict pending"}</strong><p>{data.verdict.explanation}</p></div>}
 <details className="service-alert-group" key={station+line+alerts.some(a=>a.effect===1)} open={alerts.some(a=>a.effect===1)}><summary><span aria-hidden="true">{alerts.some(a=>a.effect===1)?"⚠":"ⓘ"}</span><strong>{alerts.length} active {alerts.length===1?"alert":"alerts"}</strong><span className="alert-group-scope">{station?"At this station":line?"On this line":"Across the system"}</span></summary><div className="alert-list">{alerts.map(a=><AlertCard key={a.id} alert={a}/>)}{!alerts.length&&<p className="freshness">No active advisory {station?"explicitly names this station":"in this feed"}. This alone does not confirm normal service.</p>}</div></details>
 {station&&Boolean(related.length)&&<details className="service-alert-group station-related-alerts"><summary><span aria-hidden="true">ⓘ</span><strong>{related.length} related advisories</strong></summary><p className="freshness">On serving lines or across the system; not confirmed station delays.</p><div className="alert-list">{related.map(alert=><AlertCard key={alert.id} alert={alert}/>)}</div></details>}
 </>}<a href="https://www.mta.info/alerts" target="_blank" rel="noreferrer">All MTA service alerts ↗</a></section>;
}
