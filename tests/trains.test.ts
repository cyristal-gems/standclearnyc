import {describe, expect, test, vi, afterEach} from "vitest";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import {decodeTrains, getTrains, TRAIN_FEEDS} from "../lib/mta/trains";
const gtfs=GtfsRealtimeBindings.transit_realtime;
function sample(timestamp=1000){return gtfs.FeedMessage.create({header:{gtfsRealtimeVersion:"1.0",timestamp},entity:[
 {id:"trip",tripUpdate:{trip:{tripId:"train",startDate:"20261004",routeId:"4"},stopTimeUpdate:[{stopId:"626N",arrival:{time:1030}},{stopId:"625N",arrival:{time:1110}},{stopId:"621N",arrival:{time:1300}}]}},
 {id:"vehicle",vehicle:{trip:{tripId:"train",startDate:"20261004",routeId:"4"},stopId:"626N",timestamp:995,currentStatus:0}}
]})}
const encode=(feed:ReturnType<typeof sample>)=>gtfs.FeedMessage.encode(feed).finish();
afterEach(()=>vi.unstubAllGlobals());
describe("MTA train reports",()=>{
 test("joins vehicles and trip predictions without inventing GPS positions",()=>{const result=decodeTrains(encode(sample()),1000);expect(result.trains[0]).toMatchObject({route:"4",stop:"626",direction:"N",status:"Approaching",destination:"621",awaitingUpdate:false});expect(result.trains[0]).not.toHaveProperty("coordinates");expect(result.arrivals.map(a=>a.time)).toEqual([1030,1110,1300])});
 test("unstarted trips can forecast arrivals but cannot become train markers",()=>{const feed=sample();feed.entity=feed.entity.filter(e=>e.tripUpdate);const result=decodeTrains(encode(feed),1000);expect(result.trains).toHaveLength(0);expect(result.arrivals).toHaveLength(3)});
 test("omits cancelled trips and skipped stops",()=>{const feed=sample();feed.entity[0].tripUpdate!.stopTimeUpdate![0].scheduleRelationship=1;expect(decodeTrains(encode(feed),1000).arrivals.map(a=>a.stop)).toEqual(["625","621"]);feed.entity[0].tripUpdate!.trip!.scheduleRelationship=3;expect(decodeTrains(encode(feed),1000).trains).toHaveLength(0)});
 test("pauses prediction countdowns when the movement report is old",()=>{const feed=sample();feed.entity[1].vehicle!.timestamp=800;const result=decodeTrains(encode(feed),1000);expect(result.trains[0].awaitingUpdate).toBe(true);expect(result.arrivals.every(a=>a.awaitingUpdate)).toBe(true)});
 test("rejects expired or future-dated feeds",()=>{expect(()=>decodeTrains(encode(sample(500)),1000)).toThrow("Stale");expect(()=>decodeTrains(encode(sample(1100)),1000)).toThrow("Stale")});
 test("keeps fresh lines when another feed fails and exposes incomplete coverage",async()=>{vi.stubGlobal("fetch",vi.fn(async (url:string)=>{if(url.endsWith("gtfs")){const feed=sample(Math.floor(Date.now()/1000));return new Response(new Uint8Array(encode(feed)).buffer)}return new Response("",{status:503})}));const result=await getTrains();expect(result.partial).toBe(true);expect(result.feeds).toHaveLength(TRAIN_FEEDS.length);expect(result.trains).toHaveLength(1);expect(result.error).toBeUndefined()});
 test("an all-feed failure returns no obsolete trains or predictions",async()=>{vi.stubGlobal("fetch",vi.fn(async()=>{throw new Error("offline")}));const result=await getTrains();expect(result.error).toBeTruthy();expect(result.trains).toEqual([]);expect(result.arrivals).toEqual([])});
});
