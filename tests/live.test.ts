import {describe,expect,test} from "vitest";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import {decodeAlerts,isActive,verdict,stationAlerts} from "../lib/mta/live";
describe("current-service evidence",()=>{
 test("excludes future and expired periods, includes open-ended active periods",()=>{expect(isActive([{start:200}],100)).toBe(false);expect(isActive([{end:99}],100)).toBe(false);expect(isActive([{start:99}],100)).toBe(true)});
 test("rejects a stale feed instead of presenting a healthy system",()=>{const feed=GtfsRealtimeBindings.transit_realtime.FeedMessage.create({header:{gtfsRealtimeVersion:"2.0",timestamp:100},entity:[]});expect(()=>decodeAlerts(GtfsRealtimeBindings.transit_realtime.FeedMessage.encode(feed).finish(),701)).toThrow("Stale")});
 test("unknown alert effects cannot produce a favorable verdict",()=>{expect(verdict([{id:"test",routes:["A"],header:"Advisory",description:"",effect:8,active:true}]).verdict).toBeNull();expect(verdict([]).verdict).toBeNull()});
 test("significant delay evidence yields a service verdict without a walking ETA",()=>{const result=verdict([{id:"test",routes:["A"],header:"Delay",description:"",effect:3,active:true}]);expect(result.verdict).toBe("I'm Walkin' Here");expect(result.explanation).toContain("not a walking-time comparison")});
});

describe("station-specific advisory evidence",()=>{
 test("matches directional platforms and preserves broader line context",()=>{
  const direct={id:"station",routes:["4"],header:"Station delay",description:"",effect:3,active:true,selectors:[{routeId:"4",stopId:"626N"}]};
  const elsewhere={...direct,id:"other-stop",selectors:[{routeId:"4",stopId:"627N"}]};
  const route={...direct,id:"route",selectors:[{routeId:"4"}]};
  const unrelated={...direct,id:"other-line",routes:["A"],selectors:[{routeId:"A"}]};
  const scoped=stationAlerts([direct,elsewhere,route,unrelated],["626"],["4","5","6"]);
  expect(scoped.direct.map(alert=>alert.id)).toEqual(["station"]);
  expect(scoped.related.map(alert=>alert.id)).toEqual(["other-stop","route"]);
  expect(verdict(scoped.direct).verdict).toBe("I'm Walkin' Here");
 });
 test("a route delay alone cannot become a confirmed station verdict",()=>{
  const scoped=stationAlerts([{id:"route",routes:["5"],header:"Delay",description:"",effect:3,active:true,selectors:[{routeId:"5"}]}],["626"],["5"]);
  expect(verdict(scoped.direct).verdict).toBeNull();expect(scoped.related).toHaveLength(1);
 });
 test("decoding retains informed station selectors",()=>{
  const feed=GtfsRealtimeBindings.transit_realtime.FeedMessage.create({header:{gtfsRealtimeVersion:"2.0",timestamp:100},entity:[{id:"station",alert:{informedEntity:[{routeId:"4",stopId:"626S"}],effect:3}}]});
  expect(decodeAlerts(GtfsRealtimeBindings.transit_realtime.FeedMessage.encode(feed).finish(),100).alerts[0].selectors).toEqual([{routeId:"4",stopId:"626S"}]);
 });
});


describe("live prediction verdicts",()=>{
 const now=1000;
 const trains={checkedAt:new Date(now*1000).toISOString(),partial:false,feeds:[],trains:[],arrivals:[{trainId:"trip",route:"4",stop:"626",direction:"N",destination:"640",time:now+120,awaitingUpdate:false,delayed:false}]};
 const context={trains,stops:["626"],routes:["4"],related:[],now};
 test("fresh near-term station arrival can support Catch That Train",()=>{expect(verdict([],context).verdict).toBe("Catch That Train!")});
 test("partial, stale, delayed or paused predictions cannot support a positive verdict",()=>{
  for(const patch of [{partial:true},{checkedAt:new Date((now-61)*1000).toISOString()},{arrivals:[{...trains.arrivals[0],delayed:true}]},{arrivals:[{...trains.arrivals[0],awaitingUpdate:true}]},{arrivals:[{...trains.arrivals[0],time:now+301}]}])expect(verdict([],{...context,trains:{...trains,...patch}}).verdict).toBeNull();
 });
 test("broader unknown advisory blocks a positive station verdict without claiming a station delay",()=>{expect(verdict([],{...context,related:[{id:"line",routes:["4"],header:"Advisory",description:"",effect:8,active:true}]}).verdict).toBeNull()});
 test("MTA Mercury delay priority supplies disruption evidence even with unknown generic effect",()=>{expect(verdict([{id:"delay",routes:["4"],header:"Delays",description:"",effect:8,active:true,priorities:[{routeId:"4",priority:26}]}]).verdict).toBe("I'm Walkin' Here")});
});

describe("MTA Mercury extension decoding",()=>{
 const join=(...parts:Uint8Array[])=>new Uint8Array(parts.flatMap(part=>Array.from(part)));
 const integer=(value:number)=>{const bytes=[];while(value>127){bytes.push((value&127)|128);value=Math.floor(value/128)}bytes.push(value);return new Uint8Array(bytes)};
 const field=(id:number,value:Uint8Array)=>join(integer(id*8+2),integer(value.length),value);
 const text=(value:string)=>new TextEncoder().encode(value);
 test("retains official category, selector priority and affected stations",()=>{
  const selector=join(GtfsRealtimeBindings.transit_realtime.EntitySelector.encode({routeId:"4"}).finish(),field(1001,field(1,text("MTASBWY:4:26"))));
  const station=GtfsRealtimeBindings.transit_realtime.EntitySelector.encode({routeId:"4",stopId:"626N"}).finish();
  const alert=join(field(5,selector),field(1001,join(field(3,text("Delays")),field(10,station))));
  const header=GtfsRealtimeBindings.transit_realtime.FeedHeader.encode({gtfsRealtimeVersion:"2.0",timestamp:100}).finish();
  const feed=join(field(1,header),field(2,join(field(1,text("mercury")),field(5,alert))));
  const result=decodeAlerts(feed,100).alerts[0];
  expect(result.category).toBe("Delays");expect(result.priorities?.[0].priority).toBe(26);expect(result.selectors).toContainEqual({routeId:"4",stopId:"626N"});expect(verdict([result]).verdict).toBe("I'm Walkin' Here");
 });
});


describe("route-wide verdict evidence",()=>{
 const now=1000;const trains={checkedAt:new Date(now*1000).toISOString(),partial:false,feeds:[],arrivals:[],trains:[{id:"4-trip",route:"4",stop:"626",direction:"N",status:"In transit" as const,destination:"640",timestamp:now,feedTimestamp:now,awaitingUpdate:false,delayed:false}]};
 const context={trains,stops:[],routes:["4"],related:[],now,scope:"route" as const};
 test("operating reports support a route-wide category without requiring a station",()=>{const result=verdict([],context);expect(result.verdict).toBe("Catch That Train!");expect(result.explanation).toContain("entire route")});
 test("other lines, paused reports, partial coverage and advisories cannot imply a favorable route",()=>{
  expect(verdict([],{...context,routes:["3"]}).verdict).toBeNull();
  expect(verdict([],{...context,trains:{...trains,partial:true}}).verdict).toBeNull();
  expect(verdict([],{...context,trains:{...trains,trains:[{...trains.trains[0],awaitingUpdate:true}]}}).verdict).toBeNull();
  expect(verdict([{id:"change",routes:["4"],header:"Change",description:"",effect:8,active:true}],context).verdict).toBeNull();
 });
});

 test("accepts alert snapshots between five and ten minutes old, while rejecting future timestamps",()=>{const g=GtfsRealtimeBindings.transit_realtime;const feed=g.FeedMessage.create({header:{gtfsRealtimeVersion:"2.0",timestamp:100},entity:[]});const bytes=g.FeedMessage.encode(feed).finish();expect(decodeAlerts(bytes,500).alerts).toEqual([]);expect(()=>decodeAlerts(bytes,30)).toThrow("Stale")});
