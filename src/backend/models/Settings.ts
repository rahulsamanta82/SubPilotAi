import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    theme: { type: String, default: 'dark' },
    preferredCurrency: { type: String, default: 'USD' },
    billingPeriodMode: { type: String, default: 'monthly' },
    notificationsEnabled: { type: Boolean, default: true },
    emailAlertsEnabled: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

export const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
export default Settings;
