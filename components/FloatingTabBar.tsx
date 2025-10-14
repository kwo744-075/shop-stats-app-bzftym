
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { BlurView } from 'expo-blur';
import { useTheme } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

export default function FloatingTabBar({
  tabs,
  containerWidth = 240,
  borderRadius = 25,
  bottomMargin
}: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const animatedValue = useSharedValue(0);

  // Improved and more reliable active tab detection
  const activeTabIndex = React.useMemo(() => {
    console.log('FloatingTabBar: Current pathname:', pathname);
    
    // Simple route matching - check each tab route
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      
      // Handle home route (special case)
      if (tab.name === '(home)') {
        if (pathname === '/' || pathname.includes('/(home)') || pathname === '/(tabs)/(home)/' || pathname === '/(tabs)/(home)') {
          console.log('FloatingTabBar: Home route matched at index', i);
          return i;
        }
      }
      
      // Handle other routes - check if pathname contains the tab name
      if (pathname.includes(`/${tab.name}`) || pathname.includes(`/(tabs)/${tab.name}`)) {
        console.log('FloatingTabBar: Route matched:', tab.name, 'at index', i);
        return i;
      }
      
      // Exact route match
      if (pathname === tab.route) {
        console.log('FloatingTabBar: Exact route matched:', tab.route, 'at index', i);
        return i;
      }
    }
    
    // Default to first tab if no match found
    console.log('FloatingTabBar: No match found, defaulting to home (index 0)');
    return 0;
  }, [pathname, tabs]);

  React.useEffect(() => {
    console.log('FloatingTabBar: Setting active tab index to:', activeTabIndex);
    animatedValue.value = withSpring(activeTabIndex, {
      damping: 20,
      stiffness: 120,
      mass: 1,
    });
  }, [activeTabIndex, animatedValue]);

  const handleTabPress = React.useCallback((route: string, index: number) => {
    console.log(`FloatingTabBar: Tab pressed: ${route} (index: ${index})`);
    
    // Prevent navigation if already on the same tab
    if (activeTabIndex === index) {
      console.log('FloatingTabBar: Already on this tab, skipping navigation');
      return;
    }
    
    try {
      // Use replace for navigation to ensure proper state management
      if (route.includes('(home)')) {
        console.log('FloatingTabBar: Navigating to home');
        router.replace('/(tabs)/(home)/');
      } else {
        console.log('FloatingTabBar: Navigating to', route);
        router.replace(route);
      }
    } catch (error) {
      console.error('FloatingTabBar: Navigation error:', error);
      // Fallback: try push instead of replace
      try {
        if (route.includes('(home)')) {
          router.push('/(tabs)/(home)/');
        } else {
          router.push(route);
        }
      } catch (fallbackError) {
        console.error('FloatingTabBar: Fallback navigation also failed:', fallbackError);
      }
    }
  }, [router, activeTabIndex]);

  const indicatorStyle = useAnimatedStyle(() => {
    if (tabs.length === 0) return {};
    
    const tabWidth = (containerWidth - 16) / tabs.length;
    const translateX = interpolate(
      animatedValue.value,
      [0, tabs.length - 1],
      [0, tabWidth * (tabs.length - 1)]
    );
    
    return {
      transform: [{ translateX }],
    };
  });

  // Dynamic styles based on theme
  const dynamicStyles = {
    blurContainer: {
      ...styles.blurContainer,
      ...Platform.select({
        ios: {
          backgroundColor: theme.dark
            ? 'rgba(28, 28, 30, 0.8)'
            : 'rgba(255, 255, 255, 0.8)',
        },
        android: {
          backgroundColor: theme.dark
            ? 'rgba(28, 28, 30, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          elevation: 8,
        },
        web: {
          backgroundColor: theme.dark
            ? 'rgba(28, 28, 30, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: theme.dark
            ? '0 8px 32px rgba(0, 0, 0, 0.4)'
            : '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
      }),
    },
    background: {
      ...styles.background,
      backgroundColor: theme.dark
        ? (Platform.OS === 'ios' ? 'transparent' : 'rgba(28, 28, 30, 0.1)')
        : (Platform.OS === 'ios' ? 'transparent' : 'rgba(255, 255, 255, 0.1)'),
    },
    indicator: {
      ...styles.indicator,
      backgroundColor: theme.dark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.04)',
      width: tabs.length > 0 ? `${(100 / tabs.length) - 3}%` : '30%',
    },
  };

  if (tabs.length === 0) {
    console.log('FloatingTabBar: No tabs provided');
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']} pointerEvents="box-none">
      <View style={[
        styles.container,
        {
          width: containerWidth,
          marginBottom: bottomMargin ?? (Platform.OS === 'ios' ? 10 : 20)
        }
      ]} pointerEvents="box-none">
        <BlurView
          intensity={Platform.OS === 'web' ? 0 : 80}
          style={[dynamicStyles.blurContainer, { borderRadius }]}
        >
          <View style={dynamicStyles.background} pointerEvents="none" />
          <Animated.View style={[dynamicStyles.indicator, indicatorStyle]} pointerEvents="none" />
          <View style={styles.tabsContainer}>
            {tabs.map((tab, index) => {
              const isActive = activeTabIndex === index;

              return (
                <TouchableOpacity
                  key={`${tab.name}-${index}`}
                  style={styles.tab}
                  onPress={() => handleTabPress(tab.route, index)}
                  activeOpacity={0.6}
                  hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                  accessible={true}
                  accessibilityLabel={`${tab.label} tab`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <View style={styles.tabContent} pointerEvents="none">
                    <IconSymbol
                      name={tab.icon}
                      size={24}
                      color={isActive ? theme.colors.primary : (theme.dark ? '#98989D' : '#8E8E93')}
                    />
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: theme.dark ? '#98989D' : '#8E8E93' },
                        isActive && { color: theme.colors.primary, fontWeight: '600' },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    elevation: 1000,
  },
  container: {
    marginHorizontal: 20,
    alignSelf: 'center',
  },
  blurContainer: {
    overflow: 'hidden',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  indicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    bottom: 8,
    borderRadius: 17,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    minHeight: 44,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
});
