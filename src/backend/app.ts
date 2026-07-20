import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import { createServer as createViteServer } from 'vite';
import apiRouter from './routes/api.routes';
import { errorHandler } from './middleware/error';

export async function createApp() {
  const expressApp = express();

  // Basic parsing middlewares
  expressApp.use(express.json());

  // Check if database is connected before handling API requests that strictly require it
  expressApp.use('/api', (req, res, next) => {
    // Only block synchronization and auth sync endpoints if MongoDB is not connected
    const isDbDependentRoute = req.path === '/sync/data' || req.path === '/auth/sync';
    
    if (isDbDependentRoute && mongoose.connection.readyState !== 1) {
      res.status(503).json({
        error: 'Database Connection Error',
        message: 'The MongoDB Atlas database connection is currently initializing or failed to authenticate.',
        details: 'MongoServerError: bad auth : Authentication failed. Please verify that your MongoDB Atlas user exists and has read/write privileges on the "subpilot" database.',
        status: 'DISCONNECTED'
      });
      return;
    }
    next();
  });

  // Mount API endpoints
  expressApp.use('/api', apiRouter);

  // Fallback 404 handler for API routes to prevent falling through to SPA HTML
  expressApp.use('/api/*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `API route ${req.originalUrl} not found.`
    });
  });

  // Serve Frontend / SPA (Vite in Dev, Static in Prod)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    expressApp.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    expressApp.use(express.static(distPath));
    expressApp.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  expressApp.use(errorHandler);

  return expressApp;
}
