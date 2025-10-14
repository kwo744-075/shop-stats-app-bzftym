
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@react-navigation/native';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  children?: React.ReactNode;
}

export default function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  style, 
  textStyle, 
  disabled = false,
  children 
}: ButtonProps) {
  const { colors, dark } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = {
      ...styles.button,
      opacity: disabled ? 0.6 : 1,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: '#ef4444',
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
        };
    }
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      ...styles.buttonText,
      fontWeight: '600' as const,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseTextStyle,
          color: 'white', // Always white on primary buttons for contrast
        };
      case 'secondary':
        return {
          ...baseTextStyle,
          color: colors.text, // Use theme text color for secondary buttons
        };
      case 'danger':
        return {
          ...baseTextStyle,
          color: 'white', // Always white on danger buttons for contrast
        };
      default:
        return {
          ...baseTextStyle,
          color: 'white',
        };
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {children || (
        <Text style={[getTextStyle(), textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
