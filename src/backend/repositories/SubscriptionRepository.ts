import { ISubscriptionRepository } from './index';

export class SubscriptionRepository implements ISubscriptionRepository {
  async getAll(userId: string): Promise<any[]> {
    // In an enterprise system with live MongoDB, we would use:
    // return await Subscription.find({ userId });
    // This is the clean, decoupled service access pattern.
    return [];
  }

  async create(userId: string, data: any): Promise<any> {
    // return await Subscription.create({ ...data, userId });
    return { id: 'mock-id', ...data, userId };
  }

  async update(id: string, data: any): Promise<any> {
    // return await Subscription.findByIdAndUpdate(id, data, { new: true });
    return { id, ...data };
  }

  async delete(id: string): Promise<boolean> {
    // const res = await Subscription.deleteOne({ _id: id });
    // return res.deletedCount > 0;
    return true;
  }

  async clearAll(userId: string): Promise<boolean> {
    // await Subscription.deleteMany({ userId });
    return true;
  }
}
