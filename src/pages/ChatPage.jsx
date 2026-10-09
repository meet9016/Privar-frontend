import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { memberApi, API_BASE, assetUrl, uploadFileToDigitalks } from '../lib/api';
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
  Sparkles,
  Camera,
  Info,
  UserMinus,
  Shield,
  ShieldCheck,
  Plus,
  Trash2,
  LogOut,
  Edit2
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
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // New Group state
  const [groupName, setGroupName] = useState('');
  const [groupImageFile, setGroupImageFile] = useState(null);
  const [groupImagePreview, setGroupImagePreview] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Group Details & Members state
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingGroupMembers, setLoadingGroupMembers] = useState(false);
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [editGroupNameVal, setEditGroupNameVal] = useState('');
  const [selectedAddMembers, setSelectedAddMembers] = useState([]);
  const [addingMembers, setAddingMembers] = useState(false);

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

      // Notify delivered for messages not sent by me
      if (socketRef.current) {
        data.forEach(m => {
          const sId = String(m.senderId?._id || m.senderId?.id || m.senderId || '');
          if (sId !== currentUserId && (!m.deliveredTo || !m.deliveredTo.some(d => String(d.userId) === currentUserId))) {
            socketRef.current.emit('message_delivered', { messageId: m._id, conversationId: convId });
          }
        });
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
  }, [currentUserId, scrollToBottom]);

  // Fetch Group Members for Group Info Modal
  const fetchGroupMembers = useCallback(async (convId) => {
    if (!convId) return;
    setLoadingGroupMembers(true);
    try {
      const res = await memberApi.get(`/chat/${convId}/members`);
      const list = res.data?.data || res.data || [];
      setGroupMembers(list);
    } catch (err) {
      console.error('Failed to load group members:', err);
    } finally {
      setLoadingGroupMembers(false);
    }
  }, []);

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

      // Automatically send delivery receipt back
      if (!isSender && msgId) {
        socket.emit('message_delivered', { messageId: msgId, conversationId: msg.conversationId });
      }

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
          if (prev.some(m => m._id === msg._id)) return prev;

          if (msg.clientTempId && prev.some(m => m._id === msg.clientTempId)) {
            return prev.map(m => m._id === msg.clientTempId ? msg : m);
          }

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
          
          if (!isOpenChat && !isSender && isNew) {
            updatedChat.unreadCount = (updatedChat.unreadCount || 0) + 1;
            window.dispatchEvent(new CustomEvent('chat-unread-increment', { detail: { delta: 1 } }));
          }

          const rest = prev.filter(c => c._id !== msg.conversationId);
          return [updatedChat, ...rest];
        } else {
          fetchConversations();
          return prev;
        }
      });
    });

    // Real-time Seen/Read Receipts Update (turns ticks to Double Blue)
    socket.on('messages_read', ({ conversationId, readByUserId }) => {
      setMessages(prev => prev.map(m => {
        if (m.conversationId === conversationId) {
          const alreadyRead = (m.readBy || []).some(r => String(r.userId?._id || r.userId) === String(readByUserId));
          if (!alreadyRead) {
            return {
              ...m,
              readBy: [...(m.readBy || []), { userId: readByUserId, readAt: new Date().toISOString() }],
              deliveredTo: [...(m.deliveredTo || []), { userId: readByUserId, deliveredAt: new Date().toISOString() }]
            };
          }
        }
        return m;
      }));
    });

    // Real-time Delivery Status Update (turns single tick to double grey)
    socket.on('message_status_updated', ({ messageId, conversationId, deliveredTo, readBy }) => {
      setMessages(prev => prev.map(m => {
        if (m._id === messageId || m.clientTempId === messageId) {
          return {
            ...m,
            deliveredTo: deliveredTo || m.deliveredTo || [],
            readBy: readBy || m.readBy || []
          };
        }
        return m;
      }));
    });

    // Group members or details updated
    socket.on('group_members_updated', ({ conversationId }) => {
      if (activeChatRef.current?._id === conversationId) {
        fetchGroupMembers(conversationId);
      }
    });

    socket.on('group_updated', ({ conversationId, updated }) => {
      if (activeChatRef.current?._id === conversationId) {
        setActiveChat(prev => ({ ...prev, ...updated }));
      }
      setConversations(prev => prev.map(c => c._id === conversationId ? { ...c, ...updated } : c));
    });

    // Removed from group
    socket.on('removed_from_group', ({ conversationId }) => {
      if (activeChatRef.current?._id === conversationId) {
        setActiveChat(null);
        toast.info('You were removed from this group');
      }
      setConversations(prev => prev.filter(c => c._id !== conversationId));
    });

    // Handle general conversation update
    socket.on('conversation_updated', ({ conversationId, lastMessage, lastMessageAt }) => {
      setConversations(prev => {
        const index = prev.findIndex(c => c._id === conversationId);
        if (index !== -1) {
          const updatedChat = { ...prev[index] };
          if (lastMessage) updatedChat.lastMessage = lastMessage;
          if (lastMessageAt) updatedChat.lastMessageAt = lastMessageAt;
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
  }, [token, currentUserId, fetchConversations, scrollToBottom, fetchGroupMembers]);

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
    if (activeChat.type === 'group') {
      fetchGroupMembers(activeChat._id);
    }

    return () => {
      if (socketRef.current && activeChat?._id) {
        socketRef.current.emit('leave_conversation', activeChat._id);
      }
    };
  }, [activeChat?._id, activeChat?.type, fetchMessages, fetchGroupMembers]);

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
      deliveredTo: [],
      readBy: [{ userId: currentUserId, readAt: new Date().toISOString() }]
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(true), 20);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_message', {
        conversationId: activeChat._id,
        message: trimmed,
        messageType: 'text',
        clientTempId: tempId
      }, (res) => {
        sendingRef.current = false;
        if (res?.success && res.message) {
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

  // Search Users for New Chat Modal / Group Members
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
    if (showNewChatModal || showNewGroupModal || showAddMemberModal) {
      searchUsers(userSearchQuery);
    }
  }, [showNewChatModal, showNewGroupModal, showAddMemberModal, userSearchQuery, searchUsers]);

  // Start 1-to-1 Chat with a user
  const handleStartPrivateChat = async (targetUser) => {
    try {
      const res = await memberApi.post('/chat/private', { targetUserId: targetUser._id });
      const conversation = res.data?.data || res.data;

      if (!conversation.otherUser) {
        conversation.otherUser = targetUser;
      }

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

  // Create Group Chat (with DP image upload)
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (selectedGroupMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    setCreatingGroup(true);
    try {
      let uploadedImageUrl = '';
      if (groupImageFile) {
        try {
          uploadedImageUrl = await uploadFileToDigitalks(groupImageFile, 'chat/groups');
        } catch (uploadErr) {
          console.error('Group DP upload failed:', uploadErr);
        }
      }

      const res = await memberApi.post('/chat/group', {
        name: groupName.trim(),
        image: uploadedImageUrl || '',
        memberIds: selectedGroupMembers
      });
      const newGroup = res.data?.data || res.data;

      setConversations(prev => [newGroup, ...prev]);
      setActiveChat(newGroup);
      setShowNewGroupModal(false);
      setGroupName('');
      setGroupImageFile(null);
      setGroupImagePreview('');
      setSelectedGroupMembers([]);
      toast.success('Group created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  // Update Group Info (Name or DP)
  const handleUpdateGroupInfo = async (newImageFile = null) => {
    if (!activeChat?._id) return;
    try {
      let imageUrl = activeChat.image;
      if (newImageFile) {
        imageUrl = await uploadFileToDigitalks(newImageFile, 'chat/groups');
      }

      const res = await memberApi.patch(`/chat/${activeChat._id}`, {
        name: editGroupNameVal.trim() || activeChat.name,
        image: imageUrl
      });
      const updated = res.data?.data || res.data;
      setActiveChat(prev => ({ ...prev, ...updated }));
      setConversations(prev => prev.map(c => c._id === activeChat._id ? { ...c, ...updated } : c));
      setIsEditingGroupName(false);
      toast.success('Group updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update group');
    }
  };

  // Add Members to Existing Group
  const handleAddMembersToGroup = async () => {
    if (!activeChat?._id || selectedAddMembers.length === 0) return;
    setAddingMembers(true);
    try {
      await memberApi.post(`/chat/${activeChat._id}/members`, {
        memberIds: selectedAddMembers
      });
      toast.success('Members added to group');
      setShowAddMemberModal(false);
      setSelectedAddMembers([]);
      fetchGroupMembers(activeChat._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add members');
    } finally {
      setAddingMembers(false);
    }
  };

  // Remove Member from Group
  const handleRemoveMember = async (memberUserId, memberName) => {
    if (!activeChat?._id || !window.confirm(`Remove ${memberName || 'this member'} from group?`)) return;
    try {
      await memberApi.delete(`/chat/${activeChat._id}/members/${memberUserId}`);
      toast.success('Member removed');
      fetchGroupMembers(activeChat._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  // Leave Group
  const handleLeaveGroup = async () => {
    if (!activeChat?._id || !window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await memberApi.post(`/chat/${activeChat._id}/leave`);
      toast.success('Left group');
      setShowGroupInfoModal(false);
      setActiveChat(null);
      fetchConversations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave group');
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

  // Check if current user is Admin of the active group
  const isGroupAdmin = activeChat?.type === 'group' && groupMembers.some(m => {
    const mId = String(m.userId?._id || m.userId?.id || m.userId);
    return mId === currentUserId && m.role === 'admin';
  });

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

  // Message Status Tick Helper (WhatsApp Style)
  const renderMessageStatus = (msg) => {
    if (String(msg._id).startsWith('temp_')) {
      return <Clock className="w-3.5 h-3.5 text-white/60 animate-spin" />;
    }

    const otherRead = (msg.readBy || []).some(r => {
      const rId = String(r.userId?._id || r.userId?.id || r.userId || '');
      return rId && rId !== currentUserId;
    });

    if (otherRead) {
      // Blue Double Tick (Seen/Read)
      return <CheckCheck className="w-3.5 h-3.5 text-cyan-300 drop-shadow-xs stroke-[2.5]" title="Read / Seen" />;
    }

    const otherDelivered = (msg.deliveredTo || []).some(d => {
      const dId = String(d.userId?._id || d.userId?.id || d.userId || '');
      return dId && dId !== currentUserId;
    });

    const isRecipientOnline = isUserOnline(activeChat);

    if (otherDelivered || isRecipientOnline) {
      // Grey/White Double Tick (Delivered / Online)
      return <CheckCheck className="w-3.5 h-3.5 text-white/80" title="Delivered" />;
    }

    // Single Tick (Sent to Server, Recipient Data Off/Offline)
    return <Check className="w-3.5 h-3.5 text-white/70" title="Sent (Recipient offline)" />;
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
              onClick={() => { setShowNewGroupModal(true); setUserSearchQuery(''); setGroupName(''); setGroupImagePreview(''); setGroupImageFile(null); setSelectedGroupMembers([]); }}
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
              <div 
                onClick={() => {
                  if (activeChat.type === 'group') {
                    setEditGroupNameVal(activeChat.name || '');
                    fetchGroupMembers(activeChat._id);
                    setShowGroupInfoModal(true);
                  }
                }}
                className={`flex items-center gap-3 ${activeChat.type === 'group' ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              >
                {/* Mobile Back Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveChat(null); }}
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
                  <h3 className="font-bold text-text text-sm md:text-base leading-tight flex items-center gap-1.5">
                    {getChatDisplayName(activeChat)}
                    {activeChat.type === 'group' && (
                      <Info className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                    )}
                  </h3>
                  <p className="text-[11px] text-text-secondary flex items-center gap-1">
                    {typingUsers[activeChat._id] ? (
                      <span className="text-primary font-semibold flex items-center gap-1">
                        <span className="animate-pulse">typing...</span>
                      </span>
                    ) : activeChat.type === 'group' ? (
                      <span>{groupMembers.length > 0 ? `${groupMembers.length} members • Tap for group info` : 'Group Conversation • Tap for details'}</span>
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
              <div className="flex items-center gap-2">
                {activeChat.type === 'group' && (
                  <button
                    onClick={() => {
                      setEditGroupNameVal(activeChat.name || '');
                      fetchGroupMembers(activeChat._id);
                      setShowGroupInfoModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-border bg-surface-secondary/40 text-text hover:bg-surface-secondary text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span>Group Info</span>
                  </button>
                )}

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
                        className={`max-w-[85%] md:max-w-[70%] px-3 py-1.5 rounded-2xl shadow-xs text-sm relative group ${
                          isMe
                            ? 'bg-primary text-white rounded-tr-xs ml-auto'
                            : 'bg-surface border border-border/70 text-text rounded-tl-xs mr-auto'
                        }`}
                      >
                        <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-0.5">
                          <p className="whitespace-pre-wrap break-words text-[13.5px] leading-snug flex-1 select-text">
                            {msg.message}
                          </p>
                          <div className={`inline-flex items-center gap-1 ml-auto shrink-0 select-none pb-[1px] text-[10.5px] ${isMe ? 'text-white/80' : 'text-text-secondary/80'}`}>
                            <span className="leading-none">{formatTime(msg.createdAt)}</span>
                            {isMe && renderMessageStatus(msg)}
                          </div>
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
      {/* MODAL: New Group Chat (With DP Image Upload)             */}
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

            <div className="p-4 space-y-4">
              {/* Group DP Upload */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-2xl bg-surface-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                    {groupImagePreview ? (
                      <img src={groupImagePreview} alt="Group DP" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-text-secondary" />
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <Camera className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setGroupImageFile(file);
                          setGroupImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-text-secondary block mb-1">Group DP / Icon (Optional)</label>
                  <p className="text-[11px] text-text-secondary">Upload a community or topic image for this group.</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Group Name *</label>
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
                    placeholder="Search members to add..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full bg-surface-secondary/40 border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto p-1 space-y-1 border border-border rounded-xl">
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
                disabled={creatingGroup || !groupName.trim() || selectedGroupMembers.length === 0}
                onClick={handleCreateGroup}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-hover shadow-sm disabled:opacity-50"
              >
                {creatingGroup ? 'Creating Group...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Group Info & Member Management                    */}
      {/* ======================================================== */}
      {showGroupInfoModal && activeChat && activeChat.type === 'group' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-glass-lg overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface-secondary/30">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-text">Group Info</h3>
              </div>
              <button 
                onClick={() => { setShowGroupInfoModal(false); setIsEditingGroupName(false); }}
                className="p-1 rounded-lg text-text-secondary hover:text-text hover:bg-surface-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Group DP & Name Edit */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-secondary/40 border border-border">
                <div className="relative group">
                  {getChatAvatar(activeChat) ? (
                    <img 
                      src={assetUrl(getChatAvatar(activeChat))} 
                      alt={activeChat.name} 
                      className="w-16 h-16 rounded-2xl object-cover border border-border shadow-xs" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-primary-light text-white font-bold text-xl flex items-center justify-center shadow-xs">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                  )}

                  {isGroupAdmin && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <Camera className="w-5 h-5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUpdateGroupInfo(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {isEditingGroupName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editGroupNameVal}
                        onChange={(e) => setEditGroupNameVal(e.target.value)}
                        className="bg-surface border border-primary rounded-xl px-3 py-1.5 text-sm text-text flex-1"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateGroupInfo()}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditingGroupName(false)}
                        className="p-1.5 text-text-secondary hover:text-text rounded-xl"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-text truncate">{activeChat.name || 'Group Chat'}</h4>
                      {isGroupAdmin && (
                        <button
                          onClick={() => { setEditGroupNameVal(activeChat.name || ''); setIsEditingGroupName(true); }}
                          className="p-1 text-text-secondary hover:text-primary rounded-lg transition-colors"
                          title="Edit Group Name"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-text-secondary mt-0.5">
                    {groupMembers.length} Members • Created {new Date(activeChat.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Members Section Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-text">Group Members ({groupMembers.length})</h4>
                  <p className="text-xs text-text-secondary">Community members in this group</p>
                </div>
                {isGroupAdmin && (
                  <button
                    onClick={() => { setShowAddMemberModal(true); setUserSearchQuery(''); setSelectedAddMembers([]); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Members
                  </button>
                )}
              </div>

              {/* Member List */}
              <div className="space-y-1.5 divide-y divide-border/20 border border-border rounded-2xl overflow-hidden bg-surface">
                {loadingGroupMembers ? (
                  <div className="p-8 text-center text-text-secondary">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">Loading members...</p>
                  </div>
                ) : (
                  groupMembers.map((m, idx) => {
                    const u = m.userId || {};
                    const memberIdStr = String(u._id || u.id || m.userId);
                    const isMe = memberIdStr === currentUserId;
                    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.number || 'Member';
                    const avatar = u.image || u.profile_image;
                    const isAdmin = m.role === 'admin';

                    return (
                      <div key={m._id || idx} className="p-3 flex items-center justify-between hover:bg-surface-secondary/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          {avatar ? (
                            <img src={assetUrl(avatar)} alt={fullName} className="w-9 h-9 rounded-full object-cover border border-border flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {fullName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-text truncate">
                                {fullName} {isMe && <span className="text-xs text-text-secondary font-normal">(You)</span>}
                              </span>
                              {isAdmin && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  Admin
                                </span>
                              )}
                              {u.designation && !isAdmin && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                  {u.designation}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-text-secondary truncate block">{u.number || u.occupation || ''}</span>
                          </div>
                        </div>

                        {/* Admin remove action */}
                        {isGroupAdmin && !isMe && !isAdmin && (
                          <button
                            onClick={() => handleRemoveMember(memberIdStr, fullName)}
                            className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Remove Member from Group"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Leave Group Action */}
              <div className="pt-2">
                <button
                  onClick={handleLeaveGroup}
                  className="w-full py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Leave Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Add Members to Existing Group                     */}
      {/* ======================================================== */}
      {showAddMemberModal && activeChat && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-glass-lg overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-text">Add Members to {activeChat.name}</h3>
              </div>
              <button 
                onClick={() => setShowAddMemberModal(false)}
                className="p-1 rounded-lg text-text-secondary hover:text-text hover:bg-surface-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search community members..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-surface-secondary/40 border border-border rounded-xl pl-8 pr-3 py-2 text-xs text-text focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>

              <div className="max-h-60 overflow-y-auto p-1 space-y-1 border border-border rounded-xl">
                {availableUsers
                  .filter(u => !groupMembers.some(m => String(m.userId?._id || m.userId?.id || m.userId) === String(u._id)))
                  .map(u => {
                    const isSelected = selectedAddMembers.includes(u._id);
                    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.number;

                    return (
                      <div
                        key={u._id}
                        onClick={() => {
                          setSelectedAddMembers(prev => 
                            isSelected ? prev.filter(id => id !== u._id) : [...prev, u._id]
                          );
                        }}
                        className={`p-2.5 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-surface-secondary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-semibold text-text">{fullName}</span>
                          <span className="text-[11px] text-text-secondary">{u.number}</span>
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

            <div className="p-3 border-t border-border bg-surface-secondary/20 flex justify-end gap-2">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-surface-secondary"
              >
                Cancel
              </button>
              <button
                disabled={addingMembers || selectedAddMembers.length === 0}
                onClick={handleAddMembersToGroup}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-hover shadow-sm disabled:opacity-50"
              >
                {addingMembers ? 'Adding...' : `Add Selected (${selectedAddMembers.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
