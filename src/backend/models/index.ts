import mongoose from 'mongoose';

// User Schema import/export
import User from './User';
import Subscription from './Subscription';
import Payment from './Payment';
import Conversation from './Conversation';
import UserSession from './UserSession';
import Settings from './Settings';

// Upload Schema
const UploadSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    fileType: { type: String },
    mimeType: { type: String },
    extension: { type: String },
    size: { type: Number, required: true },
    uploadTime: { type: Date, default: Date.now },
    folder: { type: String, default: 'general' },
    processingStatus: { type: String, default: 'completed', enum: ['pending', 'processing', 'completed', 'failed'] },
    downloadCount: { type: Number, default: 0 },
    deleteStatus: { type: Boolean, default: false },
    lastAccess: { type: Date, default: Date.now },
    aiResult: { type: mongoose.Schema.Types.Mixed },
    processingDuration: { type: Number }, // in milliseconds
    tokensUsed: { type: Number, default: 0 },
    requestId: { type: String },
    device: { type: String },
    browser: { type: String },
    ip: { type: String }
  },
  { timestamps: true }
);

const Upload = mongoose.models.Upload || mongoose.model('Upload', UploadSchema);

// Chat Conversation Schema
const ChatSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    prompt: { type: String, required: true },
    response: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    processingTime: { type: Number }, // in ms
    modelUsed: { type: String, default: 'gemini-2.5-flash' },
    tokensUsed: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    attachments: [{ type: String }],
    deletedStatus: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    favourite: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Chat = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);

// Notification Schema
const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    type: { type: String, default: 'info', enum: ['info', 'alert', 'success', 'warning'] },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

// ActivityLog Schema
const ActivityLogSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    action: { type: String, required: true }, // e.g. 'Login', 'Upload', 'Delete'
    details: { type: String },
    device: { type: String },
    browser: { type: String },
    ip: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);

// Analytics Schema
const AnalyticsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    metricName: { type: String, required: true }, // e.g., 'monthlySpend', 'potentialSavings', 'activeSubscriptionsCount'
    metricValue: { type: mongoose.Schema.Types.Mixed, required: true },
    dimensions: { type: mongoose.Schema.Types.Mixed }, // e.g., { currency: 'USD', category: 'SaaS' }
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', AnalyticsSchema);

export { User, Subscription, Payment, Conversation, UserSession, Settings, Upload, Chat, Notification, ActivityLog, Analytics };

export default {
  User,
  Subscription,
  Payment,
  Conversation,
  UserSession,
  Settings,
  Upload,
  Chat,
  Notification,
  ActivityLog,
  Analytics
};
