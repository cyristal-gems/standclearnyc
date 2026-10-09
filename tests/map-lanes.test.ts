import {expect,test} from "vitest";
import type {Feature,LineString} from "geojson";
import {layoutRouteLanes} from "../lib/mta/map-lanes";
const route=(id:string,coordinates:number[][]):Feature<LineString>=>({type:"Feature",properties:{route:id,day:true,night:false},geometry:{type:"LineString",coordinates}});
test("all route pairs separate shared segments while keeping unshared paths centered",()=>{
 const result=layoutRouteLanes({type:"FeatureCollection",features:[route("2",[[0,0],[1,1],[2,2]]),route("5",[[1,1],[0,0]]),route("A",[[5,5],[6,6]])]});
 expect(result.features.filter(f=>f.properties?.route==="2").map(f=>f.properties?.laneOffset)).toEqual([-1.25,0]);
 expect(result.features.find(f=>f.properties?.route==="5")?.properties?.laneOffset).toBe(-1.25); // opposite travel direction keeps the other physical lane
 expect(result.features.find(f=>f.properties?.route==="A")?.properties?.laneOffset).toBe(0);
});

test("reverse trips and short turns do not draw the same route segment twice",()=>{
 const result=layoutRouteLanes({type:"FeatureCollection",features:[route("4",[[0,0],[1,1],[2,2]]),route("4",[[2,2],[1,1],[0,0]]),route("4",[[0,0],[1,1]])]});
 expect(result.features).toHaveLength(1);expect(result.features[0].geometry.coordinates).toEqual([[0,0],[1,1],[2,2]]);
});
test("day-only services do not create extra lanes in the night map",()=>{
 const day=route("5",[[0,0],[1,1]]);const both=route("2",[[0,0],[1,1]]);both.properties!.night=true;
 const result=layoutRouteLanes({type:"FeatureCollection",features:[day,both]});
 expect(result.features.find(f=>f.properties?.night)?.properties?.laneOffset).toBe(0);
 expect(result.features.filter(f=>f.properties?.day).map(f=>f.properties?.laneOffset)).toEqual([1.25,-1.25]);
});
