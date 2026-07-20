import { IPaymentRepository } from './index';

export class PaymentRepository implements IPaymentRepository {
  async getAll(userId: string): Promise<any[]> {
    // In live MongoDB: return await Payment.find({ userId });
    return [];
  }

  async create(userId: string, data: any): Promise<any> {
    // return await Payment.create({ ...data, userId });
    return { id: 'mock-id', ...data, userId };
  }

  async delete(id: string): Promise<boolean> {
    // const res = await Payment.deleteOne({ _id: id });
    // return res.deletedCount > 0;
    return true;
  }
}
