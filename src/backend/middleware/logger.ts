import { Request, Response, NextFunction } from 'express';

export function logger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    console.log(`[SubPilot AuditLog] ${method} ${originalUrl} | Status: ${status} | Time: ${duration}ms | IP: ${ip}`);
  });

  next();
}

export const requestLogger = logger;
export default logger;
