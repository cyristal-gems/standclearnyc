import {expect,test} from "vitest";
import {getNextStops,getRouteTerminals} from "../lib/mta/topology";
const graph={stations:{features:[{properties:{id:"a",name:"A"}},{properties:{id:"b",name:"B"}},{properties:{id:"c",name:"C"}}]},patterns:[{route:"1",headsign:"North terminal",directionLabel:"Northbound",stops:["a","b","c"],modes:["day"]},{route:"1",headsign:"South terminal",directionLabel:"Southbound",stops:["c","b","a"],modes:["day"]}]};
test("next stops follow each official sequence and direction",()=>{const stops=getNextStops(graph,"b","1","day");expect(stops.map(s=>[s.direction,s.name])).toEqual([["Northbound","C"],["Southbound","A"]])});
test("does not invent topology in an unavailable service mode",()=>{expect(getNextStops(graph,"b","1","night")).toEqual([])});
test("a terminal is an end of route, not a fabricated next station",()=>{expect(getNextStops(graph,"c","1","day").find(s=>s.direction==="Northbound")?.terminal).toBe(true)});

test("route terminals use the final station of each official direction",()=>{expect(getRouteTerminals(graph,"1","day")).toEqual([{id:"c",name:"C",direction:"Northbound"},{id:"a",name:"A",direction:"Southbound"}]);expect(getRouteTerminals(graph,"1","night")).toEqual([])});
test("full route terminals precede short-turn destinations",()=>{const withShortTurn={...graph,patterns:[{route:"1",headsign:"Short turn",directionLabel:"Northbound",stops:["a","b"],modes:["day"]},...graph.patterns]};expect(getRouteTerminals(withShortTurn,"1","day").filter(t=>t.direction==="Northbound").map(t=>t.id)).toEqual(["c","b"])});
