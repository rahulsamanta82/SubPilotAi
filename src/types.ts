export type BillingCycle = 'monthly' | 'yearly' | 'quarterly' | 'weekly';

export type SubscriptionStatus = 'active' | 'paused' | 'trialing' | 'cancelled';

export interface Subscription {
  id?: string;
  userId: string;
  name: string;
  price: number;
  currency: string;
  cycle: BillingCycle;
  category: string;
  startDate: string;
  nextRenewalDate: string;
  status: SubscriptionStatus;
  owner?: string; // For team/collaborative tracking
  seatsUsed?: number;
  seatsTotal?: number;
  notes?: string;
  url?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'guest';
  avatarUrl?: string;
}

export interface Recommendation {
  id: string;
  type: 'saving' | 'duplicate' | 'unused' | 'alternative';
  subscriptionName: string;
  title: string;
  description: string;
  estimatedSaving: number;
  actionText: string;
  applied: boolean;
}

export interface ForecastData {
  month: string;
  amount: number;
  projectedAmount: number;
}
