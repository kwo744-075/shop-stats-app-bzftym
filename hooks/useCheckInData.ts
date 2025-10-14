
import { useState, useEffect, useCallback } from 'react';
import { CheckInItem, ShopCheckIn, DailyData, WeeklyData, ShopDayData, ShopSubmissionStatus } from '@/types/CheckInData';
import { supabase } from '@/app/integrations/supabase/client';

export const useCheckInData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
  const [lastResetDate, setLastResetDate] = useState<string | null>(null);

  // Load selected shops and last reset date
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get hierarchy settings
      const { data: settings, error: settingsError } = await supabase
        .from('hierarchy_settings')
        .select('last_reset_date')
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error loading settings:', settingsError);
      } else if (settings) {
        setLastResetDate(settings.last_reset_date);
      }

      // Get all active shops for selected shops (default to all)
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id')
        .eq('is_active', true);

      if (shopsError) {
        console.error('Error loading shops:', shopsError);
      } else if (shops) {
        setSelectedShopIds(shops.map(shop => shop.id));
      }
    } catch (err) {
      console.error('Error in loadInitialData:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Submit check-in data
  const submitCheckIn = useCallback(async (shopId: string, timeSlot: string, data: CheckInItem) => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('check_ins')
        .upsert({
          shop_id: shopId,
          check_in_date: today,
          time_slot: timeSlot,
          cars: data.cars,
          sales: data.sales,
          big4: data.big4,
          coolants: data.coolant,
          diffs: data.diffs,
          donations: data.donations,
          mobil1: data.mobil1,
          staffing: data.staffing,
          temperature: data.temperature,
          is_submitted: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'shop_id,check_in_date,time_slot'
        });

      if (error) {
        throw error;
      }

      console.log('Check-in submitted successfully');
    } catch (err) {
      console.error('Error submitting check-in:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit check-in');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get shop day data
  const getShopDayData = useCallback(async (shopId: string, date: string): Promise<ShopDayData> => {
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('shop_id', shopId)
        .eq('check_in_date', date);

      if (error) {
        throw error;
      }

      const shopDayData: ShopDayData = {};
      
      if (data) {
        data.forEach(checkIn => {
          shopDayData[checkIn.time_slot] = {
            cars: checkIn.cars,
            sales: checkIn.sales,
            big4: checkIn.big4,
            coolant: checkIn.coolants,
            diffs: checkIn.diffs,
            donations: checkIn.donations,
            mobil1: checkIn.mobil1,
            staffing: checkIn.staffing,
            temperature: checkIn.temperature as 'red' | 'yellow' | 'green'
          };
        });
      }

      return shopDayData;
    } catch (err) {
      console.error('Error getting shop day data:', err);
      return {};
    }
  }, []);

  // Get shop submission status
  const getShopSubmissionStatus = useCallback(async (shopId: string, date: string): Promise<ShopSubmissionStatus> => {
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select('time_slot, is_submitted')
        .eq('shop_id', shopId)
        .eq('check_in_date', date);

      if (error) {
        throw error;
      }

      const status: ShopSubmissionStatus = {};
      
      if (data) {
        data.forEach(checkIn => {
          status[checkIn.time_slot] = checkIn.is_submitted;
        });
      }

      return status;
    } catch (err) {
      console.error('Error getting submission status:', err);
      return {};
    }
  }, []);

  // Get weekly shop summary
  const getWeeklyShopSummary = useCallback(async (shopId: string, include5to8Only: boolean = false) => {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

      const startDate = startOfWeek.toISOString().split('T')[0];
      const endDate = endOfWeek.toISOString().split('T')[0];

      let query = supabase
        .from('check_ins')
        .select('*')
        .eq('shop_id', shopId)
        .gte('check_in_date', startDate)
        .lte('check_in_date', endDate);

      if (include5to8Only) {
        query = query.in('time_slot', ['5pm', '8pm']);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Aggregate the data
      const summary = {
        cars: 0,
        sales: 0,
        big4: 0,
        coolants: 0,
        diffs: 0,
        donations: 0,
        mobil1: 0,
        staffing: 0,
        totalCheckIns: data?.length || 0
      };

      if (data) {
        data.forEach(checkIn => {
          summary.cars += checkIn.cars;
          summary.sales += checkIn.sales;
          summary.big4 += checkIn.big4;
          summary.coolants += checkIn.coolants;
          summary.diffs += checkIn.diffs;
          summary.donations += checkIn.donations;
          summary.mobil1 += checkIn.mobil1;
          summary.staffing += checkIn.staffing;
        });
      }

      return summary;
    } catch (err) {
      console.error('Error getting weekly summary:', err);
      return {
        cars: 0,
        sales: 0,
        big4: 0,
        coolants: 0,
        diffs: 0,
        donations: 0,
        mobil1: 0,
        staffing: 0,
        totalCheckIns: 0
      };
    }
  }, []);

  // Get shop aggregated data
  const getShopAggregatedData = useCallback(async (shopId: string, include5to8Only: boolean = false) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      let query = supabase
        .from('check_ins')
        .select('*')
        .eq('shop_id', shopId)
        .eq('check_in_date', today);

      if (include5to8Only) {
        query = query.in('time_slot', ['5pm', '8pm']);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Aggregate the data
      const aggregated = {
        cars: 0,
        sales: 0,
        big4: 0,
        coolants: 0,
        diffs: 0,
        donations: 0,
        mobil1: 0,
        staffing: 0
      };

      if (data) {
        data.forEach(checkIn => {
          aggregated.cars += checkIn.cars;
          aggregated.sales += checkIn.sales;
          aggregated.big4 += checkIn.big4;
          aggregated.coolants += checkIn.coolants;
          aggregated.diffs += checkIn.diffs;
          aggregated.donations += checkIn.donations;
          aggregated.mobil1 += checkIn.mobil1;
          aggregated.staffing += checkIn.staffing;
        });
      }

      return aggregated;
    } catch (err) {
      console.error('Error getting shop aggregated data:', err);
      return {
        cars: 0,
        sales: 0,
        big4: 0,
        coolants: 0,
        diffs: 0,
        donations: 0,
        mobil1: 0,
        staffing: 0
      };
    }
  }, []);

  // Get district aggregated data
  const getDistrictAggregatedData = useCallback(async (districtId: string, include5to8Only: boolean = false) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get shops in the district
      const { data: districtShops, error: districtError } = await supabase
        .from('district_shops')
        .select('shop_id')
        .eq('district_id', districtId);

      if (districtError) {
        throw districtError;
      }

      if (!districtShops || districtShops.length === 0) {
        return {
          cars: 0,
          sales: 0,
          big4: 0,
          coolants: 0,
          diffs: 0,
          donations: 0,
          mobil1: 0,
          staffing: 0
        };
      }

      const shopIds = districtShops.map(ds => ds.shop_id);

      let query = supabase
        .from('check_ins')
        .select('*')
        .in('shop_id', shopIds)
        .eq('check_in_date', today);

      if (include5to8Only) {
        query = query.in('time_slot', ['5pm', '8pm']);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Aggregate the data
      const aggregated = {
        cars: 0,
        sales: 0,
        big4: 0,
        coolants: 0,
        diffs: 0,
        donations: 0,
        mobil1: 0,
        staffing: 0
      };

      if (data) {
        data.forEach(checkIn => {
          aggregated.cars += checkIn.cars;
          aggregated.sales += checkIn.sales;
          aggregated.big4 += checkIn.big4;
          aggregated.coolants += checkIn.coolants;
          aggregated.diffs += checkIn.diffs;
          aggregated.donations += checkIn.donations;
          aggregated.mobil1 += checkIn.mobil1;
          aggregated.staffing += checkIn.staffing;
        });
      }

      return aggregated;
    } catch (err) {
      console.error('Error getting district aggregated data:', err);
      return {
        cars: 0,
        sales: 0,
        big4: 0,
        coolants: 0,
        diffs: 0,
        donations: 0,
        mobil1: 0,
        staffing: 0
      };
    }
  }, []);

  // Check and perform daily reset
  const checkAndPerformDailyReset = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: settings, error } = await supabase
        .from('hierarchy_settings')
        .select('last_reset_date')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking reset date:', error);
        return;
      }

      const lastReset = settings?.last_reset_date;
      
      if (!lastReset || lastReset !== today) {
        // Update the reset date
        await supabase
          .from('hierarchy_settings')
          .upsert({
            last_reset_date: today,
            updated_at: new Date().toISOString()
          });

        setLastResetDate(today);
        console.log('Daily reset performed');
      }
    } catch (err) {
      console.error('Error performing daily reset:', err);
    }
  }, []);

  // Generate test check-ins
  const generateTestCheckIns = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all active shops
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id')
        .eq('is_active', true);

      if (shopsError) {
        throw shopsError;
      }

      if (!shops) return;

      const today = new Date().toISOString().split('T')[0];
      const timeSlots = ['12pm', '2:30pm', '5pm', '8pm'];
      const temperatures = ['red', 'yellow', 'green'];

      const testData = [];

      for (const shop of shops) {
        for (const timeSlot of timeSlots) {
          testData.push({
            shop_id: shop.id,
            check_in_date: today,
            time_slot: timeSlot,
            cars: Math.floor(Math.random() * 50) + 10,
            sales: Math.floor(Math.random() * 5000) + 1000,
            big4: Math.floor(Math.random() * 20) + 5,
            coolants: Math.floor(Math.random() * 15) + 2,
            diffs: Math.floor(Math.random() * 10) + 1,
            donations: Math.floor(Math.random() * 500) + 50,
            mobil1: Math.floor(Math.random() * 8) + 1,
            staffing: Math.floor(Math.random() * 5) + 2,
            temperature: temperatures[Math.floor(Math.random() * temperatures.length)],
            is_submitted: true
          });
        }
      }

      const { error } = await supabase
        .from('check_ins')
        .upsert(testData, {
          onConflict: 'shop_id,check_in_date,time_slot'
        });

      if (error) {
        throw error;
      }

      console.log('Test check-ins generated successfully');
    } catch (err) {
      console.error('Error generating test check-ins:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate test data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Set selected shops
  const setSelectedShops = useCallback((shopIds: string[]) => {
    setSelectedShopIds(shopIds);
  }, []);

  return {
    loading,
    error,
    selectedShopIds,
    lastResetDate,
    submitCheckIn,
    getShopDayData,
    getShopSubmissionStatus,
    getWeeklyShopSummary,
    getShopAggregatedData,
    getDistrictAggregatedData,
    checkAndPerformDailyReset,
    generateTestCheckIns,
    setSelectedShops,
    loadInitialData
  };
};
