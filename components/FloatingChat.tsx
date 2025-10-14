
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/IconSymbol';

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isCurrentUser: boolean;
}

interface FloatingChatProps {
  visible: boolean;
  onClose: () => void;
  currentUser?: string;
  roomId?: string;
}

const CHAT_STORAGE_KEY = 'floating_chat_messages';
const USER_NAME_KEY = 'chat_user_name';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageItem: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  currentUserBubble: {
    backgroundColor: '#007AFF',
  },
  otherUserBubble: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  messageText: {
    fontSize: 16,
  },
  currentUserText: {
    color: 'white',
  },
  messageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  messageSender: {
    fontSize: 12,
    opacity: 0.7,
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    alignItems: 'flex-end',
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  minimizedContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default function FloatingChat({ visible, onClose, currentUser = 'You', roomId = 'default' }: FloatingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [userName, setUserName] = useState(currentUser);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const loadMessages = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(`${CHAT_STORAGE_KEY}_${roomId}`);
      if (stored) {
        const parsedMessages = JSON.parse(stored).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [roomId]);

  useEffect(() => {
    if (visible) {
      loadMessages();
    }
  }, [visible, loadMessages]);

  useEffect(() => {
    if (isMinimized) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isMinimized, slideAnim]);

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: visible ? 1 : 0.8,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, scaleAnim]);

  const saveMessages = useCallback(async (newMessages: ChatMessage[]) => {
    try {
      await AsyncStorage.setItem(`${CHAT_STORAGE_KEY}_${roomId}`, JSON.stringify(newMessages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }, [roomId]);

  const loadUserName = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_NAME_KEY);
      if (stored) {
        setUserName(stored);
      }
    } catch (error) {
      console.error('Error loading user name:', error);
    }
  }, []);

  const saveUserName = useCallback(async (name: string) => {
    try {
      await AsyncStorage.setItem(USER_NAME_KEY, name);
      setUserName(name);
    } catch (error) {
      console.error('Error saving user name:', error);
    }
  }, []);

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
        isCurrentUser: false
      };
      
      setMessages(prev => {
        const updated = [...prev, newMessage];
        saveMessages(updated);
        return updated;
      });
      
      if (isMinimized) {
        setUnreadCount(prev => prev + 1);
      }
    }, 1000 + Math.random() * 2000);
  }, [isMinimized, saveMessages]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleClose = useCallback(() => {
    setIsMinimized(false);
    setUnreadCount(0);
    onClose();
  }, [onClose]);

  const handleUserNameChange = useCallback(() => {
    Alert.prompt(
      'Change Name',
      'Enter your display name:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: (text) => {
            if (text && text.trim()) {
              saveUserName(text.trim());
            }
          }
        }
      ],
      'plain-text',
      userName
    );
  }, [userName, saveUserName]);

  const clearChat = useCallback(async () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setMessages([]);
            await AsyncStorage.removeItem(`${CHAT_STORAGE_KEY}_${roomId}`);
          }
        }
      ]
    );
  }, [roomId]);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: userName,
      timestamp: new Date(),
      isCurrentUser: true
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    await saveMessages(updatedMessages);
    setInputText('');

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Simulate response
    if (Math.random() > 0.3) {
      simulateIncomingMessage();
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [inputText, userName, messages, saveMessages, simulateIncomingMessage]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!visible && !isMinimized) return null;

  if (isMinimized) {
    return (
      <Animated.View
        style={[
          styles.minimizedContainer,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 100]
                })
              }
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setIsMinimized(false)}
        >
          <IconSymbol name="message.fill" size={24} color="white" />
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.dark ? '#333' : '#eee' }]}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Team Chat
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: theme.dark ? '#333' : '#f0f0f0' }]}
                onPress={handleUserNameChange}
              >
                <IconSymbol name="person.circle" size={20} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: theme.dark ? '#333' : '#f0f0f0' }]}
                onPress={clearChat}
              >
                <IconSymbol name="trash" size={20} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: theme.dark ? '#333' : '#f0f0f0' }]}
                onPress={handleMinimize}
              >
                <IconSymbol name="minus" size={20} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: theme.dark ? '#333' : '#f0f0f0' }]}
                onPress={handleClose}
              >
                <IconSymbol name="xmark" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="message" size={48} color={theme.colors.text} />
                <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
                  No messages yet.{'\n'}Start a conversation!
                </Text>
              </View>
            ) : (
              messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageItem,
                    message.isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      message.isCurrentUser
                        ? styles.currentUserBubble
                        : [styles.otherUserBubble, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.isCurrentUser
                          ? styles.currentUserText
                          : { color: theme.colors.text }
                      ]}
                    >
                      {message.text}
                    </Text>
                  </View>
                  <View style={styles.messageInfo}>
                    <Text style={[styles.messageSender, { color: theme.colors.text }]}>
                      {message.sender}
                    </Text>
                    <Text style={[styles.messageTime, { color: theme.colors.text }]}>
                      {formatTime(message.timestamp)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Input */}
          <View style={[styles.inputContainer, { borderTopColor: theme.dark ? '#333' : '#eee' }]}>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: theme.colors.text,
                  borderColor: theme.dark ? '#333' : '#ddd',
                  backgroundColor: theme.dark ? '#222' : '#fff'
                }
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={theme.dark ? '#666' : '#999'}
              multiline
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendMessage}
              disabled={!inputText.trim()}
            >
              <IconSymbol
                name="arrow.up"
                size={20}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
