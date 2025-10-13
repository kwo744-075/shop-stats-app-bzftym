
import { useState, useEffect, useCallback } from 'react';
import { MasterSetupData, MasterShop, District, MetricGoals } from '@/types/SetupData';
import { supabase } from '@/app/integrations/supabase/client';

export const useMasterSetup = () => {
  const [setupData, setSetupData] = useState<MasterSetupData>({
    shops: [],
    districts: [],
    metricGoals: undefined,
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load setup data from Supabase
  const loadSetupData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load shops
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .order('shop_number');

      if (shopsError) {
        throw shopsError;
      }

      // Load districts with their shops
      const { data: districtsData, error: districtsError } = await supabase
        .from('districts')
        .select(`
          *,
          district_shops (
            shop_id,
            shops (
              id,
              shop_number
            )
          )
        `)
        .order('name');

      if (districtsError) {
        throw districtsError;
      }

      // Load metric goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('metric_goals')
        .select('*')
        .limit(1)
        .single();

      if (goalsError && goalsError.code !== 'PGRST116') {
        console.warn('Error loading metric goals:', goalsError);
      }

      // Transform the data to match our types
      const shops: MasterShop[] = shopsData?.map(shop => ({
        id: shop.id,
        number: shop.shop_number,
        name: shop.shop_name,
        isActive: shop.is_active
      })) || [];

      const districts: District[] = districtsData?.map(district => ({
        id: district.id,
        name: district.name,
        shopIds: district.district_shops?.map((ds: any) => ds.shop_id) || [],
        isActive: district.is_active
      })) || [];

      const metricGoals: MetricGoals | undefined = goalsData ? {
        id: goalsData.id,
        cars: goalsData.cars || 0,
        sales: goalsData.sales || 0,
        big4: goalsData.big4 || 0,
        coolants: goalsData.coolants || 0,
        diffs: goalsData.diffs || 0,
        donations: goalsData.donations || 0,
        mobil1: goalsData.mobil1 || 0,
        staffing: goalsData.staffing || 0,
        temperature: goalsData.temperature || 'green'
      } : undefined;

      setSetupData({
        shops,
        districts,
        metricGoals,
        lastUpdated: new Date().toISOString()
      });

    } catch (err) {
      console.error('Error loading setup data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load setup data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSetupData();
  }, [loadSetupData]);

  // Add a new shop
  const addShop = useCallback(async (shop: Omit<MasterShop, 'id'>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('shops')
        .insert({
          shop_number: shop.number,
          shop_name: shop.name,
          is_active: shop.isActive
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Reload data to get the updated list
      await loadSetupData();
      
      console.log('Shop added successfully');
    } catch (err) {
      console.error('Error adding shop:', err);
      setError(err instanceof Error ? err.message : 'Failed to add shop');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSetupData]);

  // Update a shop
  const updateShop = useCallback(async (shopId: string, updatedShop: Partial<MasterShop>) => {
    try {
      setLoading(true);
      setError(null);

      const updateData: any = {};
      if (updatedShop.number !== undefined) updateData.shop_number = updatedShop.number;
      if (updatedShop.name !== undefined) updateData.shop_name = updatedShop.name;
      if (updatedShop.isActive !== undefined) updateData.is_active = updatedShop.isActive;
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('shops')
        .update(updateData)
        .eq('id', shopId);

      if (error) {
        throw error;
      }

      // Reload data to get the updated list
      await loadSetupData();
      
      console.log('Shop updated successfully');
    } catch (err) {
      console.error('Error updating shop:', err);
      setError(err instanceof Error ? err.message : 'Failed to update shop');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSetupData]);

  // Delete a shop
  const deleteShop = useCallback(async (shopId: string) => {
    try {
      setLoading(true);
      setError(null);

      // First check if shop is assigned to any district
      const { data: assignments, error: assignmentError } = await supabase
        .from('district_shops')
        .select('id')
        .eq('shop_id', shopId);

      if (assignmentError) {
        throw assignmentError;
      }

      if (assignments && assignments.length > 0) {
        throw new Error('Cannot delete shop that is assigned to a district');
      }

      // Delete the shop
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', shopId);

      if (error) {
        throw error;
      }

      // Reload data to get the updated list
      await loadSetupData();
      
      console.log('Shop deleted successfully');
    } catch (err) {
      console.error('Error deleting shop:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete shop');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSetupData]);

  // Add a new district
  const addDistrict = useCallback(async (district: Omit<District, 'id'>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('districts')
        .insert({
          name: district.name,
          is_active: district.isActive
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Add shop assignments if any
      if (district.shopIds.length > 0) {
        const assignments = district.shopIds.map(shopId => ({
          district_id: data.id,
          shop_id: shopId
        }));

        const { error: assignmentError } = await supabase
          .from('district_shops')
          .insert(assignments);

        if (assignmentError) {
          throw assignmentError;
        }
      }

      // Reload data to get the updated list
      await loadSetupData();
      
      console.log('District added successfully');
    } catch (err) {
      console.error('Error adding district:', err);
      setError(err instanceof Error ? err.message : 'Failed to add district');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSetupData]);

  // Update a district
  const updateDistrict = useCallback(async (districtId: string, updatedDistrict: Partial<District>) => {
    try {
      setLoading(true);
      setError(null);

      // Update district info
      const updateData: any = {};
      if (updatedDistrict.name !== undefined) updateData.name = updatedDistrict.name;
      if (updatedDistrict.isActive !== undefined) updateData.is_active = updatedDistrict.isActive;
      updateData.updated_at = new Date().toISOString();

      const { error: districtError } = await supabase
        .from('districts')
        .update(updateData)
        .eq('id', districtId);

      if (districtError) {
        throw districtError;
      }

      // Update shop assignments if provided
      if (updatedDistrict.shopIds !== undefined) {
        // Remove existing assignments
        const { error: deleteError } = await supabase
          .from('district_shops')
          .delete()
          .eq('district_id', districtId);

        if (deleteError) {
          throw deleteError;
        }

        // Add new assignments
        if (updatedDistrict.shopIds.length > 0) {
          const assignments = updatedDistrict.shopIds.map(shopId => ({
            district_id: districtId,
            shop_id: shopId
          }));

          const { error: insertError } = await supabase
            .from('district_shops')
            .insert(assignments);

          if (insertError) {
            throw insertError;
          }
        }
      }

      // Reload data to get the updated list
      await loadSetupData();
      
      console.log('District updated successfully');
    } catch (err) {
      console.error('Error updating district:', err);
      setError(err instanceof Error ? err.message : 'Failed to update district');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSetupData]);

  // Delete a district
  const deleteDistrict = useCallback(async (districtId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Delete the district (cascade will handle district_shops)
      const { error } = await supabase
        .from('districts')
        .delete()
        .eq('id', districtId);

      if (error) {
        throw error;
      }

      // Reload data to get the updated list
      await loadSetupData();
      
      console.log('District deleted successfully');
    } catch (err) {
      console.error('Error deleting district:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete district');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSetupData]);

  // Get shops not assigned to any district
  const getUnassignedShops = useCallback(() => {
    const assignedShopIds = new Set();
    setupData.districts.forEach(district => {
      district.shopIds.forEach(shopId => assignedShopIds.add(shopId));
    });

    return setupData.shops.filter(shop => !assignedShopIds.has(shop.id));
  }, [setupData]);

  // Get shop by ID
  const getShopById = useCallback((shopId: string) => {
    return setupData.shops.find(shop => shop.id === shopId);
  }, [setupData.shops]);

  // Get shop by number
  const getShopByNumber = useCallback((shopNumber: number) => {
    return setupData.shops.find(shop => shop.number === shopNumber);
  }, [setupData.shops]);

  // Get district by ID
  const getDistrictById = useCallback((districtId: string) => {
    return setupData.districts.find(district => district.id === districtId);
  }, [setupData.districts]);

  // Update metric goals
  const updateMetricGoals = useCallback(async (goals: Omit<MetricGoals, 'id'>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('metric_goals')
        .upsert({
          cars: goals.cars,
          sales: goals.sales,
          big4: goals.big4,
          coolants: goals.coolants,
          diffs: goals.diffs,
          donations: goals.donations,
          mobil1: goals.mobil1,
          staffing: goals.staffing,
          temperature: goals.temperature,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Reload data to get the updated goals
      await loadSetupData();
      
      console.log('Metric goals updated successfully');
    } catch (err) {
      console.error('Error updating metric goals:', err);
      setError(err instanceof Error ? err.message : 'Failed to update metric goals');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSetupData]);

  return {
    setupData,
    loading,
    error,
    loadSetupData,
    addShop,
    updateShop,
    deleteShop,
    addDistrict,
    updateDistrict,
    deleteDistrict,
    getUnassignedShops,
    getShopById,
    getShopByNumber,
    getDistrictById,
    updateMetricGoals
  };
};
