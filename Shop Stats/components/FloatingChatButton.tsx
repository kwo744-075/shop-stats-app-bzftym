
import React, { useState, useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import FloatingChat from './FloatingChat';

interface FloatingChatButtonProps {
  currentUser?: string;
  roomId?: string;
}

export default function FloatingChatButton({
  currentUser = 'Anonymous',
  roomId = 'general',
}: FloatingChatButtonProps) {
  const theme = useTheme();
  const [chatVisible, setChatVisible] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChatVisible(true);
    setHasNewMessages(false);
  };

  const handleCloseChat = () => {
    setChatVisible(false);
  };

  return (
    <>
      {/* FIXED: Team Chat button positioned to the right of "Shop Summary WTD" text */}
      <View style={styles.fixedContainer}>
        <TouchableOpacity
          onPress={handlePress}
          style={[
            styles.teamChatButton,
            {
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
            },
          ]}
          activeOpacity={0.8}
        >
          <IconSymbol
            name="message.fill"
            size={18}
            color="white"
          />
          <Text style={styles.teamChatText}>Team Chat</Text>
          
          {hasNewMessages && (
            <View style={styles.notificationDot} />
          )}
        </TouchableOpacity>
      </View>

      <FloatingChat
        visible={chatVisible}
        onClose={handleCloseChat}
        currentUser={currentUser}
        roomId={roomId}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fixedContainer: {
    position: 'absolute',
    top: 200, // Positioned to align with "Shop Summary WTD" text
    right: 16,
    zIndex: 999,
  },
  teamChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, // Made longer
    paddingVertical: 10, // Made taller
    borderRadius: 24, // Adjusted for new size
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 120, // Ensure minimum width for "Team Chat" text
  },
  teamChatText: {
    color: 'white',
    fontSize: 14, // Slightly larger text
    fontWeight: '600',
    marginLeft: 8, // More space between icon and text
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: 'white',
  },
});
