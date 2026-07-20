import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, default: 'New Conversation' },
    lastMessage: { type: String },
    pinned: { type: Boolean, default: false },
    favorite: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

export const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
export default Conversation;
