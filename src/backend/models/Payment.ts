import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    subscriptionId: { type: String, required: true, index: true },
    subscriptionName: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentMethod: { type: String, default: 'Credit Card' },
    status: { type: String, default: 'paid', enum: ['paid', 'pending', 'failed', 'refunded'] },
    referenceNumber: { type: String },
    notes: { type: String }
  },
  {
    timestamps: true
  }
);

export const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
export default Payment;
