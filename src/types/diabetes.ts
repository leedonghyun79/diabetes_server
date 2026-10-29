/** 측정 시점 (클라이언트 TIMING 값과 동일하게 유지) */
export const TIMINGS = ['fasting', 'before-meal', 'after-meal', 'bedtime', 'other'] as const;
export type MeasureTiming = (typeof TIMINGS)[number];

/** API 응답용 혈당 기록 (camelCase) */
export interface GlucoseRecordDto {
  id: string;
  value: number;
  measuredAt: string;
  timing: MeasureTiming;
  memo: string;
}

/** API 응답용 약 (camelCase) */
export interface MedicationDto {
  id: string;
  name: string;
  schedule: string;
}

/** DB 행 (snake_case) */
export interface GlucoseRow {
  id: string;
  user_key: string;
  value: number;
  measured_at: string;
  timing: MeasureTiming;
  memo: string;
}

export interface MedicationRow {
  id: string;
  user_key: string;
  name: string;
  schedule: string;
}
