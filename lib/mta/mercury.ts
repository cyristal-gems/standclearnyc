import GtfsRealtimeBindings from "gtfs-realtime-bindings";

// MTA Mercury extension 1001: alert type, affected stations and selector priority.
// Schema linked by https://www.mta.info/developers (gtfs-realtime-service-status.proto).
function fields(bytes:Uint8Array){
 let offset=0;
 const number=()=>{let value=0,shift=0;for(let i=0;i<10;i++){if(offset>=bytes.length)throw new Error("Truncated protobuf");const byte=bytes[offset++];value+=(byte&127)*2**shift;if(!(byte&128))return value;shift+=7}throw new Error("Invalid protobuf")};
 const result:{id:number;bytes:Uint8Array}[]=[];
 while(offset<bytes.length){const tag=number(),wire=tag&7,id=Math.floor(tag/8);if(wire===2){const length=number();if(offset+length>bytes.length)throw new Error("Truncated protobuf");result.push({id,bytes:bytes.subarray(offset,offset+length)});offset+=length}else if(wire===0)number();else if(wire===1)offset+=8;else if(wire===5)offset+=4;else throw new Error("Unsupported protobuf wire type");if(offset>bytes.length)throw new Error("Truncated protobuf")}
 return result;
}
const string=(bytes:Uint8Array)=>new TextDecoder().decode(bytes);
export function mercuryAlerts(bytes:Uint8Array){
 const result=new Map<string,{category?:string;priorities:{routeId?:string|null;stopId?:string|null;priority:number}[];stations:{routeId?:string|null;stopId?:string|null}[]}>();
 for(const entity of fields(bytes).filter(field=>field.id===2)){
  const parts=fields(entity.bytes),id=parts.find(field=>field.id===1);if(!id)continue;
  const alert=parts.find(field=>field.id===5);if(!alert)continue;
  let category:string|undefined;const priorities:{routeId?:string|null;stopId?:string|null;priority:number}[]=[];const stations:{routeId?:string|null;stopId?:string|null}[]=[];
  for(const field of fields(alert.bytes)){
   if(field.id===5){const selector=GtfsRealtimeBindings.transit_realtime.EntitySelector.decode(field.bytes);for(const extension of fields(field.bytes).filter(part=>part.id===1001)){const order=fields(extension.bytes).find(part=>part.id===1);if(order){const priority=Number(string(order.bytes).split(":").at(-1));if(Number.isInteger(priority)&&priority>=1&&priority<=35)priorities.push({routeId:selector.routeId,stopId:selector.stopId,priority})}}}
   if(field.id===1001)for(const metadata of fields(field.bytes)){if(metadata.id===3)category=string(metadata.bytes);if(metadata.id===10){const station=GtfsRealtimeBindings.transit_realtime.EntitySelector.decode(metadata.bytes);stations.push({routeId:station.routeId,stopId:station.stopId})}}
  }
  result.set(string(id.bytes),{category,priorities,stations});
 }
 return result;
}
