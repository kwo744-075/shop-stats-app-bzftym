
import { useEffect, useRef, useCallback } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTO_UPDATE_KEY = 'auto_update_timestamp';
const UPDATE_CHECK_INTERVAL = 30000; // 30 seconds

interface AutoUpdateOptions {
  onUpdateAvailable?: () => void;
  onDataSync?: () => void;
  enabled?: boolean;
}

export function useAutoUpdate(options: AutoUpdateOptions = {}) {
  const { onUpdateAvailable, onDataSync, enabled = true } = options;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const checkForUpdates = useCallback(async () => {
    try {
      console.log('Checking for updates...');
      
      // Simulate checking for updates from other devices
      const lastUpdate = await AsyncStorage.getItem(AUTO_UPDATE_KEY);
      const currentTime = Date.now();
      
      if (lastUpdate) {
        const timeDiff = currentTime - parseInt(lastUpdate);
        
        // If data was updated recently (within 5 minutes), trigger sync
        if (timeDiff < 300000 && onDataSync) {
          console.log('Data sync triggered');
          onDataSync();
        }
      }
      
      // Store current check time
      await AsyncStorage.setItem(AUTO_UPDATE_KEY, currentTime.toString());
      
    } catch (error) {
      console.log('Auto-update check error:', error);
    }
  }, [onDataSync]);

  const triggerUpdate = async () => {
    try {
      const currentTime = Date.now();
      await AsyncStorage.setItem(AUTO_UPDATE_KEY, currentTime.toString());
      
      if (onUpdateAvailable) {
        onUpdateAvailable();
      }
      
      console.log('Update triggered for other devices');
    } catch (error) {
      console.log('Error triggering update:', error);
    }
  };

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App has come to the foreground, check for updates
      checkForUpdates();
    }
    appStateRef.current = nextAppState;
  }, [checkForUpdates]);

  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkForUpdates();

    // Set up periodic checks
    intervalRef.current = setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL);

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription?.remove();
    };
  }, [enabled, checkForUpdates, handleAppStateChange]);

  return {
    triggerUpdate,
    checkForUpdates,
  };
}
