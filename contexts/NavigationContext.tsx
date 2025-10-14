
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_SHOPS_KEY = 'selected_shops_for_home';

interface NavigationContextType {
  selectedShopIds: string[];
  setSelectedShopIds: (shopIds: string[]) => Promise<void>;
  isLoading: boolean;
  refreshShopSelection: () => Promise<void>;
  saveShopSelection: (shopIds: string[]) => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [selectedShopIds, setSelectedShopIdsState] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);
  const isMounted = useRef(true);

  // Load selected shops from storage
  const loadSelectedShops = useCallback(async () => {
    if (!isMounted.current) return;
    
    try {
      console.log('NavigationContext: Loading selected shops...');
      const stored = await AsyncStorage.getItem(SELECTED_SHOPS_KEY);
      
      if (!isMounted.current) return;
      
      if (stored) {
        const shopIds = JSON.parse(stored);
        setSelectedShopIdsState(shopIds);
        console.log('NavigationContext: Loaded selected shops:', shopIds);
      } else {
        setSelectedShopIdsState([]);
        console.log('NavigationContext: No shops selected by default');
      }
    } catch (error) {
      console.log('NavigationContext: Error loading selected shops:', error);
      if (isMounted.current) {
        setSelectedShopIdsState([]);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        hasInitialized.current = true;
      }
    }
  }, []);

  // Save selected shops to storage
  const saveShopSelection = useCallback(async (shopIds: string[]) => {
    if (!isMounted.current) return;
    
    try {
      await AsyncStorage.setItem(SELECTED_SHOPS_KEY, JSON.stringify(shopIds));
      
      if (isMounted.current) {
        setSelectedShopIdsState(shopIds);
        console.log('NavigationContext: Saved selected shops:', shopIds);
      }
    } catch (error) {
      console.log('NavigationContext: Error saving selected shops:', error);
    }
  }, []);

  // Refresh shop selection from storage
  const refreshShopSelection = useCallback(async () => {
    if (!isMounted.current) return;
    
    setIsLoading(true);
    await loadSelectedShops();
  }, [loadSelectedShops]);

  // Set selected shop IDs with automatic saving
  const setSelectedShopIds = useCallback(async (shopIds: string[]) => {
    await saveShopSelection(shopIds);
  }, [saveShopSelection]);

  // Initialize on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      loadSelectedShops();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [loadSelectedShops]);

  const value: NavigationContextType = {
    selectedShopIds,
    setSelectedShopIds,
    isLoading,
    refreshShopSelection,
    saveShopSelection,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationContext() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigationContext must be used within a NavigationProvider');
  }
  return context;
}
