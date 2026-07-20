import { Request, Response, NextFunction } from 'express';
import * as geminiService from '../services/gemini.service';
import models from '../models/index';

export async function detectController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { textData } = req.body;
  if (!textData || typeof textData !== 'string') {
    res.status(400).json({ error: 'textData is required and must be a string' });
    return;
  }

  try {
    const result = await geminiService.detectSubscriptions(textData);
    res.json(result);
  } catch (error: any) {
    geminiService.handleApiError('/api/detect', error);
    const fallbackResult = geminiService.generateFallbackDetections(textData);
    res.json({ detections: fallbackResult, isMock: true });
  }
}

export async function optimizeController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { subscriptions } = req.body;
  if (!subscriptions || !Array.isArray(subscriptions)) {
    res.status(400).json({ error: 'subscriptions array is required' });
    return;
  }

  try {
    const result = await geminiService.optimizeSubscriptions(subscriptions);
    res.json(result);
  } catch (error: any) {
    geminiService.handleApiError('/api/optimize', error);
    const fallbackRecs = geminiService.generateFallbackRecommendations(subscriptions);
    res.json({ recommendations: fallbackRecs, isMock: true });
  }
}

export async function forecastController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { subscriptions, baseCurrency = 'USD' } = req.body;
  if (!subscriptions || !Array.isArray(subscriptions)) {
    res.status(400).json({ error: 'subscriptions array is required' });
    return;
  }

  try {
    const result = await geminiService.forecastSubscriptions(subscriptions, baseCurrency);
    res.json(result);
  } catch (error: any) {
    geminiService.handleApiError('/api/forecast', error);
    const fallbackForecast = geminiService.generateFallbackForecast(subscriptions, baseCurrency);
    res.json(fallbackForecast);
  }
}

export async function chatController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { messages, userProfile } = req.body;
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }

  try {
    const result = await geminiService.conversationalChat(req.body);

    // Store Chat in MongoDB (Requirement 7)
    try {
      const userId = userProfile?.userId || userProfile?.firebaseUid || 'offline-guest';
      const lastUserMsg = messages[messages.length - 1];
      const prompt = lastUserMsg?.parts?.find((p: any) => p.text)?.text || 'File/Context update';

      const newChat = new models.Chat({
        conversationId: req.body.conversationId || `conv-${Date.now()}`,
        userId,
        prompt,
        response: result.text,
        modelUsed: 'gemini-2.5-flash',
        timestamp: new Date()
      });
      await newChat.save();
      console.log(`[MongoDB Chat] Saved chat successfully for user: ${userId}, Chat ID: ${newChat._id}`);
    } catch (saveError: any) {
      console.error('[MongoDB Chat Save Error] Non-blocking chat persistence failure:', saveError.stack || saveError);
    }

    res.json(result);
  } catch (error: any) {
    geminiService.handleApiError('/api/chat', error);
    const errMsg = error?.message || String(error);
    res.status(500).json({ 
      error: 'Failed to communicate with Gemini API',
      text: `⚠️ **AI Copilot Connection Error**: Unable to directly query the Gemini API.\n\n**Details**: ${errMsg}\n\nPlease check your network or verify that your Gemini API key is valid and has sufficient quota.`
    });
  }
}

export async function syncDataController(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { userId, collectionName, data } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  if (!collectionName || data === undefined) {
    res.status(400).json({ error: 'collectionName and data are required' });
    return;
  }

  try {
    let model: any;
    switch (collectionName) {
      case 'subscriptions':
        model = models.Subscription;
        break;
      case 'payments':
        model = models.Payment;
        break;
      case 'uploads':
      case 'upload_history':
        model = models.Upload;
        break;
      case 'activitylogs':
        model = models.ActivityLog;
        break;
      case 'notifications':
        model = models.Notification;
        break;
      case 'analytics':
        model = models.Analytics;
        break;
      default:
        res.status(400).json({ error: `Unsupported collection sync: ${collectionName}` });
        return;
    }

    const items = Array.isArray(data) ? data : [data];

    // Map each item from Firestore properties into Mongoose-compatible schema
    const operations = items.map((item: any) => {
      const docId = item.id || item._id || new models.User()._id.toString(); // unique ID
      const cleanItem = { ...item };
      delete cleanItem.id;
      delete cleanItem._id;
      
      // Enforce correct userId
      cleanItem.userId = userId;

      return {
        updateOne: {
          filter: { _id: docId },
          update: { $set: cleanItem },
          upsert: true
        }
      };
    });

    if (operations.length > 0) {
      await model.bulkWrite(operations);
      
      // Delete any documents for this user that were NOT in the synchronized list (handles deletions!)
      const docIds = items.map(item => item.id || item._id).filter(Boolean);
      await model.deleteMany({ userId, _id: { $nin: docIds } });
    } else {
      // Synced empty array -> clear all for this user
      await model.deleteMany({ userId });
    }

    console.log(`[MongoDB Sync] Synchronized ${operations.length} documents for collection: ${collectionName}, user: ${userId}`);
    res.json({ success: true, collection: collectionName, count: operations.length });
  } catch (error: any) {
    console.error(`[MongoDB Sync Error] Failed to sync ${collectionName} for user ${userId}:`, error.stack || error);
    res.status(500).json({ error: 'Failed to sync data to MongoDB', details: error.message });
  }
}
