export const MAX_DRILL_RECORDS = 5;
export const MAX_DRILL_CHOICES = 20;
export type DrillRecord = { savedAt: string; draft: string; choices: number[]; attemptCount: number; revealedByHelp: boolean | null };
export type DrillRecords = Record<string, DrillRecord[]>;

/** Keep the first choice and latest nineteen when a long retry trail is capped. */
export function appendDrillChoice(choices: number[], choice: number): number[] {
  return choices.length < MAX_DRILL_CHOICES ? [...choices, choice] : [choices[0], ...choices.slice(-(MAX_DRILL_CHOICES - 2)), choice];
}
export function appendDrillRecord(records: DrillRecords, id: string, record: DrillRecord): DrillRecords {
  return { ...records, [id]: [...(records[id] ?? []), record].slice(-MAX_DRILL_RECORDS) };
}
