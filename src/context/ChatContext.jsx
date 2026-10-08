import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { memberApi, API_BASE } from '../lib/api';
import { io } from 'socket.io-client';

export const ChatContext = createContext({
  unreadChatCount: 0,
  fetchUnreadCount: () => {},
  setUnreadChatCount: () => {}
});

export function ChatProvider({ children }) {
  const { token, user } = useContext(AuthContext);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await memberApi.get('/chat/unread-count');
      const count = res.data?.data?.totalUnread ?? res.data?.totalUnread ?? 0;
      setUnreadChatCount(Number(count) || 0);
    } catch (err) {
      // Ignore initial unread errors if not logged in
    }
  }, [token]);

  // Initial fetch on token change
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Listen to background socket updates for unread count
  useEffect(() => {
    if (!token || !user) return;

    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    const socket = io(API_BASE, {
      auth: { token: authToken },
      transports: ['websocket', 'polling']
    });

    socket.on('unread_count_updated', () => {
      fetchUnreadCount();
    });

    // Listen to local window events from ChatPage
    const handleDecrement = (e) => {
      const count = Number(e.detail?.count) || 1;
      setUnreadChatCount(prev => Math.max(0, prev - count));
    };

    const handleIncrement = (e) => {
      const delta = Number(e.detail?.delta) || 1;
      setUnreadChatCount(prev => prev + delta);
    };

    const handleRefresh = () => {
      fetchUnreadCount();
    };

    window.addEventListener('chat-unread-decrement', handleDecrement);
    window.addEventListener('chat-unread-increment', handleIncrement);
    window.addEventListener('chat-unread-refresh', handleRefresh);

    return () => {
      socket.disconnect();
      window.removeEventListener('chat-unread-decrement', handleDecrement);
      window.removeEventListener('chat-unread-increment', handleIncrement);
      window.removeEventListener('chat-unread-refresh', handleRefresh);
    };
  }, [token, user, fetchUnreadCount]);

  return (
    <ChatContext.Provider value={{ unreadChatCount, fetchUnreadCount, setUnreadChatCount }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
