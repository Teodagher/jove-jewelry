'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  message: string;
  sender_type: 'customer' | 'admin';
  created_at: string;
}

interface ChatSession {
  id: string;
  customer_email: string;
  customer_name: string;
  status: 'active' | 'closed';
}

// Type-safe wrapper for Supabase operations on tables without generated types
const chatDb = {
  sessions: () => supabase.from('chat_sessions' as 'users'),
  messages: () => supabase.from('chat_messages' as 'users')
};

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Auto-fill email if user is logged in
  useEffect(() => {
    if (user?.email) {
      setCustomerEmail(user.email);
    }
  }, [user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to new messages when session is active
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`chat_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const startChat = async () => {
    if (!customerName.trim() || !customerEmail.trim()) return;

    try {
      // Create or get existing chat session
      const { data: existingSession } = await chatDb.sessions()
        .select('*')
        .eq('customer_email', customerEmail)
        .eq('status', 'active')
        .single();

      const typedSession = existingSession as unknown as ChatSession | null;

      if (typedSession) {
        setSessionId(typedSession.id);
        // Load existing messages
        const { data: existingMessages } = await chatDb.messages()
          .select('*')
          .eq('session_id', typedSession.id)
          .order('created_at', { ascending: true });
        
        if (existingMessages) {
          setMessages(existingMessages as unknown as ChatMessage[]);
        }
      } else {
        // Create new session
        const { data: newSession, error } = await chatDb.sessions()
          .insert({
            customer_email: customerEmail,
            customer_name: customerName,
            status: 'active'
          } as never)
          .select()
          .single();

        if (error) throw error;
        const typedNewSession = newSession as unknown as ChatSession | null;
        if (typedNewSession) {
          setSessionId(typedNewSession.id);
        }
      }

      setHasStartedChat(true);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !sessionId || sending) return;

    setSending(true);
    try {
      const { error } = await chatDb.messages()
        .insert({
          session_id: sessionId,
          message: message.trim(),
          sender_type: 'customer'
        } as never);

      if (error) throw error;
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (hasStartedChat) {
        sendMessage();
      } else {
        startChat();
      }
    }
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-maison-black text-maison-ivory rounded-full shadow-lg flex items-center justify-center hover:bg-maison-charcoal transition-colors duration-300 group"
            aria-label="Open chat"
          >
            <MessageCircle size={24} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-300" />
            {/* Notification dot */}
            <span className="absolute top-0 right-0 w-3 h-3 bg-maison-gold rounded-full animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : '500px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-maison-ivory shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-maison-black text-maison-ivory px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-serif text-lg font-light tracking-wide">Maison Jové</h3>
                <p className="text-xs text-maison-ivory/60 font-light">We typically reply within minutes</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-maison-charcoal rounded transition-colors duration-200"
                  aria-label={isMinimized ? 'Expand' : 'Minimize'}
                >
                  <Minimize2 size={16} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-maison-charcoal rounded transition-colors duration-200"
                  aria-label="Close chat"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Content */}
            {!isMinimized && (
              <>
                {!hasStartedChat ? (
                  /* Start Chat Form */
                  <div className="flex-1 p-6 flex flex-col">
                    <div className="mb-6">
                      <h4 className="font-serif text-xl font-light text-maison-black mb-2">
                        Welcome
                      </h4>
                      <p className="text-maison-graphite text-sm font-light">
                        Please share your details to start a conversation with our team.
                      </p>
                    </div>

                    <div className="space-y-4 flex-1">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-maison-graphite mb-2 font-medium">
                          Your Name
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="maison-input text-sm"
                          placeholder="Enter your name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-maison-graphite mb-2 font-medium">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="maison-input text-sm"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <button
                      onClick={startChat}
                      disabled={!customerName.trim() || !customerEmail.trim()}
                      className="maison-btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Start Conversation
                    </button>
                  </div>
                ) : (
                  /* Chat Messages */
                  <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-maison-cream/30">
                      {messages.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-maison-graphite/60 text-sm font-light">
                            Send us a message and we'll respond shortly.
                          </p>
                        </div>
                      )}
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] px-4 py-3 ${
                              msg.sender_type === 'customer'
                                ? 'bg-maison-black text-maison-ivory'
                                : 'bg-maison-ivory border border-maison-warm text-maison-charcoal'
                            }`}
                          >
                            <p className="text-sm font-light leading-relaxed">{msg.message}</p>
                            <p className={`text-[10px] mt-1 ${
                              msg.sender_type === 'customer' ? 'text-maison-ivory/50' : 'text-maison-graphite/50'
                            }`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-maison-warm bg-maison-ivory flex-shrink-0">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-3 bg-maison-cream border-0 text-sm font-light text-maison-charcoal placeholder:text-maison-graphite/50 focus:outline-none focus:ring-1 focus:ring-maison-gold"
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!message.trim() || sending}
                          className="p-3 bg-maison-black text-maison-ivory hover:bg-maison-charcoal transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Send message"
                        >
                          <Send size={18} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
