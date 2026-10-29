import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';

/** 인증 통과 후 req.userKey 가 채워진 요청 타입 */
export interface AuthedRequest extends Request {
  userKey: string;
}

/**
 * Authorization: Bearer <토스 액세스 토큰> 을 검증하고 userKey 를 req 에 붙인다.
 * 개인정보(이름/전화번호 등)는 조회하지 않고 userKey 만 사용한다.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authorization = req.headers.authorization;
  if (!authorization) {
    res.status(401).json({ error: 'Authorization header is required' });
    return;
  }

  try {
    const response = await authService.getLoginMe(authorization);
    const body = JSON.parse(response.data);
    const userKey = body?.success?.userKey;

    if (response.statusCode !== 200 || userKey === undefined || userKey === null) {
      res.status(401).json({ error: 'Invalid access token' });
      return;
    }

    (req as AuthedRequest).userKey = String(userKey);
    next();
  } catch (err) {
    next(err);
  }
}
