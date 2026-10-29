-- 혈당기록 미니앱 스키마 (Neon Postgres)
--
-- 실행 순서
--   1) 관리자(owner) 계정으로 아래 "테이블" 섹션 실행
--   2) 앱 전용 로그인 계정 생성 (아래 "앱 DB 계정" 섹션, 비밀번호는 직접 바꿔서 실행)
--   3) 앱 계정으로 .env 의 DATABASE_URL 설정
--
-- 접근 방식: 서버가 요청마다 트랜잭션을 열고 app.user_key 를 설정 → RLS 정책이 본인 행만 통과.
-- 앱 계정은 table owner 가 아니어야 RLS 가 적용됩니다. (owner 는 RLS 를 우회)

-- ============================================
-- 테이블
-- ============================================
create table if not exists public.glucose_records (
  id          uuid primary key default gen_random_uuid(),
  user_key    text not null,
  value       integer not null check (value between 20 and 600),
  measured_at timestamptz not null,
  timing      text not null check (timing in ('fasting', 'before-meal', 'after-meal', 'bedtime', 'other')),
  memo        text not null default '' check (char_length(memo) <= 40),
  created_at  timestamptz not null default now()
);

create index if not exists glucose_records_user_time_idx
  on public.glucose_records (user_key, measured_at desc);

create table if not exists public.medications (
  id         uuid primary key default gen_random_uuid(),
  user_key   text not null,
  name       text not null check (char_length(name) between 1 and 30),
  schedule   text not null default '' check (char_length(schedule) <= 30),
  created_at timestamptz not null default now()
);

create index if not exists medications_user_idx
  on public.medications (user_key, created_at);

-- 약을 지우면 복용 체크도 함께 지워짐
create table if not exists public.medication_logs (
  user_key      text not null,
  medication_id uuid not null references public.medications(id) on delete cascade,
  taken_on      date not null,
  created_at    timestamptz not null default now(),
  primary key (user_key, medication_id, taken_on)
);

-- ============================================
-- RLS: 본인 행만 접근 (app.user_key 세션 변수와 비교)
-- ============================================
alter table public.glucose_records  enable row level security;
alter table public.medications      enable row level security;
alter table public.medication_logs  enable row level security;

drop policy if exists own_glucose on public.glucose_records;
create policy own_glucose on public.glucose_records
  for all
  using (user_key = current_setting('app.user_key', true))
  with check (user_key = current_setting('app.user_key', true));

drop policy if exists own_medications on public.medications;
create policy own_medications on public.medications
  for all
  using (user_key = current_setting('app.user_key', true))
  with check (user_key = current_setting('app.user_key', true));

drop policy if exists own_medication_logs on public.medication_logs;
create policy own_medication_logs on public.medication_logs
  for all
  using (user_key = current_setting('app.user_key', true))
  with check (user_key = current_setting('app.user_key', true));

-- ============================================
-- 앱 DB 계정 (관리자가 직접 실행, 비밀번호는 여기 적지 말고 바꿔서 실행)
-- ============================================
-- create role app_server login password 'CHANGE_ME_STRONG_PASSWORD';
-- grant usage on schema public to app_server;
-- grant select, insert, update, delete on
--   public.glucose_records, public.medications, public.medication_logs
--   to app_server;
