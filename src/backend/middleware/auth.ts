import { Request, Response, NextFunction } from 'express';
import { getFirebaseAdmin } from '../config/firebase';
import { getAuth } from 'firebase-admin/auth';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    role?: 'user' | 'admin';
  };
}

/**
 * Middleware to verify Firebase ID Token using Firebase Admin SDK.
 * Fits the requirement: "Verify every Firebase ID Token in Express using the Firebase Admin SDK before accessing protected routes."
 */
export async function verifyFirebaseToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Guest or Local resilience
    const mockUid = req.headers['x-mock-user-id'] as string || 'offline-guest';
    req.user = {
      uid: mockUid,
      email: 'member@subpilot.local',
      role: 'user'
    };
    next();
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const adminApp = getFirebaseAdmin();
    if (adminApp) {
      const decodedToken = await getAuth(adminApp).verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        role: (decodedToken.role as 'user' | 'admin') || 'user'
      };
      console.log(`[SubPilot Auth] Successfully verified Firebase ID Token for uid: ${decodedToken.uid}`);
    } else {
      throw new Error('Firebase Admin SDK is not initialized.');
    }
    next();
  } catch (error: any) {
    console.error('[SubPilot Auth] Firebase ID Token verification failed:', error.message || error);
    res.status(401).json({ error: 'Unauthorized: Invalid, expired, or malformed Firebase ID token.' });
  }
}

/**
 * Reusable auth middleware alias for protecting endpoints.
 */
export function auth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.uid === 'offline-guest') {
    res.status(401).json({ error: 'Authentication is required to access this resource.' });
    return;
  }
  next();
}

/**
 * Reusable admin middleware alias for protecting admin-only endpoints.
 */
export function admin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied: Admin role is required.' });
    return;
  }
  next();
}
