export const EQUIPMENT_URL="https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fnyct_ene_equipments.json";
export const OUTAGES_URL="https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fnyct_ene.json";
type Row=Record<string,unknown>;
export type Equipment={id:string;kind:"Elevator"|"Escalator";station:string;stops:string[];complex:string;description:string;ada:boolean;thirdParty:boolean;alternative:string;outage:{reason:string;since:string;estimatedReturn:string}|null;upcoming:{reason:string;since:string;estimatedReturn:string}[]};
export type AccessibilityData={checkedAt:string;equipment:Equipment[];unmatchedOutages:number;error?:string};
const value=(row:Row,key:string)=>String(row[key]??"").trim();
export function decodeAccessibility(inventory:unknown,outages:unknown,checkedAt=new Date().toISOString()):AccessibilityData{
 if(!Array.isArray(inventory)||!inventory.length||!Array.isArray(outages))throw new Error("Invalid equipment feed");
 if(inventory.some(row=>!row||typeof row!=="object"||!value(row,"equipmentno"))||outages.some(row=>!row||typeof row!=="object"||!value(row,"equipment")))throw new Error("Equipment schema changed");
 const activeInventory=inventory.filter((row:Row)=>value(row,"isactive")!=="N"&&["EL","ES"].includes(value(row,"equipmenttype")));
 const ids=new Set(activeInventory.map((row:Row)=>value(row,"equipmentno")));
 const equipment:Equipment[]=activeInventory.map((row:Row)=>{
  const reports=outages.filter((outage:Row)=>value(outage,"equipment")===value(row,"equipmentno"));
  const detail=(outage:Row)=>({reason:value(outage,"reason"),since:value(outage,"outagedate"),estimatedReturn:value(outage,"estimatedreturntoservice")});
  const current=reports.find((outage:Row)=>value(outage,"isupcomingoutage")!=="Y");
  return {id:value(row,"equipmentno"),kind:value(row,"equipmenttype")==="EL"?"Elevator":"Escalator",station:value(row,"station"),stops:value(row,"elevatorsgtfsstopid").split(/[ ,;]+/).filter(Boolean),complex:value(row,"stationcomplexid"),description:value(row,"shortdescription")||value(row,"serving"),ada:value(row,"ADA")==="Y",thirdParty:value(row,"nonNYCT")==="Y",alternative:value(row,"alternativeroute"),outage:current?detail(current):null,upcoming:reports.filter((outage:Row)=>value(outage,"isupcomingoutage")==="Y").map(detail)};
 });
 return {checkedAt,equipment,unmatchedOutages:outages.filter((row:Row)=>!ids.has(value(row,"equipment"))).length};
}
export const stationEquipment=(data:AccessibilityData,stop:string,complex:string)=>data.equipment.filter(item=>item.stops.includes(stop)||Boolean(complex&&item.complex===complex));
export async function getAccessibility(){
 const [inventory,outages]=await Promise.all([EQUIPMENT_URL,OUTAGES_URL].map(async url=>{const response=await fetch(url,{next:{revalidate:60},signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error("Equipment feed unavailable");return response.json()}));
 return decodeAccessibility(inventory,outages);
}
