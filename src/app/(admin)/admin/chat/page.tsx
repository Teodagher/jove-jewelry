'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Send, MessageCircle, User, Clock, CheckCircle, XCircle } from 'lucide-react';

interface ChatSession {
  id: string;
  customer_email: string;
  customer_name: string;
  status: 'active' | 'closed';
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  message: string;
  sender_type: 'customer' | 'admin';
  created_at: string;
}

// Type-safe wrapper for Supabase operations
const chatDb = {
  sessions: () => supabase.from('chat_sessions' as 'users'),
  messages: () => supabase.from('chat_messages' as 'users')
};

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all chat sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data, error } = await chatDb.sessions()
          .select('*')
          .order('updated_at', { ascending: false });

        if (!error && data) {
          setSessions(data as unknown as ChatSession[]);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();

    // Subscribe to new sessions
    const channel = supabase
      .channel('admin_chat_sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_sessions'
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch messages for selected session
  useEffect(() => {
    if (!selectedSession) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await chatDb.messages()
        .select('*')
        .eq('session_id', selectedSession.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data as unknown as ChatMessage[]);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`admin_chat_${selectedSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${selectedSession.id}`
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSession]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession || sending) return;

    setSending(true);
    try {
      const { error } = await chatDb.messages()
        .insert({
          session_id: selectedSession.id,
          message: newMessage.trim(),
          sender_type: 'admin'
        } as never);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const closeSession = async (sessionId: string) => {
    try {
      await chatDb.sessions()
        .update({ status: 'closed' } as never)
        .eq('id', sessionId);

      setSessions(prev => 
        prev.map(s => s.id === sessionId ? { ...s, status: 'closed' as const } : s)
      );

      if (selectedSession?.id === sessionId) {
        setSelectedSession(prev => prev ? { ...prev, status: 'closed' } : null);
      }
    } catch (error) {
      console.error('Error closing session:', error);
    }
  };

  const reopenSession = async (sessionId: string) => {
    try {
      await chatDb.sessions()
        .update({ status: 'active' } as never)
        .eq('id', sessionId);

      setSessions(prev => 
        prev.map(s => s.id === sessionId ? { ...s, status: 'active' as const } : s)
      );

      if (selectedSession?.id === sessionId) {
        setSelectedSession(prev => prev ? { ...prev, status: 'active' } : null);
      }
    } catch (error) {
      console.error('Error reopening session:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-light text-zinc-900 tracking-wide">
          Live Chat Inbox
        </h1>
        <p className="text-sm text-zinc-600 font-light mt-1">
          Manage customer conversations
        </p>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Sessions List */}
        <div className="w-80 flex-shrink-0 bg-white border border-zinc-200 rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50">
            <h2 className="text-sm font-medium text-zinc-700 uppercase tracking-wider">
              Conversations ({sessions.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-sm">
                No conversations yet
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full p-4 text-left border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${
                    selectedSession?.id === session.id ? 'bg-zinc-100' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-zinc-400 flex-shrink-0" />
                        <span className="font-medium text-zinc-900 text-sm truncate">
                          {session.customer_name}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate mt-1">
                        {session.customer_email}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-0.5 text-xs rounded-full ${
                      session.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400">
                    <Clock size={10} />
                    <span>{formatTime(session.created_at)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white border border-zinc-200 rounded-lg overflow-hidden flex flex-col">
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-zinc-900">{selectedSession.customer_name}</h3>
                  <p className="text-xs text-zinc-500">{selectedSession.customer_email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedSession.status === 'active' ? (
                    <button
                      onClick={() => closeSession(selectedSession.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-zinc-100 text-zinc-600 hover:bg-zinc-200 rounded transition-colors"
                    >
                      <XCircle size={12} />
                      Close
                    </button>
                  ) : (
                    <button
                      onClick={() => reopenSession(selectedSession.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors"
                    >
                      <CheckCircle size={12} />
                      Reopen
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-sm">
                    No messages in this conversation
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-3 rounded-lg ${
                          msg.sender_type === 'admin'
                            ? 'bg-zinc-900 text-white'
                            : 'bg-white border border-zinc-200 text-zinc-800'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${
                          msg.sender_type === 'admin' ? 'text-zinc-400' : 'text-zinc-400'
                        }`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {selectedSession.status === 'active' && (
                <div className="p-4 border-t border-zinc-200 bg-white">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your reply..."
                      className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-zinc-400"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="p-2.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-400">
              <div className="text-center">
                <MessageCircle size={48} strokeWidth={1} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm">Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
