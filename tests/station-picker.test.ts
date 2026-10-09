import {expect,test} from 'vitest';
import {stationOptions} from '../lib/mta/station-picker';
import type {TransitData} from '../components/TransitMap';
const feature=(id:string,complexId:string,name:string,routes:string,ada:string)=>({type:'Feature' as const,geometry:{type:'Point' as const,coordinates:[-74,40]},properties:{id,complexId,name,day:true,night:true,dayRoutes:routes,nightRoutes:routes,ada}});
const data:TransitData={generatedAt:"2026-10-05",source:"test",routes:[],patterns:[],lines:{type:"FeatureCollection",features:[]},stations:{type:'FeatureCollection',features:[feature('a','1','Union Sq','4 5','1'),feature('b','1','Union Sq','L','2'),feature('c','2','Union Sq','N','0')]}};
test('merges connected platforms by official complex ID but keeps unrelated names distinct',()=>{const options=stationOptions(data);expect(options).toHaveLength(2);expect(options[0].members).toHaveLength(2);expect(options[0].routes).toEqual(['4','5','L'])});
test('route selection chooses a member served by that route',()=>{const options=stationOptions(data,{line:'L'});expect(options).toHaveLength(1);expect(options[0].id).toBe('b')});
test('accessibility filters retain station context and search covers all platform names',()=>{expect(stationOptions(data,{accessibility:'full'})).toHaveLength(1);expect(stationOptions(data,{accessibility:'any'})).toHaveLength(1);expect(stationOptions(data,{search:'unknown'})).toHaveLength(0)});
