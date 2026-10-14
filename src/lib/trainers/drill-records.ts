export const MAX_DRILL_RECORDS = 5;
export const MAX_DRILL_CHOICES = 20;
export type DrillRepair={revision:string;reflection:string;unchanged:boolean};
export type DrillRecord = { savedAt: string; draft: string; choices: number[]; attemptCount: number; revealedByHelp: boolean | null;repair?:DrillRepair };
export type DrillRecords = Record<string, DrillRecord[]>;
export function validDrillRepair(value:unknown,draft:string):value is DrillRepair{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;const v=value as Record<string,unknown>;
 return Object.keys(v).length===3&&['revision','reflection','unchanged'].every(key=>Object.hasOwn(v,key))&&typeof v.revision==='string'&&v.revision.length<=600&&v.revision.trim().length>=12&&typeof v.reflection==='string'&&v.reflection.length<=1000&&!!v.reflection.trim()&&typeof v.unchanged==='boolean'&&(v.unchanged?v.revision.trim()===draft.trim():v.revision.trim()!==draft.trim());
}

/** Keep the first choice and latest nineteen when a long retry trail is capped. */
export function appendDrillChoice(choices: number[], choice: number): number[] {
  return choices.length < MAX_DRILL_CHOICES ? [...choices, choice] : [choices[0], ...choices.slice(-(MAX_DRILL_CHOICES - 2)), choice];
}
export function appendDrillRecord(records: DrillRecords, id: string, record: DrillRecord): DrillRecords {
  return { ...records, [id]: [...(records[id] ?? []), record].slice(-MAX_DRILL_RECORDS) };
}
