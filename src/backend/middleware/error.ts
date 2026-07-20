import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';

  console.error(`[SubPilot ErrorHandler] Path: ${req.originalUrl} | Status: ${status} | Error: ${message}`);

  res.status(status).json({
    error: {
      message,
      status,
      timestamp: new Date().toISOString()
    }
  });
}
export default errorHandler;
