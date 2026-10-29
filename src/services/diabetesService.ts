import { withUser } from './db';
import { HttpError } from '../utils/HttpError';
import { GlucoseInput, MedicationInput } from '../utils/validate';
import {
  GlucoseRecordDto,
  GlucoseRow,
  MedicationDto,
  MedicationRow,
} from '../types/diabetes';

/* ============================================================
   매핑 (DB snake_case → API camelCase)
   ============================================================ */

const toGlucoseDto = (r: GlucoseRow): GlucoseRecordDto => ({
  id: r.id,
  value: r.value,
  measuredAt: new Date(r.measured_at).toISOString(),
  timing: r.timing,
  memo: r.memo,
});

const toMedicationDto = (r: MedicationRow): MedicationDto => ({
  id: r.id,
  name: r.name,
  schedule: r.schedule,
});

/* ============================================================
   혈당 기록
   ============================================================ */

export function listGlucose(userKey: string, limit = 200): Promise<GlucoseRecordDto[]> {
  return withUser(userKey, async client => {
    const { rows } = await client.query<GlucoseRow>(
      `select id, value, measured_at, timing, memo
         from glucose_records
        order by measured_at desc
        limit $1`,
      [limit],
    );
    return rows.map(toGlucoseDto);
  });
}

export function createGlucose(userKey: string, input: GlucoseInput): Promise<GlucoseRecordDto> {
  return withUser(userKey, async client => {
    const { rows } = await client.query<GlucoseRow>(
      `insert into glucose_records (user_key, value, measured_at, timing, memo)
       values (current_setting('app.user_key'), $1, $2, $3, $4)
       returning id, value, measured_at, timing, memo`,
      [input.value, input.measuredAt, input.timing, input.memo],
    );
    return toGlucoseDto(rows[0]);
  });
}

export function deleteGlucose(userKey: string, id: string): Promise<void> {
  return withUser(userKey, async client => {
    const { rowCount } = await client.query('delete from glucose_records where id = $1', [id]);
    if (!rowCount) throw new HttpError(404, '기록을 찾을 수 없습니다.');
  });
}

/* ============================================================
   약
   ============================================================ */

export function listMedications(userKey: string): Promise<MedicationDto[]> {
  return withUser(userKey, async client => {
    const { rows } = await client.query<MedicationRow>(
      `select id, name, schedule from medications order by created_at asc`,
    );
    return rows.map(toMedicationDto);
  });
}

export function createMedication(userKey: string, input: MedicationInput): Promise<MedicationDto> {
  return withUser(userKey, async client => {
    const { rows } = await client.query<MedicationRow>(
      `insert into medications (user_key, name, schedule)
       values (current_setting('app.user_key'), $1, $2)
       returning id, name, schedule`,
      [input.name, input.schedule],
    );
    return toMedicationDto(rows[0]);
  });
}

/** 약을 지우면 복용 기록도 함께 지워진다 (FK on delete cascade) */
export function deleteMedication(userKey: string, id: string): Promise<void> {
  return withUser(userKey, async client => {
    const { rowCount } = await client.query('delete from medications where id = $1', [id]);
    if (!rowCount) throw new HttpError(404, '약을 찾을 수 없습니다.');
  });
}

/** 특정 날짜에 복용 체크된 약 id 목록 */
export function listTakenOn(userKey: string, dateKey: string): Promise<string[]> {
  return withUser(userKey, async client => {
    const { rows } = await client.query<{ medication_id: string }>(
      `select medication_id from medication_logs where taken_on = $1`,
      [dateKey],
    );
    return rows.map(r => r.medication_id);
  });
}

/** 복용 체크 설정/해제. 약이 본인 것인지 RLS 로 먼저 확인한다. */
export function setTaken(userKey: string, medicationId: string, dateKey: string, taken: boolean): Promise<void> {
  return withUser(userKey, async client => {
    const { rowCount: exists } = await client.query(
      'select 1 from medications where id = $1',
      [medicationId],
    );
    if (!exists) throw new HttpError(404, '약을 찾을 수 없습니다.');

    if (taken) {
      await client.query(
        `insert into medication_logs (user_key, medication_id, taken_on)
         values (current_setting('app.user_key'), $1, $2)
         on conflict (user_key, medication_id, taken_on) do nothing`,
        [medicationId, dateKey],
      );
    } else {
      await client.query(
        'delete from medication_logs where medication_id = $1 and taken_on = $2',
        [medicationId, dateKey],
      );
    }
  });
}
