
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { UserSession } from '../models/UserSession';
import { Settings } from '../models/Settings';

/**
 * Controller to sync Firebase Authentication user details into MongoDB Atlas.
 * Meets requirement 8:
 * - Verify Firebase token (handled by middleware)
 * - Find user by firebaseUid.
 * - If user doesn't exist, create a new MongoDB document.
 * - If user exists, update: lastLogin, loginCount, device, browser, IP, and updatedAt.
 */
export async function syncUserController(
  req: AuthenticatedRequest,
  res: Response,
  
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Firebase User Context not found.' });
      return;
    }

    const { uid, email, name: tokenName } = req.user;
    
    // Resolve email and name defaults
    const finalEmail = email || `${uid}@subpilot.local`;
    const finalName = tokenName || req.body.name || finalEmail.split('@')[0] || 'SubPilot Member';

    // Parse device/browser/IP from headers or body
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    // Determine device, browser, and IP values
    const device = req.body.device || (userAgent.includes('Mobi') ? 'Mobile Device' : 'Desktop Device');
    const browser = req.body.browser || (userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Safari') ? 'Safari' : userAgent.includes('Firefox') ? 'Firefox' : 'Web Browser');
    const ip = req.body.ip || (Array.isArray(clientIp) ? clientIp[0] : String(clientIp));

    // Find user by firebaseUid
    let userDoc = await User.findOne({ firebaseUid: uid } as any);

    if (!userDoc) {
      // If user doesn't exist, create a new MongoDB document
      userDoc = new User({
        firebaseUid: uid,
        name: finalName,
        email: finalEmail,
        lastLogin: new Date(),
        loginCount: 1,
        deviceHistory: [device],
        browserHistory: [browser],
        ipHistory: [ip],
        accountStatus: 'active'
      });
      await userDoc.save();
      console.log('User created in MongoDB');

      // Provision default settings for the user
      const userSettings = new Settings({
        userId: uid,
        theme: 'dark',
        preferredCurrency: 'USD',
        billingPeriodMode: 'monthly',
        notificationsEnabled: true,
        emailAlertsEnabled: true
      });
      await userSettings.save();
    } else {
      // If user exists, update lastLogin, loginCount, device history, browser history, and IP history
      userDoc.lastLogin = new Date();
      userDoc.loginCount = (userDoc.loginCount || 0) + 1;
      
      if (userDoc.deviceHistory && !userDoc.deviceHistory.includes(device)) {
        userDoc.deviceHistory.push(device);
      }
      if (userDoc.browserHistory && !userDoc.browserHistory.includes(browser)) {
        userDoc.browserHistory.push(browser);
      }
      if (userDoc.ipHistory && !userDoc.ipHistory.includes(ip)) {
        userDoc.ipHistory.push(ip);
      }

      // Save userDoc (updates updatedAt automatically via mongoose timestamps)
      await userDoc.save();
      console.log('User updated in MongoDB');
    }

    // Create a new UserSession record
    const session = new UserSession({
      userId: uid,
      device,
      browser,
      ip,
      lastActive: new Date()
    });
    await session.save();

    // Print successful login details as requested by user
    console.log('==================================================');
    console.log('[Auth Login Success / User Sync Logged]');
    console.log(`- Firebase UID: ${uid}`);
    console.log(`- Email: ${finalEmail}`);
    console.log(`- MongoDB database name: ${mongoose.connection.name || 'unknown'}`);
    console.log(`- MongoDB collection name: ${User.collection.name}`);
    console.log(`- Inserted document _id: ${userDoc._id}`);
    console.log('==================================================');

    res.json({
      success: true,
      user: {
        firebaseUid: userDoc.firebaseUid,
        name: userDoc.name,
        email: userDoc.email,
        loginCount: userDoc.loginCount,
        lastLogin: userDoc.lastLogin
      }
    });
  } catch (error: any) {
    console.error('==================================================');
    console.error('[Auth Sync ERROR / Insertion Failed]');
    console.error(error.stack || error);
    console.error('==================================================');
    res.status(500).json({ error: 'Internal Server Error while synchronizing user profile.' });
  }
}

import { Request, Response } from "express";

export async function registerUserController(
  req: Request,
  res: Response
) {
  res.json({
    success: true,
    message: "Register API"
  });
}

export async function loginUserController(
  req: Request,
  res: Response
) {
  res.json({
    success: true,
    message: "Login API"
  });
}

export async function getUserSubscriptionsController(
  req: Request,
  res: Response
) {
  res.json({
    success: true,
    subscriptions: []
  });
}

export async function getUserPaymentsController(
  req: Request,
  res: Response
) {
  res.json({
    success: true,
    payments: []
  });
}