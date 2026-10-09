import type {FeatureCollection,LineString,Position} from "geojson";
const pointKey=(point:Position)=>point.slice(0,2).map(value=>value.toFixed(5)).join(",");
function segment(a:Position,b:Position){const first=pointKey(a),last=pointKey(b);return {key:first<last?`${first}|${last}`:`${last}|${first}`,direction:first<last?1:-1};}
/** Draw each route segment once per service view, with lanes only for routes active in that view. */
export function layoutRouteLanes(lines:FeatureCollection<LineString>):FeatureCollection<LineString>{
 const features:FeatureCollection<LineString>["features"]=[];
 for(const mode of ["day","night"] as const){
  const active=lines.features.filter(feature=>feature.properties?.[mode]);
  const shared=new Map<string,Set<string>>();
  for(const feature of active){const points=feature.geometry.coordinates;for(let i=1;i<points.length;i++){const key=segment(points[i-1],points[i]).key;const routes=shared.get(key)??new Set<string>();routes.add(String(feature.properties?.route));shared.set(key,routes);}}
  const drawn=new Set<string>();
  for(const feature of active){const points=feature.geometry.coordinates;let run:Position[]=[];let offset=0;
   const flush=()=>{if(run.length>1)features.push({...feature,id:undefined,properties:{...feature.properties,day:mode==="day",night:mode==="night",laneOffset:offset},geometry:{type:"LineString",coordinates:run}});run=[];};
   for(let i=1;i<points.length;i++){
    const info=segment(points[i-1],points[i]);const route=String(feature.properties?.route);const identity=route+":"+info.key;
    // GTFS contains reverse-direction, short-turn and repeated trip shapes on the same tracks.
    if(drawn.has(identity)){flush();continue;}drawn.add(identity);
    const routes=[...shared.get(info.key)!].sort((a,b)=>a.localeCompare(b,"en",{numeric:true}));const next=(routes.indexOf(route)-(routes.length-1)/2)*2.5*info.direction;
    if(run.length&&next!==offset)flush();if(!run.length){run=[points[i-1]];offset=next;}run.push(points[i]);
   }flush();
  }
 }
 return {type:"FeatureCollection",features};
}
