
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  useColorScheme,
  ViewStyle,
} from "react-native";
import { appleBlue, zincColors } from "@/constants/Colors";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  children,
  style,
  textStyle,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    };

    // Size styles
    switch (size) {
      case "sm":
        baseStyle.paddingHorizontal = 12;
        baseStyle.paddingVertical = 8;
        baseStyle.minHeight = 32;
        break;
      case "lg":
        baseStyle.paddingHorizontal = 24;
        baseStyle.paddingVertical = 16;
        baseStyle.minHeight = 56;
        break;
      default: // md
        baseStyle.paddingHorizontal = 16;
        baseStyle.paddingVertical = 12;
        baseStyle.minHeight = 44;
        break;
    }

    // Variant styles
    switch (variant) {
      case "secondary":
        baseStyle.backgroundColor = isDark ? zincColors[700] : zincColors[200];
        break;
      case "outline":
        baseStyle.backgroundColor = "transparent";
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = isDark ? zincColors[600] : zincColors[300];
        break;
      case "ghost":
        baseStyle.backgroundColor = "transparent";
        break;
      default: // primary
        baseStyle.backgroundColor = appleBlue;
        break;
    }

    // Disabled state
    if (disabled || loading) {
      baseStyle.opacity = 0.5;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: "600",
    };

    // Size styles
    switch (size) {
      case "sm":
        baseTextStyle.fontSize = 14;
        break;
      case "lg":
        baseTextStyle.fontSize = 18;
        break;
      default: // md
        baseTextStyle.fontSize = 16;
        break;
    }

    // Variant styles
    switch (variant) {
      case "secondary":
        baseTextStyle.color = isDark ? zincColors[100] : zincColors[900];
        break;
      case "outline":
      case "ghost":
        baseTextStyle.color = isDark ? zincColors[100] : zincColors[900];
        break;
      default: // primary
        baseTextStyle.color = "white";
        break;
    }

    return baseTextStyle;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "white" : appleBlue}
          style={{ marginRight: 8 }}
        />
      )}
      <Text style={[getTextStyle(), textStyle]}>{children}</Text>
    </Pressable>
  );
}
