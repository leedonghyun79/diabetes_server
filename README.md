# diabetes-server

혈당기록 미니앱 백엔드. 토스 로그인(mTLS)으로 사용자를 확인하고, 혈당 기록·약·복용 체크를 Neon Postgres에 저장합니다.

## 시작하기

```bash
npm install
cp .env.example .env   # 값 채우기 (DATABASE_URL 등)
```

1. Neon 콘솔에서 SQL Editor 를 열고 `db/schema.sql` 의 테이블·RLS 부분을 실행합니다.
2. 같은 파일 하단 주석의 `create role app_server ...` 를 **비밀번호를 바꿔서** 실행해 앱 전용 계정을 만듭니다.
3. 그 계정으로 된 연결 문자열을 `.env` 의 `DATABASE_URL` 에 넣습니다. (owner 계정 사용 금지 — RLS 가 우회됨)

```bash
npm run dev            # http://localhost:3001/health
```

## API

모든 `/api/glucose`, `/api/medications`, `/api/auth/me`, `/api/auth/logout` 요청은
`Authorization: Bearer <토스 액세스 토큰>` 헤더가 필요합니다.

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| POST | `/api/auth/get-access-token` | 인가 코드 → 토큰 교환 |
| POST | `/api/auth/refresh-token` | 토큰 갱신 |
| GET | `/api/auth/me` | 토큰 검증 후 userKey 반환 |
| POST | `/api/auth/logout` | 토스 로그인 해제 (기록은 유지) |
| GET | `/api/glucose` | 혈당 기록 목록 |
| POST | `/api/glucose` | 혈당 기록 추가 `{ value, measuredAt, timing, memo? }` |
| DELETE | `/api/glucose/:id` | 혈당 기록 삭제 |
| GET | `/api/medications` | 약 목록 |
| POST | `/api/medications` | 약 추가 `{ name, schedule? }` |
| DELETE | `/api/medications/:id` | 약 삭제 (복용 기록도 함께 삭제) |
| GET | `/api/medications/logs?date=YYYY-MM-DD` | 해당 날짜 복용 체크 목록 |
| PUT | `/api/medications/:id/check` | 복용 체크 `{ date, taken }` |

## 보안 메모

- mTLS 키와 DB 연결 문자열은 코드에 두지 않고 환경변수로만 읽습니다.
- 개인정보(이름·전화번호 등)는 조회하지 않고 `userKey` 만 씁니다.
- 요청마다 트랜잭션을 열고 `app.user_key` 를 설정합니다. RLS 정책이 본인 행만 통과시킵니다.
- 앱 DB 계정은 table owner 가 아니어야 RLS 가 적용됩니다.
- 기존 `artpsy_server` 의 mTLS 키는 git 기록에 남아 있으니 **로테이션**하세요.
# diabetes_server
