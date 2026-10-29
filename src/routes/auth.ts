import { Router, Request, Response } from 'express';
import * as authService from '../services/authService';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/HttpError';

const router = Router();

/**
 * POST /api/auth/get-access-token
 * body: { authorizationCode, referrer }
 */
router.post(
  '/get-access-token',
  asyncHandler(async (req: Request, res: Response) => {
    const { authorizationCode, referrer } = req.body ?? {};
    if (!authorizationCode || !referrer) {
      throw new HttpError(400, 'authorizationCode 와 referrer 는 필수입니다.');
    }
    const response = await authService.getAccessToken({ authorizationCode, referrer });
    res.status(200).json({ statusCode: response.statusCode, data: JSON.parse(response.data) });
  }),
);

/**
 * POST /api/auth/refresh-token
 * body: { refreshToken }
 */
router.post(
  '/refresh-token',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) {
      throw new HttpError(400, 'refreshToken 은 필수입니다.');
    }
    const response = await authService.refreshAccessToken(refreshToken);
    res.status(200).json({ statusCode: response.statusCode, data: JSON.parse(response.data) });
  }),
);

/**
 * GET /api/auth/me
 * 액세스 토큰이 유효한지 확인하고 userKey 를 돌려준다. (개인정보는 반환하지 않음)
 */
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ userKey: (req as AuthedRequest).userKey });
});

/**
 * POST /api/auth/logout
 * 로그인 상태(토스 액세스 토큰)를 끊는다. 저장된 기록은 지우지 않는다.
 */
router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const response = await authService.logoutByAccessToken(req.headers.authorization as string);
    res.status(200).json({ statusCode: response.statusCode, data: JSON.parse(response.data) });
  }),
);

export default router;
