export interface ISubscriptionRepository {
  getAll(userId: string): Promise<any[]>;
  create(userId: string, data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<boolean>;
  clearAll(userId: string): Promise<boolean>;
}

export interface IPaymentRepository {
  getAll(userId: string): Promise<any[]>;
  create(userId: string, data: any): Promise<any>;
  delete(id: string): Promise<boolean>;
}

export { SubscriptionRepository } from './SubscriptionRepository';
export { PaymentRepository } from './PaymentRepository';
