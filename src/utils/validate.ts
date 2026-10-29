import { HttpError } from './HttpError';
import { TIMINGS, MeasureTiming } from '../types/diabetes';

/** 혈당 입력 한 건 (검증 후) */
export interface GlucoseInput {
  value: number;
  measuredAt: string;
  timing: MeasureTiming;
  memo: string;
}

/** 약 입력 (검증 후) */
export interface MedicationInput {
  name: string;
  schedule: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseId(raw: unknown): string {
  if (typeof raw !== 'string' || !UUID_RE.test(raw)) {
    throw new HttpError(400, '잘못된 id 형식입니다.');
  }
  return raw;
}

/** YYYY-MM-DD 날짜 문자열 검증 */
export function parseDateKey(raw: unknown): string {
  if (typeof raw !== 'string' || !DATE_RE.test(raw) || Number.isNaN(Date.parse(raw))) {
    throw new HttpError(400, 'date 는 YYYY-MM-DD 형식이어야 합니다.');
  }
  return raw;
}

export function parseGlucoseInput(body: Record<string, unknown>): GlucoseInput {
  const value = Number(body.value);
  if (!Number.isInteger(value) || value < 20 || value > 600) {
    throw new HttpError(400, '혈당 수치는 20~600 mg/dL 사이의 정수여야 합니다.');
  }

  const measuredAtMs = typeof body.measuredAt === 'string' ? Date.parse(body.measuredAt) : NaN;
  if (Number.isNaN(measuredAtMs)) {
    throw new HttpError(400, '측정 시각(measuredAt)이 올바르지 않습니다.');
  }
  // 미래 시각은 하루 여유까지만 허용 (시간대 차이 고려)
  if (measuredAtMs > Date.now() + 24 * 60 * 60 * 1000) {
    throw new HttpError(400, '측정 시각이 미래로 설정되어 있습니다.');
  }

  const timing = body.timing;
  if (typeof timing !== 'string' || !(TIMINGS as readonly string[]).includes(timing)) {
    throw new HttpError(400, '측정 시점(timing)이 올바르지 않습니다.');
  }

  const memo = typeof body.memo === 'string' ? body.memo.trim() : '';
  if (memo.length > 40) {
    throw new HttpError(400, '메모는 40자 이하여야 합니다.');
  }

  return {
    value,
    measuredAt: new Date(measuredAtMs).toISOString(),
    timing: timing as MeasureTiming,
    memo,
  };
}

export function parseMedicationInput(body: Record<string, unknown>): MedicationInput {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 1 || name.length > 30) {
    throw new HttpError(400, '약 이름은 1~30자여야 합니다.');
  }

  const schedule = typeof body.schedule === 'string' ? body.schedule.trim() : '';
  if (schedule.length > 30) {
    throw new HttpError(400, '복용 시간은 30자 이하여야 합니다.');
  }

  return { name, schedule };
}
