export const RELIABILITY_SOURCE='https://data.ny.gov/d/f6rf-2a3t';
export const performanceLines:Record<string,string[]>={...Object.fromEntries(['1','2','3','4','5','6','7','A','B','C','D','E','F','G','L','M','N','Q','R','W'].map(line=>[line,[line]])),FX:['F'],'6X':['6'],'7X':['7'],J:['J','JZ'],Z:['JZ'],GS:['GS','S 42nd'],FS:['FS','S Fkln'],H:['H','S Rock']};
export type Performance={month:string;dayType:number;onTimeTrips:number;scheduledTrips:number;percent:number;reportedLines:string[]};
export function normalizePerformance(rows:unknown):Performance[]{
 if(!Array.isArray(rows))throw new Error('Invalid performance dataset');
 const grouped=new Map<string,Performance>();const seen=new Set<string>();
 for(const r of rows){
  const month=String(r.month??'').slice(0,10),dayType=Number(r.day_type),onTimeTrips=Number(r.num_on_time_trips),scheduledTrips=Number(r.num_sched_trips),reported=Number(r.terminal_on_time_performance);
  if(!/^\d{4}-\d{2}-01$/.test(month)||![1,2].includes(dayType)||!Number.isFinite(onTimeTrips)||!Number.isFinite(scheduledTrips)||scheduledTrips<=0||onTimeTrips<0||onTimeTrips>scheduledTrips||!Number.isFinite(reported)||Math.abs(reported-onTimeTrips/scheduledTrips)>.001)throw new Error('Performance schema or totals changed');
  const identity=`${month}:${dayType}:${r.line}`;if(seen.has(identity))throw new Error('Duplicate performance record');seen.add(identity);
  const key=`${month}:${dayType}`,entry=grouped.get(key)??{month,dayType,onTimeTrips:0,scheduledTrips:0,percent:0,reportedLines:[]};
  entry.onTimeTrips+=onTimeTrips;entry.scheduledTrips+=scheduledTrips;entry.percent=100*entry.onTimeTrips/entry.scheduledTrips;entry.reportedLines.push(String(r.line));grouped.set(key,entry);
 }
 return [...grouped.values()].sort((a,b)=>b.month.localeCompare(a.month)||a.dayType-b.dayType);
}
