import { Router } from 'express';
import { 
  detectController, 
  optimizeController, 
  forecastController, 
  chatController,
  syncDataController
} from '../controllers/api.controller';
import { syncUserController } from '../controllers/auth.controller';
import { requestLogger } from '../middleware/logger';
import { verifyFirebaseToken } from '../middleware/auth';

const router = Router();

// Apply request logging specific to API paths
router.use(requestLogger);

// Setup API endpoint mappings
router.post('/detect', detectController);
router.post('/optimize', optimizeController);
router.post('/forecast', forecastController);
router.post('/chat', chatController);
router.post('/sync/data', syncDataController);

// Auth Sync Route (Verifies Firebase token and syncs to MongoDB Atlas)
router.post('/auth/sync', verifyFirebaseToken, syncUserController);

export default router;
