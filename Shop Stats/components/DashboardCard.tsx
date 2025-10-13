
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { GlassView } from 'expo-glass-effect';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
  compact?: boolean;
}

export default function DashboardCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = '#3b82f6',
  compact = false 
}: DashboardCardProps) {
  const theme = useTheme();

  return (
    <GlassView 
      style={[
        compact ? styles.compactCard : styles.card,
        { backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }
      ]} 
      glassEffectStyle="regular"
    >
      <View style={styles.header}>
        {icon && (
          <IconSymbol 
            name={icon as any} 
            size={compact ? 20 : 24} 
            color={color} 
          />
        )}
        <Text style={[
          compact ? styles.compactTitle : styles.title, 
          { color: theme.colors.text }
        ]}>
          {title}
        </Text>
      </View>
      
      <Text style={[
        compact ? styles.compactValue : styles.value, 
        { color: theme.colors.text }
      ]}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      
      {subtitle && (
        <Text style={[
          compact ? styles.compactSubtitle : styles.subtitle, 
          { color: theme.dark ? '#98989D' : '#666' }
        ]}>
          {subtitle}
        </Text>
      )}
    </GlassView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    minWidth: 160,
    flex: 1,
    minHeight: 100,
  },
  compactCard: {
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    flex: 1,
    minHeight: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  compactTitle: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  compactValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  compactSubtitle: {
    fontSize: 10,
    lineHeight: 14,
  },
});
