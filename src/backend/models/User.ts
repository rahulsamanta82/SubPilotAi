import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    username: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    profileImage: { type: String },
    phone: { type: String },
    role: { type: String, default: 'user', enum: ['user', 'admin'] },
    provider: { type: String, default: 'google' },
    subscription: {
      plan: { type: String, default: 'free' },
      status: { type: String, default: 'active' },
      expiryDate: { type: Date }
    },
    accountStatus: { type: String, default: 'active', enum: ['active', 'suspended', 'pending'] },
    lastLogin: { type: Date, default: Date.now },
    loginCount: { type: Number, default: 1 },
    deviceHistory: [{ type: String }],
    browserHistory: [{ type: String }],
    ipHistory: [{ type: String }]
  },
  {
    timestamps: true
  }
);

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
