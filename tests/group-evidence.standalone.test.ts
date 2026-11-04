// Failure cases: the new report or selected reading background loses evidence after character 6000;
// a very long body consumes an unbounded context; changing the body allowance damages short reports.
import './standalone.ts';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { batchUser, describeReport, type ReportView } from '@aihot/backend/events/relate';

test('grouping includes late evidence from both sides within its ten-thousand-character allowance',()=>{
  const sourceText='a'.repeat(6500)+'LATE-INDEPENDENT-EVIDENCE'+'b'.repeat(3500)+'BEYOND-THE-LIMIT';
  const report:ReportView={title:'A long read on the research release',source:'Example',firstParty:false,at:new Date(),summary:'Overview',sourceText};
  const prompt=batchUser(report,[],'New report',[{report:{...report,sourceText:null},sourceText}]);
  assert.equal(prompt.split('LATE-INDEPENDENT-EVIDENCE').length-1,2);
  assert.ok(!prompt.includes('BEYOND-THE-LIMIT'));
  assert.ok(describeReport({...report,sourceText:'Short body'},'New report').includes('Short body'));
});
