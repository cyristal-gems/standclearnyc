"use client";
import {routeLabel,routeColor} from "../lib/mta/route-display";
import {useState} from "react";
import RouteBullet from "./RouteBullet";
import facts from "../data/line-facts.json";
import type {TransitData} from "./TransitMap";
const entries:Record<string,{title:string;text:string;source:string;url:string}>=facts;
export default function LineFacts({data}:{data:TransitData|null}){
 const [line,setLine]=useState("");
 const routes=data?.routes.filter(route=>!line||route.id===line)??[];
 return <section className="line-facts"><div className="label">A LITTLE NYC CURIOSITY</div><h2>Every line has a story.</h2><p>Discover hidden artwork, engineering surprises, subway history, and the quirks that make each service different.</p><label className="verdict-route">Explore a line<select value={line} onChange={event=>setLine(event.target.value)}><option value="">All lines</option>{data?.routes.map(route=><option key={route.id} value={route.id}>{routeLabel(route.id)} · {route.name}</option>)}</select></label><div className="line-fact-grid">{routes.map(route=>{const fact=entries[route.id];return fact&&<article key={route.id} style={{borderTopColor:routeColor(route.id)}}><div className="fact-route"><RouteBullet id={route.id}/><small>{route.name}</small></div><h3>{fact.title}</h3><p>{fact.text}</p><a href={fact.url} target="_blank" rel="noreferrer">{fact.source} ↗</a></article>})}</div>{!data&&<p role="status">Loading line facts…</p>}<p className="facts-note">Each fact links to its MTA source. Shared stations can belong to several lines; service facts describe typical patterns, not current travel instructions. Check live advisories before riding.</p></section>
}
