import { initializeApp, cert } from 'firebase-admin/app';
import * as fs from 'fs';
import * as path from 'path';

let firebaseAdminApp: any = null;

export function getFirebaseAdmin(): any {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  try {
    // Try to load workspace project ID from firebase-applet-config.json
    let workspaceProjectId: string | undefined = undefined;
    const appletConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(appletConfigPath)) {
      try {
        const appletConfig = JSON.parse(fs.readFileSync(appletConfigPath, 'utf8'));
        workspaceProjectId = appletConfig.projectId;
      } catch (e) {
        console.warn('[SubPilot Firebase Admin] Failed to parse firebase-applet-config.json:', e);
      }
    }

    const configPath = path.resolve(process.cwd(), 'src/backend/config/firebase-admin.json');
    let serviceAccount: any = null;
    if (fs.existsSync(configPath)) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) {
        console.warn('[SubPilot Firebase Admin] Failed to parse firebase-admin.json service account:', e);
      }
    }

    // Determine the best way to initialize
    if (serviceAccount && workspaceProjectId && serviceAccount.project_id === workspaceProjectId) {
      // Service account matches the workspace project ID
      firebaseAdminApp = initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('[SubPilot Firebase Admin] SDK successfully initialized with matching service account.');
    } else if (workspaceProjectId) {
      // Mismatch or no matching service account, but we have a workspace project ID.
      // Firebase Admin can verify ID tokens using just the projectId.
      firebaseAdminApp = initializeApp({
        projectId: workspaceProjectId
      });
      console.log(`[SubPilot Firebase Admin] SDK successfully initialized with workspace projectId: ${workspaceProjectId}`);
    } else if (serviceAccount) {
      // No workspaceProjectId but we have service account
      firebaseAdminApp = initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('[SubPilot Firebase Admin] SDK successfully initialized with provided service account.');
    } else {
      // Default fallback
      console.warn('[SubPilot Firebase Admin] Warning: No service account or workspace config found. Initializing with default credentials.');
      firebaseAdminApp = initializeApp();
    }
  } catch (error) {
    console.error('[SubPilot Firebase Admin] Error initializing Admin SDK, falling back to mock authentication for offline/local resilience:', error);
  }

  return firebaseAdminApp;
}
