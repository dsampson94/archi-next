'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineChat,
  HiOutlineSearch,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineX,
  HiOutlineChevronRight,
  HiOutlinePhone,
  HiOutlineUser,
  HiOutlinePaperAirplane,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';

interface Message {
  id: string;
  content: string;
  contentType: string;
  direction: 'INBOUND' | 'OUTBOUND';
  senderType: 'USER' | 'AI' | 'HUMAN';
  confidence?: number;
  createdAt: string;
}

interface Conversation {
  id: string;
  externalUserId: string;
  externalUserName?: string;
  channel: string;
  status: string;
  isHandedOff: boolean;
  lastMessageAt: string;
  messageCount: number;
  messages?: Message[];
}

const formatPhoneNumber = (phone: string) => {
  // Format as +27 XX XXX XXXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 11) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
};

const formatMessageTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'handed-off'>('all');
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('filter', filter);
      }

      const response = await fetch(`/api/conversations?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchConversations();
    // Poll for new conversations every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setReplyText('');
    fetchMessages(conversation.id);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendReply = async () => {
    if (!selectedConversation || !replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: replyText.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add the new message to the list
        setMessages((prev) => [...prev, {
          id: data.message.id,
          content: data.message.content,
          contentType: 'TEXT',
          direction: 'OUTBOUND',
          senderType: 'HUMAN',
          createdAt: data.message.createdAt,
        }]);
        setReplyText('');
        // Update conversation status in list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversation.id
              ? { ...c, isHandedOff: false }
              : c
          )
        );
        if (selectedConversation) {
          setSelectedConversation({ ...selectedConversation, isHandedOff: false });
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        conv.externalUserId.toLowerCase().includes(query) ||
        conv.externalUserName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Conversations</h1>
          <p className="text-slate-400 mt-1">
            View and manage WhatsApp conversations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </span>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-400">Live</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by phone or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-archi-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'handed-off'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-archi-500/20 text-archi-400 border border-archi-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Handed Off'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Conversations List */}
        <div className="w-full sm:w-80 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-archi-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-400 mt-3">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <HiOutlineChat className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-white font-medium">No conversations yet</p>
              <p className="text-slate-400 text-sm mt-1">
                Conversations will appear when people message your WhatsApp number
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full p-4 text-left hover:bg-slate-800/30 transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-slate-800/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <FaWhatsapp className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-white text-sm truncate">
                          {conv.externalUserName || formatPhoneNumber(conv.externalUserId)}
                        </span>
                        <span className="text-xs text-slate-500 shrink-0">
                          {formatTimeAgo(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {conv.isHandedOff ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400">
                            <HiOutlineExclamationCircle className="w-3 h-3 mr-1" />
                            Handed off
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400">
                            <HiOutlineCheckCircle className="w-3 h-3 mr-1" />
                            AI handling
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {conv.messageCount} messages
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation Detail */}
        <div className="hidden sm:flex flex-1 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden flex-col">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <HiOutlineChat className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-white font-medium">Select a conversation</p>
                <p className="text-slate-400 text-sm mt-1">
                  Choose a conversation from the list to view messages
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <FaWhatsapp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">
                      {selectedConversation.externalUserName || formatPhoneNumber(selectedConversation.externalUserId)}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {formatPhoneNumber(selectedConversation.externalUserId)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConversation.isHandedOff && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-amber-500/10 text-amber-400">
                      Needs attention
                    </span>
                  )}
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <HiOutlineX className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-archi-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    No messages in this conversation
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                          msg.direction === 'OUTBOUND'
                            ? 'bg-archi-500/20 text-white'
                            : 'bg-slate-800 text-white'
                        }`}
                      >
                        {msg.direction === 'OUTBOUND' && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium ${
                              msg.senderType === 'AI' ? 'text-archi-400' : 'text-blue-400'
                            }`}>
                              {msg.senderType === 'AI' ? '🤖 Archi' : '👤 Support'}
                            </span>
                            {msg.confidence !== undefined && (
                              <span className="text-xs text-slate-500">
                                {Math.round(msg.confidence * 100)}% confident
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <span className="text-xs text-slate-500 mt-1 block">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={sendingReply}
                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-archi-500 disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sendingReply}
                    className="p-3 bg-archi-500 hover:bg-archi-400 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingReply ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <HiOutlinePaperAirplane className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Messages will be sent via WhatsApp to {selectedConversation?.externalUserName || formatPhoneNumber(selectedConversation?.externalUserId || '')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
