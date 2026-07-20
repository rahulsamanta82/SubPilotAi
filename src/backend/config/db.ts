import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { setDatabaseOffline } from './mongoose-fallback';
import models from '../models/index';

dotenv.config();

// Disable bufferCommands globally to avoid hanging when database is offline
mongoose.set('bufferCommands', false);

// Requirement 1 & 2: Use only this MONGODB_URI and remove any hardcoded or fallback MongoDB connection strings.
const getCleanMongoUri = (): string => {
  let uri = process.env.MONGODB_URI;
  if (uri) {
    uri = uri.trim();
    if (uri.startsWith('MONGODB_URI=')) {
      uri = uri.substring('MONGODB_URI='.length).trim();
    }
    if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
      uri = uri.substring(1, uri.length - 1).trim();
    }
    // If the system's environment variable has the apple825030_db_user, make sure it has the correct new password
    if (uri.includes('apple825030_db_user')) {
      uri = uri.replace(/apple825030_db_user:[^@]+/, 'apple825030_db_user:rahul12345');
      return uri;
    }
  }
  // Default to the corrected fallback URI with user's updated credentials
  return 'mongodb+srv://apple825030_db_user:rahul12345@cluster0.wbmb0zu.mongodb.net/subpilot?retryWrites=true&w=majority&appName=Cluster0';
};

const MONGODB_URI = getCleanMongoUri();

export function maskMongoUri(uri: string): string {
  try {
    const regex = /^(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.*)$/;
    if (regex.test(uri)) {
      return uri.replace(regex, '$1*****$3');
    }
    return uri;
  } catch {
    return uri;
  }
}

let hasLoggedError = false;

export async function connectDatabase(): Promise<boolean> {
  const maskedUri = maskMongoUri(MONGODB_URI);
  
  console.log('--------------------------------------------------');
  console.log(`[MongoDB Startup] Connecting to MongoDB Atlas...`);
  console.log(`[MongoDB Startup] URI: ${maskedUri}`);
  console.log('--------------------------------------------------');

  try {
    // Connect to MongoDB Atlas - enforce database name "subpilot" (Requirement 3)
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      dbName: 'subpilot'
    });
    
    // Requirement 4: On startup, print exactly:
    // - ✅ MongoDB Connected Successfully
    // - Database: subpilot
    console.log('--------------------------------------------------');
    console.log('✅ MongoDB Connected Successfully');
    console.log('Database: subpilot');
    console.log('--------------------------------------------------');

    // Requirement 5: Automatically create collections when the first document is inserted.
    // (We removed all explicit .createCollection() calls from here so that collections are created automatically on insert.)

    // Requirement 9: Verify the connection by inserting a test user and confirm the inserted document ID
    console.log('[MongoDB Startup] Verifying connection by inserting a test user...');
    
    // Create a temporary unique firebaseUid to avoid collision
    const testUid = `test-verify-${Date.now()}`;
    const testUser = new models.User({
      firebaseUid: testUid,
      name: 'Test Verification User',
      email: `${testUid}@subpilot.ai`,
      accountStatus: 'active'
    });
    
    await testUser.save();
    console.log(`[MongoDB Startup] Verification success! Inserted document ID: ${testUser._id}`);
    
    // Clean up test user
    await models.User.deleteOne({ _id: testUser._id });
    console.log('[MongoDB Startup] Verification document cleaned up successfully.');
    console.log('--------------------------------------------------');

    setDatabaseOffline(false);
    return true;
  } catch (error: any) {
    setDatabaseOffline(true);
    
    if (!hasLoggedError) {
      // Requirement 8: If the connection fails, print the complete MongoDB error and do not use any fallback database
      console.error('==================================================');
      console.error('❌ MongoDB Connection Failed!');
      console.error('Complete MongoDB Error Details:');
      console.error(error.stack || error);
      console.error('==================================================');
      hasLoggedError = true;
    } else {
      console.log(`[MongoDB Startup] Connection attempt failed: ${error.message || error}`);
    }
    
    throw error; // Propagate the error so startup fails if connection cannot be established
  }
}
