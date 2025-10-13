
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_SHOPS_KEY = 'selected_shops_for_home';

export default function TabLayout() {
  const [navigationReady, setNavigationReady] = useState(false);

  // Initialize navigation state
  useEffect(() => {
    const initializeNavigation = async () => {
      try {
        // Ensure AsyncStorage is ready and preload any critical data
        await AsyncStorage.getItem(SELECTED_SHOPS_KEY);
        
        // Set navigation ready immediately - no artificial delays
        setNavigationReady(true);
        console.log('Navigation initialized successfully');
      } catch (error) {
        console.log('Navigation initialization error:', error);
        // Still set ready to prevent infinite loading
        setNavigationReady(true);
      }
    };

    initializeNavigation();
  }, []);

  // Define the tabs configuration
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'house.fill',
      label: 'Home',
    },
    {
      name: 'checkin',
      route: '/(tabs)/checkin',
      icon: 'checkmark.circle.fill',
      label: 'Check-In',
    },
    {
      name: 'rankings',
      route: '/(tabs)/rankings',
      icon: 'chart.bar.fill',
      label: 'Rankings',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person.fill',
      label: 'Profile',
    },
  ];

  // Show loading state until navigation is ready
  if (!navigationReady) {
    return null; // Or a loading component
  }

  // Use NativeTabs for iOS, custom FloatingTabBar for Android and Web
  if (Platform.OS === 'ios') {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="(home)">
          <Icon sf="house.fill" drawable="ic_home" />
          <Label>Home</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="checkin">
          <Icon sf="checkmark.circle.fill" drawable="ic_checkin" />
          <Label>Check-In</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="rankings">
          <Icon sf="chart.bar.fill" drawable="ic_rankings" />
          <Label>Rankings</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Icon sf="person.fill" drawable="ic_profile" />
          <Label>Profile</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  // For Android and Web, use Stack navigation with custom floating tab bar
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade', // Use fade animation for smoother transitions
          animationDuration: 150, // Faster animation
          gestureEnabled: false, // Disable gestures to prevent conflicts with tab bar
        }}
      >
        <Stack.Screen 
          name="(home)" 
          options={{
            // Ensure proper state management for home screen
            animationTypeForReplace: 'pop',
          }}
        />
        <Stack.Screen 
          name="checkin" 
          options={{
            // Ensure proper state management for check-in screen
            animationTypeForReplace: 'pop',
          }}
        />
        <Stack.Screen 
          name="rankings" 
          options={{
            // Ensure proper state management for rankings screen
            animationTypeForReplace: 'pop',
          }}
        />
        <Stack.Screen 
          name="profile" 
          options={{
            // Ensure proper state management for profile screen
            animationTypeForReplace: 'pop',
          }}
        />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
