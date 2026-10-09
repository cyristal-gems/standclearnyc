import {expect,test} from 'vitest';
import {normalizePerformance} from '../lib/mta/reliability';
const row=(line:string,on:number,total:number,day='1')=>({month:'2026-08-01T00:00:00.000',line,day_type:day,num_on_time_trips:String(on),num_sched_trips:String(total),terminal_on_time_performance:String(on/total)});
test('weights joint measurements by trips instead of averaging percentages',()=>{expect(normalizePerformance([row('J',100,100),row('JZ',0,900)])[0].percent).toBe(10)});
test('keeps weekday and weekend records separate',()=>{expect(normalizePerformance([row('4',80,100),row('4',90,100,'2')])).toHaveLength(2)});
test('rejects inconsistent rates and duplicate source rows',()=>{expect(()=>normalizePerformance([{...row('4',80,100),terminal_on_time_performance:'0.2'}])).toThrow();expect(()=>normalizePerformance([row('4',80,100),row('4',80,100)])).toThrow();expect(()=>normalizePerformance([row('4',0,0)])).toThrow()});
