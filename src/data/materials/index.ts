import { SAT_RW_MATERIALS } from './sat-rw-materials';
import { SAT_MATH_MATERIALS } from './sat-math-materials';
import { IELTS_MATERIALS } from './ielts-materials';
import type { Material } from '@/lib/types';

export const MATERIALS: Material[] = [
  ...SAT_RW_MATERIALS,
  ...SAT_MATH_MATERIALS,
  ...IELTS_MATERIALS,
];

const BY_ID = new Map(MATERIALS.map((m) => [m.id, m]));

export function getMaterial(id?: string): Material | undefined {
  if (!id) return undefined;
  return BY_ID.get(id);
}
