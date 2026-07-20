import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, X, Send, Paperclip, Sparkles, Bot, User, 
  Image as ImageIcon, Loader2, RefreshCw, Trash2, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Subscription } from '../types';

interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // base64
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  parts: MessagePart[];
  timestamp: Date;
}

interface CopilotChatbotProps {
  subscriptions: Subscription[];
  userProfile?: {
    name: string;
    email?: string;
    profilePic?: string;
  } | null;
  baseCurrency?: string;
  billingPeriodMode?: 'monthly' | 'annual';
  financials?: {
    monthlySpend: number;
    yearlySpend: number;
    duplicateWarnings: number;
    totalActive: number;
  };
}

const SUGGESTED_QUESTIONS = [
  "What is my total monthly spend?",
  "Give me cost-optimization tips!",
  "When is my next subscription renewing?",
  "Are there any duplicate SaaS tools?"
];

export const CopilotChatbot: React.FC<CopilotChatbotProps> = ({ 
  subscriptions,
  userProfile,
  baseCurrency = 'USD',
  billingPeriodMode = 'monthly',
  financials
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      parts: [
        { 
          text: "Hi! I am your SubPilot AI Copilot. 🚀\n\nI can analyze your active subscriptions, calculate monthly expenses, find duplicates, and suggest budget optimizations.\n\nYou can also upload/drag in a screenshot of a bill or invoice, and I will help you parse it! What can I help you audit today?" 
        }
      ],
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<{
    base64: string;
    mimeType: string;
    previewUrl: string;
    fileName: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Alert/badge system when closed and chatbot gets a new message (not welcome)
  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      setHasNewMessage(true);
    }
  }, [messages, isOpen]);

  const handleOpenToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPEG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      setSelectedImage({
        base64: base64String,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
        fileName: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedImage = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage.previewUrl);
    }
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text && !selectedImage) return;

    setInputText('');
    
    // Prepare the message parts
    const messageParts: MessagePart[] = [];
    if (text) {
      messageParts.push({ text });
    }
    if (selectedImage) {
      messageParts.push({
        inlineData: {
          mimeType: selectedImage.mimeType,
          data: selectedImage.base64
        }
      });
    }

    const newUserMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      parts: messageParts,
      timestamp: new Date()
    };

    const currentImage = selectedImage;
    clearSelectedImage();

    // Append to list
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Gather chat history mapped to standard message schema
      const chatHistory = [...messages, newUserMessage].map(msg => ({
        role: msg.role,
        parts: msg.parts.map(p => {
          if (p.text) return { text: p.text };
          if (p.inlineData) return { inlineData: p.inlineData };
          return { text: '' };
        })
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          subscriptions,
          userProfile,
          baseCurrency,
          billingPeriodMode,
          financials
        })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }

      const data = await res.json();
      
      const newAssistantMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        parts: [{ text: data.text }],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newAssistantMessage]);
    } catch (err) {
      console.error('Chatbot API communication error:', err);
      
      // Fallback message
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        parts: [{ text: "⚠️ I had trouble connecting to the Gemini server. Please check your internet connection or ensure your API keys are fully loaded in AI Studio Secrets." }],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        parts: [
          { 
            text: "Hi! I am your SubPilot AI Copilot. 🚀\n\nHow can I help you optimize or organize your subscription profile today?" 
          }
        ],
        timestamp: new Date()
      }
    ]);
  };

  // Safe and beautiful markdown & style parser for the chatbot bubbles
  const renderMessageText = (text: string) => {
    if (!text) return null;

    // Split by lines and parse standard elements
    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-xs leading-relaxed">
        {lines.map((line, index) => {
          let cleanLine = line;

          // Check for bullet points
          const isBullet = cleanLine.startsWith('- ') || cleanLine.startsWith('* ');
          if (isBullet) {
            cleanLine = cleanLine.substring(2);
          }

          // Parse bold text **text** -> strong
          const boldRegex = /\*\*(.*?)\*\*/g;
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let match;

          while ((match = boldRegex.exec(cleanLine)) !== null) {
            const matchIndex = match.index;
            if (matchIndex > lastIndex) {
              parts.push(cleanLine.substring(lastIndex, matchIndex));
            }
            parts.push(<strong key={matchIndex} className="font-extrabold text-white">{match[1]}</strong>);
            lastIndex = boldRegex.lastIndex;
          }

          if (lastIndex < cleanLine.length) {
            parts.push(cleanLine.substring(lastIndex));
          }

          const renderedText = parts.length > 0 ? parts : cleanLine;

          if (isBullet) {
            return (
              <div key={index} className="flex items-start gap-2 pl-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent/80 mt-1.5 flex-shrink-0" />
                <span className="text-gray-200">{renderedText}</span>
              </div>
            );
          }

          // Check if cleanLine is a header
          if (cleanLine.startsWith('### ')) {
            return <h5 key={index} className="text-sm font-bold text-white mt-3 mb-1">{cleanLine.substring(4)}</h5>;
          }
          if (cleanLine.startsWith('## ')) {
            return <h4 key={index} className="text-base font-black text-white mt-4 mb-1.5">{cleanLine.substring(3)}</h4>;
          }

          return <p key={index} className="text-gray-300">{renderedText}</p>;
        })}
      </div>
    );
  };

  return (
    <>
      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {hasNewMessage && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-3.5 px-4 py-2 bg-accent text-white font-extrabold text-xs rounded-full shadow-[0_8px_25px_rgba(139,92,246,0.4)] flex items-center gap-1.5 border border-accent-hover/30"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Copilot has cost insights!</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          id="copilot-chatbot-button"
          onClick={handleOpenToggle}
          className={`p-4 rounded-full shadow-[0_10px_35px_rgba(139,92,246,0.35)] cursor-pointer hover:scale-105 transition-all relative group flex items-center justify-center ${
            isOpen 
              ? 'bg-sidebar border border-surface-border/80 text-white' 
              : 'bg-accent hover:bg-accent-hover text-white'
          }`}
          title="Open AI SubPilot Copilot"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6 text-white" />
              {hasNewMessage && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-background animate-bounce" />
              )}
            </>
          )}
        </button>
      </div>

      {/* FLOATING CHAT CARD */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="copilot-chatbot-card"
            initial={{ opacity: 0, y: 50, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-24 right-6 w-[360px] sm:w-[420px] max-h-[600px] h-[80vh] bg-sidebar border border-surface-border/90 rounded-3xl z-50 flex flex-col overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.5)]"
          >
            {/* Chat Header */}
            <div className="bg-background-dark p-4.5 border-b border-surface-border/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-accent/15 border border-accent/25 rounded-xl text-accent shadow-[0_4px_15px_rgba(139,92,246,0.1)]">
                  <Bot className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-sm text-white font-display">SubPilot Copilot</h3>
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  </div>
                  <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider">AI Financial Analyst</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearChat}
                  className="p-1.5 text-text-dim hover:text-white rounded-lg hover:bg-sidebar transition-all cursor-pointer"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleOpenToggle}
                  className="p-1.5 text-text-dim hover:text-white rounded-lg hover:bg-sidebar transition-all cursor-pointer"
                  title="Minimize"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4.5 space-y-4 bg-background-dark/30 scrollbar-thin">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent flex-shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className="max-w-[75%] flex flex-col gap-1.5">
                    <div
                      className={`p-3.5 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-accent text-white rounded-tr-none'
                          : 'bg-sidebar/90 border border-surface-border/50 text-gray-100 rounded-tl-none'
                      }`}
                    >
                      {/* Render Text Parts */}
                      {msg.parts.map((part, index) => {
                        if (part.text) {
                          return <div key={index}>{renderMessageText(part.text)}</div>;
                        }
                        if (part.inlineData) {
                          return (
                            <div key={index} className="mt-2 rounded-lg overflow-hidden border border-white/10 max-h-40">
                              <img
                                src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
                                alt="Attachment"
                                referrerPolicy="no-referrer"
                                className="w-full object-cover"
                              />
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                    <span className="text-[9px] text-text-dim font-bold self-end opacity-75">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-sidebar border border-surface-border flex items-center justify-center text-accent flex-shrink-0">
                      <User className="w-4 h-4 text-text-dim" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-sidebar/90 border border-surface-border/50 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-accent animate-spin" />
                    <span className="text-xs text-text-dim font-semibold">Generating saving audit...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 border-t border-surface-border/40 bg-background-dark/10 flex flex-col gap-1.5">
                <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-accent" /> Suggested Audits
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(q)}
                      className="text-[10px] font-bold text-gray-300 hover:text-white bg-sidebar border border-surface-border hover:border-accent/40 px-2.5 py-1 rounded-lg transition-all cursor-pointer text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input Area */}
            <div className="p-4 bg-background-dark border-t border-surface-border/60 space-y-3">
              {/* Image Preview Thumbnail */}
              {selectedImage && (
                <div className="flex items-center justify-between p-2 bg-sidebar border border-surface-border rounded-xl">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedImage.previewUrl}
                      alt="Thumbnail preview"
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-cover rounded-lg border border-white/10"
                    />
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-white max-w-[180px] truncate">{selectedImage.fileName}</p>
                      <p className="text-[9px] text-text-dim">Ready to analyze</p>
                    </div>
                  </div>
                  <button
                    onClick={clearSelectedImage}
                    className="p-1.5 hover:bg-sidebar-hover text-text-dim hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Text Input Row */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                {/* File Attachment Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 bg-sidebar hover:bg-sidebar-hover text-text-dim hover:text-white border border-surface-border rounded-xl transition-all cursor-pointer flex-shrink-0"
                  title="Upload receipt/invoice photo"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Input text */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={selectedImage ? "Describe this image..." : "Ask Copilot anything..."}
                    className="w-full pl-3 pr-3 py-2.5 bg-sidebar border border-surface-border focus:outline-none focus:border-accent/80 rounded-xl text-xs text-white placeholder-text-dim font-medium transition-all"
                    disabled={isLoading}
                  />
                </div>

                {/* Send */}
                <button
                  type="submit"
                  disabled={isLoading || (!inputText.trim() && !selectedImage)}
                  className="p-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
