"use client";
import {useState} from "react";
import LineReliability from "./LineReliability";
import {routeLabel} from "../lib/mta/route-display";
import type {TransitData} from "./TransitMap";

export default function HistoricalData({data}:{data:TransitData|null}) {
 const [line,setLine]=useState("");
 return <section className="historical-reliability"><div className="label">HISTORICAL DATA</div><h2>Line reliability over time.</h2><p>Explore MTA’s monthly terminal on-time performance by train line.</p><label htmlFor="historical-line">Choose a train line</label><select id="historical-line" value={line} onChange={event=>setLine(event.target.value)} disabled={!data}><option value="">Select a train line</option>{data?.routes.map(route=><option key={route.id} value={route.id}>{routeLabel(route.id)} · {route.name}</option>)}</select>{line?<LineReliability key={line} line={line}/>:<p>Select a line to view its historical performance.</p>}</section>;
}
