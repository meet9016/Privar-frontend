import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { memberApi, API_BASE, assetUrl } from '../lib/api';
import { 
  MessageSquare, 
  Send, 
  Search, 
  UserPlus, 
  Users, 
  Check, 
  CheckCheck, 
  ArrowLeft, 
  Phone, 
  X, 
  Smile, 
  Circle,
  Clock,
  Sparkles
} from 'lucide-react';
import { io } from 'socket.io-client';
import { toast } from '../lib/toast';

const cleanPhone = (num) => {
  if (!num) return '';
  return String(num).replace(/\D/g, '').slice(-10);
};

export default function ChatPage() {
  const { user, token } = useContext(AuthContext);
  const { unreadChatCount } = useChat();

  // Current logged in user ID with multi-level fallback
  const getMyUserId = useCallback(() => {
    if (user?.id) return String(user.id);
    if (user?._id) return String(user._id);
    if (user?.userId) return String(user.userId);

    const rawToken = token || localStorage.getItem('auth_token');
    if (rawToken) {
      try {
        const clean = rawToken.replace(/^Bearer\s+/i, '');
        const payload = JSON.parse(atob(clean.split('.')[1]));
        const id = payload.id || payload._id || payload.userId;
        if (id) return String(id);
      } catch (_) {}
    }

    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const id = parsed.id || parsed._id || parsed.userId;
        if (id) return String(id);
      }
    } catch (_) {}

    return '';
  }, [user, token]);

  const currentUserId = getMyUserId();

  // State
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchConvQuery, setSearchConvQuery] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Online & Typing tracking
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({}); // conversationId -> boolean

  // Modals
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // New Group state
  const [groupName, setGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);

  // Socket reference
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const sendingRef = useRef(false);
  const activeChatRef = useRef(activeChat);
  const processedMsgIdsRef = useRef(new Set());

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Scroll to bottom of message container
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  // 1. Fetch Conversations from REST
  const fetchConversations = useCallback(async () => {
    try {
      const res = await memberApi.get('/chat/conversations');
      const list = res.data?.data || res.data || [];
      setConversations(list);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  // 2. Fetch Messages for active chat
  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;
    setLoadingMessages(true);
    try {
      const res = await memberApi.get(`/chat/${convId}/messages?limit=60`);
      const data = res.data?.data?.messages || res.data?.messages || [];
      setMessages(data);
      setTimeout(() => scrollToBottom(false), 50);

      // Mark as read in server
      memberApi.post(`/chat/${convId}/read`).catch(() => {});
      if (socketRef.current) {
        socketRef.current.emit('mark_read', { conversationId: convId });
      }

      // Clear local unread count in sidebar and decrement global unread count
      setConversations(prev => {
        const found = prev.find(c => c._id === convId);
        if (found?.unreadCount > 0) {
          window.dispatchEvent(new CustomEvent('chat-unread-decrement', { detail: { count: found.unreadCount } }));
        }
        return prev.map(c => c._id === convId ? { ...c, unreadCount: 0 } : c);
      });
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [scrollToBottom]);

  // 3. Socket Initialization & Lifecycle
  useEffect(() => {
    if (!token) return;

    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    const socket = io(API_BASE, {
      auth: { token: authToken },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Real-time Chat Socket connected:', socket.id);
      // Query online users
      socket.emit('get_online_users', (onlineIds) => {
        if (Array.isArray(onlineIds)) {
          setOnlineUsers(new Set(onlineIds.map(String)));
        }
      });
    });

    socket.on('user_online', ({ userId }) => {
      setOnlineUsers(prev => new Set([...prev, String(userId)]));
    });

    socket.on('user_offline', ({ userId }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(String(userId));
        return next;
      });
    });

    // Handle incoming messages
    socket.on('receive_message', (msg) => {
      const msgId = String(msg._id || '');
      const isSender = String(msg.senderId?._id || msg.senderId?.id || msg.senderId || '') === currentUserId;
      const isOpenChat = activeChatRef.current?._id === msg.conversationId;

      // Deduplicate incoming message processing
      const isNew = msgId ? !processedMsgIdsRef.current.has(msgId) : true;
      if (msgId) {
        processedMsgIdsRef.current.add(msgId);
        if (processedMsgIdsRef.current.size > 2000) {
          const list = Array.from(processedMsgIdsRef.current);
          processedMsgIdsRef.current = new Set(list.slice(list.length - 1000));
        }
      }

      // If message is for currently open conversation
      if (isOpenChat) {
        setMessages(prev => {
          // 1. Avoid duplicate message if real _id already exists
          if (prev.some(m => m._id === msg._id)) return prev;

          // 2. If message matches an optimistic clientTempId, replace it
          if (msg.clientTempId && prev.some(m => m._id === msg.clientTempId)) {
            return prev.map(m => m._id === msg.clientTempId ? msg : m);
          }

          // 3. If message is sent by me and a temporary message exists with identical text, replace it
          if (isSender) {
            const tempIndex = prev.findIndex(m => 
              String(m._id).startsWith('temp_') && m.message === msg.message
            );
            if (tempIndex !== -1) {
              const next = [...prev];
              next[tempIndex] = msg;
              return next;
            }
          }

          return [...prev, msg];
        });
        setTimeout(() => scrollToBottom(true), 50);

        // Mark message read
        if (!isSender) {
          socket.emit('mark_read', { conversationId: msg.conversationId });
          memberApi.post(`/chat/${msg.conversationId}/read`).catch(() => {});
        }
      }

      // Update conversations sidebar list
      setConversations(prev => {
        const index = prev.findIndex(c => c._id === msg.conversationId);
        if (index !== -1) {
          const updatedChat = { ...prev[index] };
          updatedChat.lastMessage = msg;
          updatedChat.lastMessageAt = msg.createdAt || new Date().toISOString();
          
          // Increment unread count ONLY ONCE if chat is not currently open, message is from other user, and message is new
          if (!isOpenChat && !isSender && isNew) {
            updatedChat.unreadCount = (updatedChat.unreadCount || 0) + 1;
            window.dispatchEvent(new CustomEvent('chat-unread-increment', { detail: { delta: 1 } }));
          }

          const rest = prev.filter(c => c._id !== msg.conversationId);
          return [updatedChat, ...rest];
        } else {
          // New conversation created, refetch list
          fetchConversations();
          return prev;
        }
      });
    });

    // Handle general conversation update (update lastMessage and reorder without double-incrementing unread)
    socket.on('conversation_updated', ({ conversationId, lastMessage, lastMessageAt }) => {
      setConversations(prev => {
        const index = prev.findIndex(c => c._id === conversationId);
        if (index !== -1) {
          const updatedChat = { ...prev[index] };
          if (lastMessage) updatedChat.lastMessage = lastMessage;
          if (lastMessageAt) updatedChat.lastMessageAt = lastMessageAt;

          // Note: unreadCount is NOT incremented here because receive_message already handled it accurately
          const rest = prev.filter(c => c._id !== conversationId);
          return [updatedChat, ...rest];
        } else {
          fetchConversations();
          return prev;
        }
      });
    });

    // Typing events
    socket.on('typing_start', ({ conversationId, userId: senderId }) => {
      if (String(senderId) !== currentUserId) {
        setTypingUsers(prev => ({ ...prev, [conversationId]: true }));
      }
    });

    socket.on('typing_stop', ({ conversationId, userId: senderId }) => {
      if (String(senderId) !== currentUserId) {
        setTypingUsers(prev => ({ ...prev, [conversationId]: false }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, currentUserId, fetchConversations, scrollToBottom]);

  // Initial load of conversations
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // When activeChat changes, join socket room and load messages
  useEffect(() => {
    if (!activeChat?._id) return;

    if (socketRef.current) {
      socketRef.current.emit('join_conversation', activeChat._id);
    }

    fetchMessages(activeChat._id);

    return () => {
      if (socketRef.current && activeChat?._id) {
        socketRef.current.emit('leave_conversation', activeChat._id);
      }
    };
  }, [activeChat?._id, fetchMessages]);

  // Handle typing debounce
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!activeChat?._id || !socketRef.current) return;

    socketRef.current.emit('typing_start', { conversationId: activeChat._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing_stop', { conversationId: activeChat._id });
    }, 2000);
  };

  // Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || !activeChat?._id || sendingRef.current) return;

    sendingRef.current = true;
    setInputText('');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit('typing_stop', { conversationId: activeChat._id });

    // Optimistic message
    const tempId = 'temp_' + Date.now();
    const optimisticMsg = {
      _id: tempId,
      clientTempId: tempId,
      conversationId: activeChat._id,
      senderId: {
        _id: currentUserId,
        first_name: user?.first_name || 'Me',
        last_name: user?.last_name || ''
      },
      message: trimmed,
      messageType: 'text',
      createdAt: new Date().toISOString(),
      readBy: []
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(true), 20);

    // Send via socket first, with REST fallback
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_message', {
        conversationId: activeChat._id,
        message: trimmed,
        messageType: 'text',
        clientTempId: tempId
      }, (res) => {
        sendingRef.current = false;
        if (res?.success && res.message) {
          // Replace optimistic message with actual message from DB
          setMessages(prev => {
            const alreadyHasReal = prev.some(m => m._id === res.message._id);
            if (alreadyHasReal) {
              return prev.filter(m => m._id !== tempId && m.clientTempId !== tempId);
            }
            return prev.map(m => (m._id === tempId || m.clientTempId === tempId) ? res.message : m);
          });
        } else if (res?.error) {
          toast.error(res.error || 'Failed to send');
          setMessages(prev => prev.filter(m => m._id !== tempId));
        }
      });
    } else {
      // Fallback to REST
      try {
        const res = await memberApi.post(`/chat/${activeChat._id}/messages`, {
          message: trimmed,
          messageType: 'text',
          clientTempId: tempId
        });
        const savedMsg = res.data?.data || res.data;
        if (savedMsg) {
          setMessages(prev => {
            const alreadyHasReal = prev.some(m => m._id === savedMsg._id);
            if (alreadyHasReal) {
              return prev.filter(m => m._id !== tempId && m.clientTempId !== tempId);
            }
            return prev.map(m => (m._id === tempId || m.clientTempId === tempId) ? savedMsg : m);
          });
        }
      } catch (err) {
        toast.error('Failed to send message');
        setMessages(prev => prev.filter(m => m._id !== tempId));
      } finally {
        sendingRef.current = false;
      }
    }
  };

  // Search Users for New Chat Modal
  const searchUsers = useCallback(async (query) => {
    setLoadingUsers(true);
    try {
      const res = await memberApi.get(`/chat/users?search=${encodeURIComponent(query || '')}`);
      setAvailableUsers(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (showNewChatModal || showNewGroupModal) {
      searchUsers(userSearchQuery);
    }
  }, [showNewChatModal, showNewGroupModal, userSearchQuery, searchUsers]);

  // Start 1-to-1 Chat with a user
  const handleStartPrivateChat = async (targetUser) => {
    try {
      const res = await memberApi.post('/chat/private', { targetUserId: targetUser._id });
      const conversation = res.data?.data || res.data;

      // Add otherUser if not already populated
      if (!conversation.otherUser) {
        conversation.otherUser = targetUser;
      }

      // Add to conversations list if not present
      setConversations(prev => {
        const exists = prev.find(c => c._id === conversation._id);
        if (exists) return prev;
        return [conversation, ...prev];
      });

      setActiveChat(conversation);
      setShowNewChatModal(false);
      setUserSearchQuery('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start conversation');
    }
  };

  // Create Group Chat
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (selectedGroupMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    try {
      const res = await memberApi.post('/chat/group', {
        name: groupName.trim(),
        memberIds: selectedGroupMembers
      });
      const newGroup = res.data?.data || res.data;

      setConversations(prev => [newGroup, ...prev]);
      setActiveChat(newGroup);
      setShowNewGroupModal(false);
      setGroupName('');
      setSelectedGroupMembers([]);
      toast.success('Group created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    }
  };

  // Helpers to get display details
  const getChatDisplayName = (chat) => {
    if (!chat) return '';
    if (chat.type === 'group') return chat.name || 'Group Chat';
    const other = chat.otherUser;
    if (!other) return 'Community Member';
    const fullName = `${other.first_name || ''} ${other.last_name || ''}`.trim();
    return fullName || other.number || 'Member';
  };

  const getChatAvatar = (chat) => {
    if (!chat) return '';
    if (chat.type === 'group') return chat.image || '';
    return chat.otherUser?.image || chat.otherUser?.profile_image || '';
  };

  const isUserOnline = (chat) => {
    if (!chat || chat.type === 'group') return false;
    const otherId = String(chat.otherUser?._id || '');
    return onlineUsers.has(otherId);
  };

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    if (chat.unreadCount > 0) {
      window.dispatchEvent(new CustomEvent('chat-unread-decrement', { detail: { count: chat.unreadCount } }));
      setConversations(prev => prev.map(c => c._id === chat._id ? { ...c, unreadCount: 0 } : c));
    }
    if (socketRef.current) {
      socketRef.current.emit('mark_read', { conversationId: chat._id });
    }
    memberApi.post(`/chat/${chat._id}/read`).catch(() => {});
  };

  // Filter conversations by search term
  const filteredConversations = conversations.filter(c => {
    const name = getChatDisplayName(c).toLowerCase();
    const last = (c.lastMessage?.message || '').toLowerCase();
    const q = searchConvQuery.toLowerCase();
    return name.includes(q) || last.includes(q);
  });

  // Helper date formatter for message timestamps
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatChatListDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-surface border border-border rounded-2xl overflow-hidden shadow-glass-sm animate-fade-in">
      
      {/* ======================================================== */}
      {/* LEFT SIDEBAR: Conversations List                         */}
      {/* ======================================================== */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-surface-secondary/20 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Top Header */}
        <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text leading-tight">Messages</h2>
                {unreadChatCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary text-white shadow-sm">
                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary">Real-time Community Chat</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setShowNewGroupModal(true); setUserSearchQuery(''); }}
              title="Create Group Chat"
              className="p-2 rounded-xl text-text-secondary hover:text-primary hover:bg-surface-secondary transition-all"
            >
              <Users className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setShowNewChatModal(true); setUserSearchQuery(''); }}
              title="Start New Chat"
              className="p-2 rounded-xl bg-primary text-white hover:bg-primary-hover shadow-sm transition-all"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search input in sidebar */}
        <div className="p-3 border-b border-border bg-surface">
          <div className="relative">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chats or members..."
              value={searchConvQuery}
              onChange={(e) => setSearchConvQuery(e.target.value)}
              className="w-full bg-surface-secondary/50 border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-text placeholder:text-text-secondary focus:outline-none focus:border-primary/60 transition-all"
            />
            {searchConvQuery && (
              <button 
                onClick={() => setSearchConvQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-border/20">
          {loadingConversations ? (
            <div className="p-8 text-center text-text-secondary space-y-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-text-secondary space-y-3">
              <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center mx-auto text-text-secondary">
                <MessageSquare className="w-6 h-6 opacity-60" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">No chats yet</p>
                <p className="text-xs mt-1">Start chatting with community members.</p>
              </div>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                New Chat
              </button>
            </div>
          ) : (
            filteredConversations.map(chat => {
              const isSelected = activeChat?._id === chat._id;
              const online = isUserOnline(chat);
              const displayName = getChatDisplayName(chat);
              const avatar = getChatAvatar(chat);
              const isTyping = typingUsers[chat._id];

              return (
                <button
                  key={chat._id}
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 relative group ${
                    isSelected 
                      ? 'bg-primary/10 border border-primary/25 shadow-sm' 
                      : 'hover:bg-surface border border-transparent'
                  }`}
                >
                  {/* Avatar with Online Badge */}
                  <div className="relative flex-shrink-0">
                    {avatar ? (
                      <img 
                        src={assetUrl(avatar)} 
                        alt={displayName} 
                        className="w-11 h-11 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-primary-light text-white font-bold text-sm flex items-center justify-center shadow-sm">
                        {chat.type === 'group' ? (
                          <Users className="w-5 h-5 text-white" />
                        ) : (
                          displayName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                    )}
                    {online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-surface rounded-full shadow-sm" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`font-semibold text-sm truncate ${isSelected ? 'text-primary' : 'text-text'}`}>
                        {displayName}
                      </span>
                      <span className="text-[10px] text-text-secondary whitespace-nowrap ml-2">
                        {formatChatListDate(chat.lastMessageAt || chat.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs truncate ${isTyping ? 'text-primary font-medium italic' : 'text-text-secondary'}`}>
                        {isTyping ? (
                          'typing...'
                        ) : chat.lastMessage ? (
                          chat.lastMessage.message
                        ) : (
                          'Tap to send message'
                        )}
                      </p>

                      {/* Unread badge */}
                      {Boolean(chat.unreadCount) && (
                        <span className="flex-shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT SIDE: Main Active Chat Area                        */}
      {/* ======================================================== */}
      <div className={`flex-1 flex flex-col bg-surface ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Active Chat Header */}
            <div className="p-3.5 px-5 border-b border-border bg-surface flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setActiveChat(null)}
                  className="md:hidden p-1.5 -ml-2 rounded-lg text-text-secondary hover:text-text hover:bg-surface-secondary"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Avatar */}
                <div className="relative">
                  {getChatAvatar(activeChat) ? (
                    <img
                      src={assetUrl(getChatAvatar(activeChat))}
                      alt={getChatDisplayName(activeChat)}
                      className="w-10 h-10 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary-light text-white font-bold text-sm flex items-center justify-center">
                      {activeChat.type === 'group' ? (
                        <Users className="w-5 h-5 text-white" />
                      ) : (
                        getChatDisplayName(activeChat).slice(0, 2).toUpperCase()
                      )}
                    </div>
                  )}
                  {isUserOnline(activeChat) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-surface rounded-full shadow-sm" />
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-text text-sm md:text-base leading-tight">
                    {getChatDisplayName(activeChat)}
                  </h3>
                  <p className="text-[11px] text-text-secondary flex items-center gap-1">
                    {typingUsers[activeChat._id] ? (
                      <span className="text-primary font-semibold flex items-center gap-1">
                        <span className="animate-pulse">typing...</span>
                      </span>
                    ) : activeChat.type === 'group' ? (
                      <span>Group Conversation</span>
                    ) : isUserOnline(activeChat) ? (
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Online
                      </span>
                    ) : (
                      <span>Offline</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Chat action options */}
              {activeChat.otherUser?.number && (
                <a
                  href={`tel:${activeChat.otherUser.number}`}
                  className="p-2 rounded-xl text-text-secondary hover:text-primary hover:bg-surface-secondary transition-all"
                  title="Call Member"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 bg-surface-secondary/20">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center text-text-secondary space-y-2">
                  <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary space-y-2">
                  <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center text-primary/70">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-text">Say hello! 👋</p>
                  <p className="text-xs max-w-xs">Send a message to start this real-time conversation.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const senderIdStr = String(msg.senderId?._id || msg.senderId?.id || msg.senderId || '');
                  const senderNum = cleanPhone(msg.senderId?.number);
                  const myNum = cleanPhone(user?.number);
                  const isMe = Boolean(
                    (currentUserId && senderIdStr && currentUserId === senderIdStr) ||
                    (myNum && senderNum && myNum === senderNum)
                  );
                  const senderName = msg.senderId?.first_name 
                    ? `${msg.senderId.first_name} ${msg.senderId.last_name || ''}`.trim() 
                    : '';

                  return (
                    <div
                      key={msg._id || idx}
                      className={`w-full flex flex-col ${isMe ? 'items-end' : 'items-start'} transition-all`}
                    >
                      {/* In group chats, display sender name for received messages */}
                      {activeChat.type === 'group' && !isMe && senderName && (
                        <span className="text-[10px] text-text-secondary font-medium ml-2 mb-1">
                          {senderName}
                        </span>
                      )}

                      <div
                        className={`max-w-[78%] md:max-w-[65%] px-4 py-2.5 rounded-2xl shadow-sm text-sm relative group ${
                          isMe
                            ? 'bg-primary text-white rounded-tr-xs'
                            : 'bg-surface border border-border/70 text-text rounded-tl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words leading-relaxed">
                          {msg.message}
                        </p>

                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-white/75' : 'text-text-secondary'}`}>
                          <span>{formatTime(msg.createdAt)}</span>
                          {isMe && (
                            <CheckCheck className="w-3.5 h-3.5 text-white/90" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator bubble */}
              {typingUsers[activeChat._id] && (
                <div className="flex items-center gap-1.5 bg-surface border border-border/80 px-3 py-2 rounded-2xl w-fit shadow-xs">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 md:p-4 border-t border-border bg-surface">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 bg-surface-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-primary/60 transition-all"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`p-2.5 md:px-5 md:py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm ${
                    inputText.trim()
                      ? 'bg-primary text-white hover:bg-primary-hover'
                      : 'bg-surface-secondary text-text-secondary cursor-not-allowed opacity-50'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden md:inline text-sm">Send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Empty state: No active chat selected */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-secondary space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center text-primary shadow-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="max-w-sm">
              <h3 className="font-bold text-lg text-text">Your Community Messages</h3>
              <p className="text-sm mt-1 text-text-secondary">
                Select an existing conversation from the left, or click the button below to start chatting.
              </p>
            </div>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Start a Conversation
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: New 1-to-1 Chat                                   */}
      {/* ======================================================== */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-glass-lg overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-text">New Direct Message</h3>
              </div>
              <button 
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-lg text-text-secondary hover:text-text hover:bg-surface-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-border bg-surface-secondary/20">
              <div className="relative">
                <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name or mobile number..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>
            </div>

            {/* User List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {loadingUsers ? (
                <div className="p-8 text-center text-text-secondary">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs">Searching members...</p>
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="p-8 text-center text-text-secondary text-sm">
                  No members found matching your search.
                </div>
              ) : (
                availableUsers.map(u => {
                  const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.number || 'Member';
                  const avatar = u.image || u.profile_image;
                  const isOnline = onlineUsers.has(String(u._id));

                  return (
                    <button
                      key={u._id}
                      onClick={() => handleStartPrivateChat(u)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-surface-secondary/60 flex items-center gap-3 transition-colors group"
                    >
                      <div className="relative flex-shrink-0">
                        {avatar ? (
                          <img src={assetUrl(avatar)} alt={fullName} className="w-10 h-10 rounded-full object-cover border border-border" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                            {fullName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-surface rounded-full shadow-sm" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-text group-hover:text-primary transition-colors truncate">
                            {fullName}
                          </span>
                          {u.is_committee && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                              {u.designation || 'Committee'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-text-secondary truncate flex items-center gap-2">
                          <span>{u.number}</span>
                          {u.village && <span>• {u.village}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: New Group Chat                                    */}
      {/* ======================================================== */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-glass-lg overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-text">Create Group Chat</h3>
              </div>
              <button 
                onClick={() => setShowNewGroupModal(false)}
                className="p-1 rounded-lg text-text-secondary hover:text-text hover:bg-surface-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Committee Discussion, Event Volunteers"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-surface-secondary/40 border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Select Members ({selectedGroupMembers.length} selected)
                </label>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full bg-surface-secondary/40 border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="max-h-52 overflow-y-auto p-1 space-y-1 border border-border rounded-xl">
                  {availableUsers.map(u => {
                    const isSelected = selectedGroupMembers.includes(u._id);
                    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.number;

                    return (
                      <div
                        key={u._id}
                        onClick={() => {
                          setSelectedGroupMembers(prev => 
                            isSelected ? prev.filter(id => id !== u._id) : [...prev, u._id]
                          );
                        }}
                        className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-surface-secondary/50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-medium text-text">{fullName}</span>
                          {u.is_committee && (
                            <span className="text-[10px] text-amber-600 font-semibold">({u.designation || 'Committee'})</span>
                          )}
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected ? 'bg-primary border-primary text-white' : 'border-border'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-border bg-surface-secondary/20 flex justify-end gap-2">
              <button
                onClick={() => setShowNewGroupModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-surface-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-hover shadow-sm"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
