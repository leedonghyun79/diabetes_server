import { Router, Request, Response } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { parseGlucoseInput, parseId } from '../utils/validate';
import * as diabetes from '../services/diabetesService';

const router = Router();

// 이 라우터의 모든 요청은 로그인 필요
router.use(requireAuth);

/**
 * GET /api/glucose
 * 최근 기록 목록 (측정 시각 내림차순)
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { userKey } = req as AuthedRequest;
    const records = await diabetes.listGlucose(userKey);
    res.json({ records });
  }),
);

/**
 * POST /api/glucose
 * body: { value, measuredAt, timing, memo? }
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { userKey } = req as AuthedRequest;
    const input = parseGlucoseInput(req.body ?? {});
    const record = await diabetes.createGlucose(userKey, input);
    res.status(201).json({ record });
  }),
);

/**
 * DELETE /api/glucose/:id
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { userKey } = req as AuthedRequest;
    const id = parseId(req.params.id);
    await diabetes.deleteGlucose(userKey, id);
    res.status(204).end();
  }),
);

export default router;
