import { PartKey, PartRule } from '../types';

export const PARTS: PartRule[] = [
  { key: 'meat', label: 'لحم', perCow: 7, exclusive: false, icon: '🥩' },
  { key: 'liver', label: 'كبدة', perCow: 7, exclusive: false, icon: '🤎' },
  { key: 'kidney', label: 'كلاوي', perCow: 7, exclusive: false, icon: '🫘' },
  { key: 'heart', label: 'قلب', perCow: 7, exclusive: false, icon: '🫀' },
  { key: 'spleen', label: 'طحال', perCow: 1, exclusive: true, icon: '🩸' },
  { key: 'tripe', label: 'كرشة', perCow: 7, exclusive: false, icon: '🥘' },
  { key: 'lungs', label: 'فشة', perCow: 7, exclusive: false, icon: '🫁' },
  { key: 'intestines', label: 'ممبار', perCow: 7, exclusive: false, icon: '🌭' },
  { key: 'frontLeg', label: 'رجل أمامية', perCow: 2, exclusive: false, icon: '🍖' },
  { key: 'backLeg', label: 'رجل خلفية', perCow: 2, exclusive: false, icon: '🦴' },
  { key: 'head', label: 'رأس', perCow: 7, exclusive: false, icon: '🐮' },
];

export const PARTS_MAP: Record<PartKey, PartRule> = PARTS.reduce(
  (acc, part) => ({ ...acc, [part.key]: part }),
  {} as Record<PartKey, PartRule>
);

export const DEFAULT_SHARES_PER_COW = 7;

export function updateGlobalParts(newParts: PartRule[]) {
  PARTS.length = 0;
  newParts.forEach(p => PARTS.push(p));
  
  for (const key in PARTS_MAP) {
    delete PARTS_MAP[key as PartKey];
  }
  newParts.forEach(p => {
    PARTS_MAP[p.key as PartKey] = p;
  });
}
