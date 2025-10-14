
import { useState, useEffect, useCallback } from 'react';
import { DistrictHierarchy, Shop } from '@/types/HierarchyData';
import { supabase } from '@/app/integrations/supabase/client';

export const useHierarchyData = () => {
  const [hierarchy, setHierarchy] = useState<DistrictHierarchy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load hierarchy data from Supabase
  const loadHierarchyData = useCallback(async () => {
    try {
      console.log('useHierarchyData: Loading hierarchy data...');
      setLoading(true);
      setError(null);

      // Get hierarchy settings
      const { data: settings, error: settingsError } = await supabase
        .from('hierarchy_settings')
        .select('district_manager_name')
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error loading hierarchy settings:', settingsError);
      }

      // Get all active shops
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .eq('is_active', true)
        .order('shop_number');

      if (shopsError) {
        throw shopsError;
      }

      // Transform shops data
      const shops: Shop[] = shopsData?.map(shop => ({
        id: shop.id,
        name: shop.shop_name,
        number: shop.shop_number,
        isActive: shop.is_active
      })) || [];

      const hierarchyData = {
        districtManagerName: settings?.district_manager_name || 'District Manager',
        districtId: 'default', // We'll use a default district ID for now
        shops,
        lastUpdated: new Date().toISOString()
      };
      
      console.log('useHierarchyData: Loaded hierarchy data:', hierarchyData);
      setHierarchy(hierarchyData);

    } catch (err) {
      console.error('Error loading hierarchy data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load hierarchy data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHierarchyData();
  }, [loadHierarchyData]);

  // Update district manager name
  const updateDistrictManagerName = useCallback(async (name: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('hierarchy_settings')
        .upsert({
          district_manager_name: name,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // Update local state
      setHierarchy(prev => prev ? {
        ...prev,
        districtManagerName: name,
        lastUpdated: new Date().toISOString()
      } : null);

      console.log('District manager name updated successfully');
    } catch (err) {
      console.error('Error updating district manager name:', err);
      setError(err instanceof Error ? err.message : 'Failed to update district manager name');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update shop name
  const updateShopName = useCallback(async (shopId: string, name: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('shops')
        .update({
          shop_name: name,
          updated_at: new Date().toISOString()
        })
        .eq('id', shopId);

      if (error) {
        throw error;
      }

      // Update local state
      setHierarchy(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          shops: prev.shops.map(shop => 
            shop.id === shopId ? { ...shop, name } : shop
          ),
          lastUpdated: new Date().toISOString()
        };
      });

      console.log('Shop name updated successfully');
    } catch (err) {
      console.error('Error updating shop name:', err);
      setError(err instanceof Error ? err.message : 'Failed to update shop name');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle shop active status
  const toggleShopActive = useCallback(async (shopId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get current shop status
      const currentShop = hierarchy?.shops.find(shop => shop.id === shopId);
      if (!currentShop) {
        throw new Error('Shop not found');
      }

      const newActiveStatus = !currentShop.isActive;

      const { error } = await supabase
        .from('shops')
        .update({
          is_active: newActiveStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', shopId);

      if (error) {
        throw error;
      }

      // Update local state
      setHierarchy(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          shops: prev.shops.map(shop => 
            shop.id === shopId ? { ...shop, isActive: newActiveStatus } : shop
          ),
          lastUpdated: new Date().toISOString()
        };
      });

      console.log('Shop status toggled successfully');
    } catch (err) {
      console.error('Error toggling shop status:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle shop status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [hierarchy]);

  // Reset to defaults (this will reset shop names to "Name Here")
  const resetToDefaults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Reset all shop names to "Name Here"
      const { error } = await supabase
        .from('shops')
        .update({
          shop_name: 'Name Here',
          updated_at: new Date().toISOString()
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all shops

      if (error) {
        throw error;
      }

      // Reload hierarchy data
      await loadHierarchyData();

      console.log('Reset to defaults completed');
    } catch (err) {
      console.error('Error resetting to defaults:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset to defaults');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadHierarchyData]);

  // Get shop by ID
  const getShopById = useCallback((shopId: string) => {
    return hierarchy?.shops.find(shop => shop.id === shopId);
  }, [hierarchy]);

  // Get shop by number
  const getShopByNumber = useCallback((shopNumber: number) => {
    return hierarchy?.shops.find(shop => shop.number === shopNumber);
  }, [hierarchy]);

  // Refresh hierarchy data
  const refreshHierarchy = useCallback(async () => {
    await loadHierarchyData();
  }, [loadHierarchyData]);

  return {
    hierarchy,
    loading,
    error,
    loadHierarchyData,
    refreshHierarchy,
    updateDistrictManagerName,
    updateShopName,
    toggleShopActive,
    resetToDefaults,
    getShopById,
    getShopByNumber
  };
};
