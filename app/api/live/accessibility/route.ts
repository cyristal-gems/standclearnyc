export const maxDuration=30;
import {getAccessibility} from "../../../../lib/mta/accessibility";
export async function GET(){try{return Response.json(await getAccessibility(),{headers:{"Cache-Control":"no-store"}})}catch{return Response.json({checkedAt:new Date().toISOString(),equipment:[],unmatchedOutages:0,error:"Live elevator and escalator reports are unavailable"},{status:503,headers:{"Cache-Control":"no-store"}})}}
