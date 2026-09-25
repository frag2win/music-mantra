export type HealthCondition = 'diabetes' | 'thyroid' | 'hypertension';

export interface ConditionDetail {
  id: HealthCondition;
  name: string;
  chakra: string;
  swar: string;
  mantra: string;
  ratio: number;
  cents: number;
  description: string;
}

export const CONDITION_DETAILS: Record<HealthCondition, ConditionDetail> = {
  diabetes: {
    id: 'diabetes',
    name: 'Diabetes',
    chakra: 'Manipura',
    swar: 'Ga',
    mantra: 'Ram',
    ratio: 5 / 4,
    cents: 386.3,
    description: 'Solar Plexus Chakra — Ga swara for metabolic balance.'
  },
  thyroid: {
    id: 'thyroid',
    name: 'Thyroid',
    chakra: 'Vishuddha',
    swar: 'Pa',
    mantra: 'Ham',
    ratio: 3 / 2,
    cents: 702.0,
    description: 'Throat Chakra — Pa swara for endocrine harmony.'
  },
  hypertension: {
    id: 'hypertension',
    name: 'Hypertension',
    chakra: 'Anahata',
    swar: 'Ma',
    mantra: 'Yam',
    ratio: 4 / 3,
    cents: 498.0,
    description: 'Heart Chakra — Ma swara for cardiovascular relaxation.'
  }
};

export interface SessionRecord {
  id: string;
  programId?: string;
  dayIndex: number;
  date: string; // ISO string
  condition: HealthCondition;
  saNote: string;
  saHz: number;
  evalAccuracy: number;
  meanAccuracy: number;
  voicedSeconds: number;
  totalDurationSeconds: number;
  completed: boolean;
}

export interface UserProgram {
  id: string;
  condition: HealthCondition;
  startedAt: string;
  currentDay: number;
  totalDays: number;
  active: boolean;
}
