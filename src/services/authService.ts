import { TLSClient, TLSResponse } from '../utils/TLSClient';
import { env, tossCertConfig } from '../config/env';

let client: TLSClient | null = null;

/** mTLS 클라이언트는 첫 호출 때 한 번만 만든다 */
function getClient(): TLSClient {
  if (!client) {
    const { cert, key } = tossCertConfig();
    client = new TLSClient(cert, key);
  }
  return client;
}

export interface GetAccessTokenParams {
  authorizationCode: string;
  referrer: string;
}

export function getAccessToken({ authorizationCode, referrer }: GetAccessTokenParams): Promise<TLSResponse> {
  return getClient().post(`${env.authApiBase}/generate-token`, { authorizationCode, referrer });
}

export function refreshAccessToken(refreshToken: string): Promise<TLSResponse> {
  return getClient().post(`${env.authApiBase}/refresh-token`, { refreshToken });
}

/** 액세스 토큰으로 로그인 사용자 정보 조회 (userKey 확인용) */
export function getLoginMe(authorization: string): Promise<TLSResponse> {
  const authHeader = authorization.startsWith('Bearer ') ? authorization : `Bearer ${authorization}`;
  return getClient().get(`${env.authApiBase}/login-me`, {
    'Content-Type': 'application/json',
    Authorization: authHeader,
  });
}

export function logoutByAccessToken(authorization: string): Promise<TLSResponse> {
  return getClient().post(
    `${env.authApiBase}/access/remove-by-access-token`,
    {},
    { Authorization: authorization },
  );
}
