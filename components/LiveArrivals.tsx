"use client";
import {useEffect, useState} from "react";
import type {TrainData} from "../lib/mta/trains";
import RouteBullet from "./RouteBullet";

export default function LiveArrivals({data, stops, line, names}: {data: TrainData | null; stops: string[]; line: string; names: Record<string, string>}) {
  const [now, setNow] = useState(() => Date.now()/1000);
  useEffect(() => {const timer = setInterval(() => setNow(Date.now()/1000), 10000);return () => clearInterval(timer)}, []);
  const fresh = data && now - new Date(data.checkedAt).getTime()/1000 < 60;
  const arrivals = fresh ? data.arrivals.filter(arrival => stops.includes(arrival.stop) && (!line || arrival.route === line || arrival.route === line.replace(/X$/, "")) && arrival.time >= now) : [];
  return <section className="live-arrivals"><div className="section-heading"><h3>Live arrivals</h3><span>MTA · 30 SEC REFRESH</span></div>
    {!data ? <p>Connecting to live trains…</p> : data.error || !fresh ? <p role="status">Live arrivals are unavailable. Check MTA before traveling.</p> : <>
      {data.partial && <p className="freshness">Some lines could not refresh; arrival coverage is incomplete.</p>}
      {["N", "S"].map(direction => <div className="arrival-direction" key={direction}><h4>{direction === "N" ? "Northbound" : "Southbound"}</h4>
        {arrivals.filter(arrival => arrival.direction === direction).slice(0,3).map(arrival => <div className="arrival-row" key={`${arrival.trainId}:${arrival.stop}`}><RouteBullet id={arrival.route}/><span>To {names[arrival.destination] ?? "destination unavailable"}</span><strong>{arrival.delayed ? "Delayed" : arrival.awaitingUpdate ? "Awaiting update" : `${Math.max(1,Math.ceil((arrival.time-now)/60))} min`}</strong></div>)}
        {!arrivals.some(arrival => arrival.direction === direction) && <p className="freshness">No upcoming prediction in the current feed.</p>}
      </div>)}<p className="freshness">MTA arrival estimates can change. An old movement report pauses the countdown.</p>
    </>}
  </section>;
}
