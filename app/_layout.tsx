
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import Button from "@/components/button";
import ErrorBoundary from "@/components/ErrorBoundary";
import "react-native-reanimated";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import { SystemBars } from "react-native-edge-to-edge";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { useNetworkState } from "expo-network";
import * as Notifications from 'expo-notifications';
import { NavigationProvider } from "@/contexts/NavigationContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { WidgetProvider } from "@/contexts/WidgetContext";
import LoadingScreen from "@/components/LoadingScreen";
import { useColorScheme, Alert } from "react-native";
import { migrateDataToSupabase, promptDataMigration } from "@/utils/dataMigration";
import { initializeCommunicationService } from "@/utils/communicationService";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [migrationChecked, setMigrationChecked] = useState(false);

  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    SpaceMonoBold: require("../assets/fonts/SpaceMono-Bold.ttf"),
    SpaceMonoItalic: require("../assets/fonts/SpaceMono-Italic.ttf"),
    SpaceMonoBoldItalic: require("../assets/fonts/SpaceMono-BoldItalic.ttf"),
  });

  // Check for data migration on app start
  useEffect(() => {
    const checkMigration = async () => {
      try {
        // Only check migration if we have network connectivity
        if (networkState.isConnected) {
          const shouldMigrate = await promptDataMigration();
          
          if (shouldMigrate) {
            const result = await migrateDataToSupabase();
            
            Alert.alert(
              result.success ? 'Migration Successful' : 'Migration Failed',
              result.message,
              [{ text: 'OK' }]
            );
          }
        }
      } catch (err) {
        console.error('Error during migration check:', err);
      } finally {
        setMigrationChecked(true);
      }
    };

    if (loaded && !migrationChecked) {
      checkMigration();
    }
  }, [loaded, migrationChecked, networkState.isConnected]);

  // Initialize communication service
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    if (loaded && migrationChecked && networkState.isConnected) {
      cleanup = initializeCommunicationService();
    }
    
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [loaded, migrationChecked, networkState.isConnected]);

  // Show network status alerts
  useEffect(() => {
    if (networkState.isConnected === false) {
      Alert.alert(
        'No Internet Connection',
        'Some features may not work properly without an internet connection. Please check your network settings.',
        [{ text: 'OK' }]
      );
    }
  }, [networkState.isConnected]);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && migrationChecked) {
      SplashScreen.hideAsync();
    }
  }, [loaded, migrationChecked]);

  if (!loaded || !migrationChecked) {
    return <LoadingScreen />;
  }

  const theme: Theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colorScheme === 'dark' ? '#000000' : '#ffffff',
      text: colorScheme === 'dark' ? '#ffffff' : '#000000',
      card: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5',
      border: colorScheme === 'dark' ? '#333333' : '#e0e0e0',
      primary: '#007AFF',
    },
  };

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={theme}>
          <NavigationProvider>
            <ChatProvider>
              <WidgetProvider>
                <SystemBars style="auto" />
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                  <Stack.Screen name="transparent-modal" options={{ 
                    presentation: "transparentModal",
                    animation: "fade",
                    headerShown: false 
                  }} />
                  <Stack.Screen name="formsheet" options={{ 
                    presentation: "formSheet",
                    headerShown: false 
                  }} />
                </Stack>
                <StatusBar style="auto" />
              </WidgetProvider>
            </ChatProvider>
          </NavigationProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
