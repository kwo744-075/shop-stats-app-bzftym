
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/integrations/supabase/client';

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isCurrentUser: boolean;
  roomId: string;
}

interface ChatContextType {
  messages: ChatMessage[];
  unreadCount: number;
  currentUser: string;
  setCurrentUser: (user: string) => void;
  sendMessage: (text: string, roomId?: string) => Promise<void>;
  markAsRead: (roomId?: string) => void;
  clearMessages: (roomId?: string) => Promise<void>;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
}

const DEFAULT_ROOM = 'general';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState('Anonymous');
  const [isOnline, setIsOnline] = useState(true);

  const simulateIncomingMessage = useCallback(() => {
    const responses = [
      "Thanks for the update!",
      "Got it, will check on that.",
      "Looks good from here.",
      "Let me know if you need anything else.",
      "Thanks for keeping me posted."
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    setTimeout(() => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text: randomResponse,
        sender: 'Manager',
        timestamp: new Date(),
        isCurrentUser: false,
        roomId: DEFAULT_ROOM
      };
      
      setMessages(prev => [...prev, newMessage]);
      setUnreadCount(prev => prev + 1);
    }, 1000 + Math.random() * 2000);
  }, []);

  const sendMessage = useCallback(async (text: string, roomId: string = DEFAULT_ROOM) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: currentUser,
      timestamp: new Date(),
      isCurrentUser: true,
      roomId
    };

    setMessages(prev => [...prev, newMessage]);

    // Simulate response
    if (Math.random() > 0.3) {
      simulateIncomingMessage();
    }
  }, [currentUser, simulateIncomingMessage]);

  const markAsRead = useCallback((roomId: string = DEFAULT_ROOM) => {
    setUnreadCount(0);
  }, []);

  const clearMessages = useCallback(async (roomId: string = DEFAULT_ROOM) => {
    setMessages([]);
    setUnreadCount(0);
  }, []);

  const value: ChatContextType = {
    messages,
    unreadCount,
    currentUser,
    setCurrentUser,
    sendMessage,
    markAsRead,
    clearMessages,
    isOnline,
    setIsOnline,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
