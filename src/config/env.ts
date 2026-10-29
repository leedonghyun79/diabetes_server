import dotenv from 'dotenv';

dotenv.config();

/**
 * 환경변수 설정
 *
 * 비밀값(mTLS 키, DB 연결 문자열 등)은 코드에 넣지 않고 전부 환경변수에서 읽습니다.
 * 값이 없으면 해당 기능을 호출할 때 명확한 에러를 냅니다. (서버 기동 자체는 막지 않음)
 */

export const env = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  /** 토스 OAuth2 API 베이스 URL */
  authApiBase:
    process.env.AUTH_API_BASE ??
    'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2',
  /** CORS 허용 Origin (쉼표 구분) */
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
};

/** 토스 mTLS 인증서/개인키 (파일 경로 또는 PEM/base64 내용) */
export function tossCertConfig(): { cert: string; key: string } {
  const cert = process.env.CLIENT_CERT_PATH;
  const key = process.env.CLIENT_KEY_PATH;
  if (!cert || !key) {
    throw new Error('CLIENT_CERT_PATH / CLIENT_KEY_PATH 환경변수가 필요합니다.');
  }
  return { cert, key };
}

/**
 * Neon Postgres 연결 문자열 (앱 전용 DB 계정 사용 — owner 계정 금지)
 * 예: postgresql://app_server:***@ep-xxx.neon.tech/diabetes?sslmode=require
 */
export function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL 환경변수가 필요합니다.');
  }
  return url;
}
