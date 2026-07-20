import mongoose from 'mongoose';

const UserSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    device: { type: String, default: 'Unknown' },
    browser: { type: String, default: 'Unknown' },
    ip: { type: String, default: '0.0.0.0' },
    lastActive: { type: Date, default: Date.now },
    token: { type: String }
  },
  {
    timestamps: true
  }
);

export const UserSession = mongoose.models.UserSession || mongoose.model('UserSession', UserSessionSchema);
export default UserSession;
