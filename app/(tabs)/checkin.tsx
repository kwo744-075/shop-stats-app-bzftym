
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import { useNavigationContext } from '@/contexts/NavigationContext';
import { IconSymbol } from '@/components/IconSymbol';
import { GlassView } from 'expo-glass-effect';
import CheckInForm from '@/components/CheckInForm';

export default function CheckInScreen() {
  const theme = useTheme();
  const { selectedShopIds } = useNavigationContext();

  // Show CheckInForm when exactly one shop is selected
  if (selectedShopIds.length === 1) {
    return <CheckInForm />;
  }

  const getMessage = () => {
    if (selectedShopIds.length === 0) {
      return {
        icon: 'exclamationmark.triangle',
        title: 'No Shop Selected',
        description: 'Please select a shop from the Profile tab to start checking in.',
      };
    } else {
      return {
        icon: 'person.2.fill',
        title: 'Multiple Shops Selected',
        description: 'Check-in forms are available when you select a single shop. Please select only one shop from the Profile tab to access the check-in form.',
      };
    }
  };

  const message = getMessage();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <GlassView style={[
          styles.messageCard,
          Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
        ]} glassEffectStyle="regular">
          <IconSymbol 
            name={message.icon as any} 
            size={64} 
            color={theme.dark ? '#666' : '#999'} 
          />
          <Text style={[styles.messageTitle, { color: theme.colors.text }]}>
            {message.title}
          </Text>
          <Text style={[styles.messageDescription, { color: theme.dark ? '#98989D' : '#666' }]}>
            {message.description}
          </Text>
          
          {selectedShopIds.length > 0 && (
            <View style={styles.shopInfo}>
              <Text style={[styles.shopInfoTitle, { color: theme.colors.text }]}>
                Currently Selected:
              </Text>
              <Text style={[styles.shopInfoText, { color: theme.colors.primary }]}>
                {`${selectedShopIds.length} shops (${selectedShopIds.join(', ')})`}
              </Text>
            </View>
          )}

          <View style={styles.instructionCard}>
            <IconSymbol name="info.circle" size={20} color={theme.colors.primary} />
            <Text style={[styles.instructionText, { color: theme.dark ? '#98989D' : '#666' }]}>
              Select exactly one shop from the Profile tab to access the check-in form with weekly summary and auto-populated data.
            </Text>
          </View>
        </GlassView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    maxWidth: 400,
    width: '100%',
  },
  messageTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  messageDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  shopInfo: {
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  shopInfoTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  shopInfoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
