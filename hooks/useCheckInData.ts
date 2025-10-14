
import { useState, useEffect, useCallback } from 'react';
import { CheckInItem, ShopCheckIn, DailyData, WeeklyData, ShopDayData, ShopSubmissionStatus } from '@/types/CheckInData';
import { supabase } from '@/app/integrations/supabase/client';

// Test data based on the provided image
const TEST_DATA_BY_SHOP = {
  // NOLA North
  1: { cars: 23, sales: 3230.55, big4: 6.9, coolants: 10, diffs: 1, donations: 2.0, mobil1: 13.8, staffing: 0, temperature: 'green' as const },
  2: { cars: 52, sales: 6365.53, big4: 1.3, coolants: 33.0, diffs: 63.5, donations: 4.0, mobil1: 21.2, staffing: 0, temperature: 'yellow' as const },
  3: { cars: 24, sales: 3353.32, big4: 1.2, coolants: 17.0, diffs: 70.8, donations: 7.0, mobil1: 31.5, staffing: 0, temperature: 'green' as const },
  4: { cars: 62, sales: 6903.63, big4: 0.5, coolants: 42.0, diffs: 67.7, donations: 1.0, mobil1: 35.9, staffing: 0, temperature: 'red' as const },
  5: { cars: 44, sales: 5335.69, big4: 0.0, coolants: 31.0, diffs: 47.7, donations: 4.0, mobil1: 18.2, staffing: 0, temperature: 'green' as const },
  6: { cars: 59, sales: 5348.26, big4: 1.9, coolants: 21.0, diffs: 40.4, donations: 3.0, mobil1: 31.5, staffing: 0, temperature: 'green' as const },
  8: { cars: 52, sales: 5348.26, big4: 1.9, coolants: 21.0, diffs: 40.4, donations: 3.0, mobil1: 31.5, staffing: 0, temperature: 'green' as const },
  10: { cars: 32, sales: 3768.53, big4: 0.0, coolants: 12.0, diffs: 37.5, donations: 2.0, mobil1: 6.2, staffing: 0, temperature: 'green' as const },
  11: { cars: 23, sales: 3795.87, big4: 17.4, coolants: 18.0, diffs: 78.3, donations: 6.0, mobil1: 56.5, staffing: 0, temperature: 'green' as const },
  12: { cars: 43, sales: 5488.28, big4: 2.3, coolants: 12.0, diffs: 27.9, donations: 3.0, mobil1: 67.4, staffing: 0, temperature: 'green' as const },
  13: { cars: 63, sales: 7742.36, big4: 1.6, coolants: 30.0, diffs: 47.6, donations: 4.0, mobil1: 54.0, staffing: 0, temperature: 'green' as const },
  14: { cars: 28, sales: 3236.54, big4: 0.0, coolants: 12.0, diffs: 42.9, donations: 1.0, mobil1: 17.9, staffing: 0, temperature: 'green' as const },
  15: { cars: 40, sales: 4396.73, big4: 5.0, coolants: 18.0, diffs: 45.0, donations: 0.0, mobil1: 15.0, staffing: 0, temperature: 'green' as const },
  17: { cars: 20, sales: 2373.43, big4: 0.0, coolants: 8.0, diffs: 40.0, donations: 2.0, mobil1: 25.0, staffing: 0, temperature: 'green' as const },
  18: { cars: 39, sales: 4393.31, big4: 0.0, coolants: 10.0, diffs: 25.6, donations: 1.0, mobil1: 20.5, staffing: 0, temperature: 'green' as const },
  19: { cars: 23, sales: 3573.44, big4: 0.0, coolants: 5.0, diffs: 21.7, donations: 1.0, mobil1: 34.8, staffing: 0, temperature: 'green' as const },
  20: { cars: 34, sales: 3334.94, big4: 2.9, coolants: 13.0, diffs: 38.2, donations: 2.0, mobil1: 5.9, staffing: 0, temperature: 'green' as const },
  21: { cars: 62, sales: 8153.54, big4: 1.6, coolants: 33.0, diffs: 53.2, donations: 7.0, mobil1: 6.5, staffing: 0, temperature: 'green' as const },
  22: { cars: 26, sales: 3169.72, big4: 0.0, coolants: 16.0, diffs: 61.5, donations: 2.0, mobil1: 34.6, staffing: 0, temperature: 'green' as const },
  23: { cars: 36, sales: 5235.73, big4: 2.8, coolants: 12.0, diffs: 33.3, donations: 3.0, mobil1: 0.0, staffing: 0, temperature: 'green' as const },
  24: { cars: 35, sales: 6358.13, big4: 0.0, coolants: 7.0, diffs: 20.0, donations: 0.0, mobil1: 5.7, staffing: 0, temperature: 'green' as const },
  26: { cars: 22, sales: 3136.71, big4: 0.0, coolants: 13.0, diffs: 59.1, donations: 2.0, mobil1: 63.6, staffing: 0, temperature: 'green' as const },
  28: { cars: 63, sales: 6354.23, big4: 0.0, coolants: 26.0, diffs: 41.3, donations: 2.0, mobil1: 12.7, staffing: 0, temperature: 'green' as const },
  29: { cars: 45, sales: 5594.40, big4: 0.0, coolants: 13.0, diffs: 42.2, donations: 2.0, mobil1: 26.7, staffing: 0, temperature: 'green' as const },
  31: { cars: 51, sales: 6554.33, big4: 3.9, coolants: 18.0, diffs: 35.3, donations: 5.0, mobil1: 39.2, staffing: 0, temperature: 'green' as const },
  32: { cars: 34, sales: 3506.44, big4: 0.0, coolants: 13.0, diffs: 38.2, donations: 0.0, mobil1: 8.8, staffing: 0, temperature: 'green' as const },
  40: { cars: 35, sales: 3580.31, big4: 2.9, coolants: 11.0, diffs: 31.4, donations: 1.0, mobil1: 11.4, staffing: 0, temperature: 'green' as const },
  46: { cars: 41, sales: 4337.35, big4: 2.4, coolants: 25.0, diffs: 61.0, donations: 1.0, mobil1: 7.3, staffing: 0, temperature: 'green' as const },
  52: { cars: 65, sales: 8074.23, big4: 0.0, coolants: 33.0, diffs: 50.8, donations: 5.0, mobil1: 15.4, staffing: 0, temperature: 'green' as const },
  92: { cars: 42, sales: 5252.38, big4: 0.0, coolants: 24.0, diffs: 57.1, donations: 3.0, mobil1: 33.3, staffing: 0, temperature: 'green' as const },
  116: { cars: 25, sales: 2673.03, big4: 0.0, coolants: 12.0, diffs: 48.0, donations: 1.0, mobil1: 44.0, staffing: 0, temperature: 'green' as const },
  280: { cars: 15, sales: 4261.35, big4: 0.0, coolants: 12.0, diffs: 80.0, donations: 0.0, mobil1: 53.3, staffing: 0, temperature: 'green' as const },
  282: { cars: 25, sales: 4053.66, big4: 0.0, coolants: 12.0, diffs: 60.0, donations: 0.0, mobil1: 60.0, staffing: 0, temperature: 'green' as const },
  283: { cars: 25, sales: 4361.35, big4: 0.0, coolants: 3.0, diffs: 36.0, donations: 0.0, mobil1: 52.0, staffing: 0, temperature: 'green' as const },
  447: { cars: 42, sales: 4571.52, big4: 2.4, coolants: 14.0, diffs: 33.3, donations: 0.0, mobil1: 0.0, staffing: 0, temperature: 'green' as const },
  448: { cars: 23, sales: 2554.06, big4: 4.3, coolants: 3.0, diffs: 13.0, donations: 0.0, mobil1: 13.0, staffing: 0, temperature: 'green' as const },
  531: { cars: 37, sales: 4737.73, big4: 0.0, coolants: 16.0, diffs: 43.2, donations: 2.0, mobil1: 8.1, staffing: 0, temperature: 'green' as const },
  599: { cars: 37, sales: 4294.31, big4: 0.0, coolants: 12.0, diffs: 32.4, donations: 3.0, mobil1: 16.2, staffing: 0, temperature: 'green' as const },
  606: { cars: 26, sales: 2326.75, big4: 0.0, coolants: 7.0, diffs: 26.9, donations: 1.0, mobil1: 30.8, staffing: 0, temperature: 'green' as const },
  641: { cars: 34, sales: 4502.07, big4: 2.9, coolants: 23.0, diffs: 67.6, donations: 1.0, mobil1: 20.6, staffing: 0, temperature: 'green' as const },
  717: { cars: 27, sales: 3313.56, big4: 3.7, coolants: 17.0, diffs: 63.0, donations: 1.0, mobil1: 0.0, staffing: 0, temperature: 'green' as const },
  720: { cars: 11, sales: 1609.37, big4: 9.1, coolants: 7.0, diffs: 63.6, donations: 2.0, mobil1: 0.0, staffing: 0, temperature: 'green' as const },
  728: { cars: 30, sales: 3675.83, big4: 0.0, coolants: 17.0, diffs: 56.7, donations: 1.0, mobil1: 43.3, staffing: 0, temperature: 'green' as const },
  830: { cars: 21, sales: 2445.04, big4: 0.0, coolants: 3.0, diffs: 42.9, donations: 3.0, mobil1: 0.0, staffing: 0, temperature: 'green' as const },
  832: { cars: 3, sales: 1127.35, big4: 0.0, coolants: 3.0, diffs: 33.3, donations: 0.0, mobil1: 0.0, staffing: 0, temperature: 'green' as const },
  843: { cars: 13, sales: 2634.04, big4: 0.0, coolants: 13.0, diffs: 69.2, donations: 3.0, mobil1: 42.3, staffing: 0, temperature: 'green' as const },
  847: { cars: 35, sales: 4423.79, big4: 0.0, coolants: 21.0, diffs: 60.0, donations: 0.0, mobil1: 14.3, staffing: 0, temperature: 'green' as const },
  865: { cars: 36, sales: 1339.23, big4: 0.0, coolants: 8.0, diffs: 50.0, donations: 0.0, mobil1: 33.3, staffing: 0, temperature: 'green' as const },
  870: { cars: 24, sales: 3233.88, big4: 0.0, coolants: 16.0, diffs: 66.7, donations: 2.0, mobil1: 16.7, staffing: 0, temperature: 'green' as const },
  881: { cars: 20, sales: 2542.54, big4: 0.0, coolants: 8.0, diffs: 40.0, donations: 1.0, mobil1: 35.0, staffing: 0, temperature: 'green' as const },
  919: { cars: 15, sales: 2124.43, big4: 20.0, coolants: 8.0, diffs: 53.3, donations: 0.0, mobil1: 13.3, staffing: 0, temperature: 'green' as const },
  954: { cars: 16, sales: 1735.59, big4: 0.0, coolants: 7.0, diffs: 43.8, donations: 0.0, mobil1: 6.3, staffing: 0, temperature: 'green' as const },
  975: { cars: 21, sales: 3157.00, big4: 3.5, coolants: 13.0, diffs: 61.9, donations: 3.0, mobil1: 28.6, staffing: 0, temperature: 'green' as const },
  3004: { cars: 21, sales: 3157.00, big4: 3.5, coolants: 13.0, diffs: 61.9, donations: 3.0, mobil1: 28.6, staffing: 0, temperature: 'green' as const },
  3017: { cars: 21, sales: 3157.00, big4: 3.5, coolants: 13.0, diffs: 61.9, donations: 3.0, mobil1: 28.6, staffing: 0, temperature: 'green' as const }
};

export const useCheckInData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
  const [lastResetDate, setLastResetDate] = useState<string | null>(null);
  const [checkInData, setCheckInData] = useState<Record<string, CheckInItem | null>>({});

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

  // Generate test check-ins based on provided data
  const generateTestCheckIns = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all active shops with their shop numbers
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id, shop_number')
        .eq('is_active', true);

      if (shopsError) {
        throw shopsError;
      }

      if (!shops) return;

      const today = new Date().toISOString().split('T')[0];
      const timeSlots = ['12pm', '2:30pm', '5pm', '8pm'];

      const testData = [];

      for (const shop of shops) {
        const shopTestData = TEST_DATA_BY_SHOP[shop.shop_number as keyof typeof TEST_DATA_BY_SHOP];
        
        if (shopTestData) {
          // Distribute the data across 4 check-ins
          // For sales, cars, and donations: take 25% for each check-in
          // For others: split evenly across the 4 check-ins, ensuring no zeros where there should be values
          
          const salesPerCheckIn = Math.floor(shopTestData.sales * 0.25);
          const carsPerCheckIn = Math.floor(shopTestData.cars * 0.25);
          const donationsPerCheckIn = Math.floor(shopTestData.donations * 0.25);
          
          // For other metrics, distribute them across check-ins but ensure totals match
          const big4PerCheckIn = Math.floor(shopTestData.big4 / 4);
          const coolantsPerCheckIn = Math.floor(shopTestData.coolants / 4);
          const diffsPerCheckIn = Math.floor(shopTestData.diffs / 4);
          const mobil1PerCheckIn = Math.floor(shopTestData.mobil1 / 4);
          const staffingPerCheckIn = Math.floor(shopTestData.staffing / 4);

          for (let i = 0; i < timeSlots.length; i++) {
            const timeSlot = timeSlots[i];
            
            // Add some variation to make it realistic, but ensure totals are close
            const variation = 0.1; // 10% variation
            const randomFactor = 1 + (Math.random() - 0.5) * variation;
            
            // For the last check-in, adjust to ensure we hit the target totals
            const isLastCheckIn = i === timeSlots.length - 1;
            
            let cars, sales, donations, big4, coolants, diffs, mobil1, staffing;
            
            if (isLastCheckIn) {
              // Calculate remaining amounts to ensure totals match
              const previousCheckIns = testData.filter(d => d.shop_id === shop.id);
              const totalCarsUsed = previousCheckIns.reduce((sum, d) => sum + d.cars, 0);
              const totalSalesUsed = previousCheckIns.reduce((sum, d) => sum + d.sales, 0);
              const totalDonationsUsed = previousCheckIns.reduce((sum, d) => sum + d.donations, 0);
              const totalBig4Used = previousCheckIns.reduce((sum, d) => sum + d.big4, 0);
              const totalCoolantsUsed = previousCheckIns.reduce((sum, d) => sum + d.coolants, 0);
              const totalDiffsUsed = previousCheckIns.reduce((sum, d) => sum + d.diffs, 0);
              const totalMobil1Used = previousCheckIns.reduce((sum, d) => sum + d.mobil1, 0);
              const totalStaffingUsed = previousCheckIns.reduce((sum, d) => sum + d.staffing, 0);
              
              cars = Math.max(0, shopTestData.cars - totalCarsUsed);
              sales = Math.max(0, shopTestData.sales - totalSalesUsed);
              donations = Math.max(0, shopTestData.donations - totalDonationsUsed);
              big4 = Math.max(0, shopTestData.big4 - totalBig4Used);
              coolants = Math.max(0, shopTestData.coolants - totalCoolantsUsed);
              diffs = Math.max(0, shopTestData.diffs - totalDiffsUsed);
              mobil1 = Math.max(0, shopTestData.mobil1 - totalMobil1Used);
              staffing = Math.max(0, shopTestData.staffing - totalStaffingUsed);
            } else {
              cars = Math.floor(carsPerCheckIn * randomFactor);
              sales = Math.floor(salesPerCheckIn * randomFactor);
              donations = Math.floor(donationsPerCheckIn * randomFactor);
              big4 = Math.floor(big4PerCheckIn * randomFactor);
              coolants = Math.floor(coolantsPerCheckIn * randomFactor);
              diffs = Math.floor(diffsPerCheckIn * randomFactor);
              mobil1 = Math.floor(mobil1PerCheckIn * randomFactor);
              staffing = Math.floor(staffingPerCheckIn * randomFactor);
            }

            testData.push({
              shop_id: shop.id,
              check_in_date: today,
              time_slot: timeSlot,
              cars: cars,
              sales: sales,
              big4: big4,
              coolants: coolants,
              diffs: diffs,
              donations: donations,
              mobil1: mobil1,
              staffing: staffing,
              temperature: shopTestData.temperature,
              is_submitted: true
            });
          }
        } else {
          // For shops not in test data, generate random data
          for (const timeSlot of timeSlots) {
            testData.push({
              shop_id: shop.id,
              check_in_date: today,
              time_slot: timeSlot,
              cars: Math.floor(Math.random() * 20) + 5,
              sales: Math.floor(Math.random() * 2000) + 500,
              big4: Math.floor(Math.random() * 10) + 1,
              coolants: Math.floor(Math.random() * 8) + 1,
              diffs: Math.floor(Math.random() * 5) + 1,
              donations: Math.floor(Math.random() * 200) + 25,
              mobil1: Math.floor(Math.random() * 4) + 1,
              staffing: Math.floor(Math.random() * 3) + 1,
              temperature: ['red', 'yellow', 'green'][Math.floor(Math.random() * 3)],
              is_submitted: true
            });
          }
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

      console.log('Test check-ins generated successfully for', shops.length, 'shops');
    } catch (err) {
      console.error('Error generating test check-ins:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate test data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load check-in data for all shops
  const loadCheckInData = useCallback(async () => {
    try {
      console.log('useCheckInData: Loading check-in data...');
      setLoading(true);
      setError(null);

      // Get all active shops
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id')
        .eq('is_active', true);

      if (shopsError) {
        throw shopsError;
      }

      if (!shops) {
        setCheckInData({});
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const checkInMap: Record<string, CheckInItem | null> = {};

      // Load check-in data for each shop
      for (const shop of shops) {
        const aggregatedData = await getShopAggregatedData(shop.id, false);
        
        if (aggregatedData) {
          checkInMap[shop.id] = {
            cars: aggregatedData.cars,
            sales: aggregatedData.sales,
            big4: aggregatedData.big4,
            coolant: aggregatedData.coolants,
            diffs: aggregatedData.diffs,
            donations: aggregatedData.donations,
            mobil1: aggregatedData.mobil1,
            staffing: aggregatedData.staffing,
            temperature: 'green' // Default temperature
          };
        } else {
          checkInMap[shop.id] = null;
        }
      }

      console.log('useCheckInData: Loaded check-in data for', Object.keys(checkInMap).length, 'shops');
      setCheckInData(checkInMap);
    } catch (err) {
      console.error('Error loading check-in data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load check-in data');
    } finally {
      setLoading(false);
    }
  }, [getShopAggregatedData]);

  // Refresh check-in data
  const refreshCheckInData = useCallback(async () => {
    await loadCheckInData();
  }, [loadCheckInData]);

  // Load data on mount
  useEffect(() => {
    loadCheckInData();
  }, [loadCheckInData]);

  // Set selected shops
  const setSelectedShops = useCallback((shopIds: string[]) => {
    setSelectedShopIds(shopIds);
  }, []);

  return {
    loading,
    error,
    selectedShopIds,
    lastResetDate,
    checkInData,
    refreshCheckInData,
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
