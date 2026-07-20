import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    cycle: { type: String, required: true, enum: ['weekly', 'monthly', 'quarterly', 'yearly'] },
    category: { type: String, required: true },
    startDate: { type: Date, required: true },
    nextRenewalDate: { type: Date, required: true },
    status: { type: String, required: true, enum: ['active', 'paused', 'trialing', 'cancelled'] },
    notes: { type: String },
    owner: { type: String, default: 'Personal' },
    confidence: { type: Number, default: 1.0 },
    reason: { type: String },
    isMock: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

export const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
export default Subscription;
