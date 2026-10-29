import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Express 4는 async 핸들러의 reject를 자동으로 next()에 넘기지 않으므로 감싸서 처리
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
