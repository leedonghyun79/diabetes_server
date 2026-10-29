import { Pool, PoolClient } from 'pg';
import { databaseUrl } from '../config/env';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl(),
      // Neon 은 SSL 연결만 허용합니다
      ssl: { rejectUnauthorized: true },
      max: 5,
      idleTimeoutMillis: 10_000,
    });
  }
  return pool;
}

/**
 * 사용자 단위 트랜잭션
 *
 * 트랜잭션 안에서 app.user_key 세션 변수를 설정하고, 테이블의 RLS 정책이 이 값으로 행을 거른다.
 * 앱 DB 계정은 table owner 가 아니어야 RLS 가 적용된다. (db/schema.sql 참고)
 */
export async function withUser<T>(userKey: string, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    // true = 트랜잭션 로컬 설정 (커넥션 풀에 값이 남지 않음)
    await client.query("select set_config('app.user_key', $1, true)", [userKey]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}
