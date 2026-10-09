import {expect,test} from 'vitest';
import {decodeAccessibility,stationEquipment} from '../lib/mta/accessibility';
const inventory=[{equipmentno:'EL1',equipmenttype:'EL',isactive:'Y',ADA:'Y',elevatorsgtfsstopid:'L06',stationcomplexid:'119'}];
test('joins actual outages by equipment ID while separating upcoming work',()=>{
 const data=decodeAccessibility(inventory,[{equipment:'EL1',reason:'Repair',isupcomingoutage:'N'},{equipment:'EL1',reason:'Planned',isupcomingoutage:'Y'}]);
 expect(data.equipment[0].outage?.reason).toBe('Repair');expect(data.equipment[0].upcoming).toHaveLength(1);
 expect(stationEquipment(data,'L06','')).toHaveLength(1);expect(stationEquipment(data,'other','119')).toHaveLength(1);
});
test('future work does not imply a current outage; unmapped equipment remains visible as a coverage warning',()=>{
 const data=decodeAccessibility(inventory,[{equipment:'EL1',isupcomingoutage:'Y'},{equipment:'unknown'}]);expect(data.equipment[0].outage).toBeNull();expect(data.unmatchedOutages).toBe(1);
});
test('rejects broken feeds instead of reporting healthy equipment',()=>{expect(()=>decodeAccessibility([],[])).toThrow();expect(()=>decodeAccessibility(inventory,[{}])).toThrow();expect(decodeAccessibility(inventory,[]).equipment).toHaveLength(1)});
