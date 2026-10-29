import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';
import authRouter from './routes/auth';
import glucoseRouter from './routes/glucose';
import medicationRouter from './routes/medication';
import { HttpError } from './utils/HttpError';

const app: Express = express();

// ============================================
// Middleware
// ============================================

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      // 네이티브/서버 간 요청은 Origin 이 없을 수 있으므로 허용
      if (!origin || env.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json({ limit: '100kb' }));

// ============================================
// Routes
// ============================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/glucose', glucoseRouter);
app.use('/api/medications', medicationRouter);

// ============================================
// Error Handling
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', { message: err.message, path: req.path });

  if (res.headersSent) {
    return next(err);
  }

  const status = err instanceof HttpError ? err.status : 500;
  // 500 메시지는 내부 정보를 숨긴다 (개발 모드에서만 원문 노출)
  const message =
    status === 500 && env.nodeEnv !== 'development' ? 'Internal Server Error' : err.message;

  res.status(status).json({ success: false, error: message });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not Found' });
});

// ============================================
// Start
// ============================================

if (require.main === module) {
  app.listen(env.port, () => {
    console.log(`🚀 diabetes-server listening on port ${env.port}`);
    console.log(`🔗 Health check: http://localhost:${env.port}/health`);
  });
}

export default app;
