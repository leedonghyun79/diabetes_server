import { Router, Request, Response } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/HttpError';
import { parseDateKey, parseId, parseMedicationInput } from '../utils/validate';
import * as diabetes from '../services/diabetesService';

const router = Router();

// 이 라우터의 모든 요청은 로그인 필요
router.use(requireAuth);

/**
 * GET /api/medications
 * 등록된 약 목록
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { userKey } = req as AuthedRequest;
    const medications = await diabetes.listMedications(userKey);
    res.json({ medications });
  }),
);

/**
 * POST /api/medications
 * body: { name, schedule? }
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { userKey } = req as AuthedRequest;
    const input = parseMedicationInput(req.body ?? {});
    const medication = await diabetes.createMedication(userKey, input);
    res.status(201).json({ medication });
  }),
);

/**
 * DELETE /api/medications/:id
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { userKey } = req as AuthedRequest;
    const id = parseId(req.params.id);
    await diabetes.deleteMedication(userKey, id);
    res.status(204).end();
  }),
);

/**
 * GET /api/medications/logs?date=YYYY-MM-DD
 * 해당 날짜에 복용 체크된 약 id 목록
 */
router.get(
  '/logs',
  asyncHandler(async (req: Request, res: Response) => {
    const { userKey } = req as AuthedRequest;
    if (req.query.date === undefined) {
      throw new HttpError(400, 'date 쿼리가 필요합니다.');
    }
    const date = parseDateKey(req.query.date);
    const takenIds = await diabetes.listTakenOn(userKey, date);
    res.json({ date, takenIds });
  }),
);

/**
 * PUT /api/medications/:id/check
 * body: { date: "YYYY-MM-DD", taken: boolean }
 */
router.put(
  '/:id/check',
  asyncHandler(async (req: Request, res: Response) => {
    const { userKey } = req as AuthedRequest;
    const id = parseId(req.params.id);
    const date = parseDateKey(req.body?.date);
    if (typeof req.body?.taken !== 'boolean') {
      throw new HttpError(400, 'taken 은 true/false 여야 합니다.');
    }
    await diabetes.setTaken(userKey, id, date, req.body.taken);
    res.status(204).end();
  }),
);

export default router;
