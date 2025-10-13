
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/app/integrations/supabase/client';
import { Alert } from 'react-native';

// Migration utility to move data from AsyncStorage to Supabase
export const migrateDataToSupabase = async () => {
  try {
    console.log('Starting data migration to Supabase...');

    // Check if migration has already been done
    const migrationKey = '@migration_completed';
    const migrationCompleted = await AsyncStorage.getItem(migrationKey);
    
    if (migrationCompleted === 'true') {
      console.log('Migration already completed');
      return { success: true, message: 'Migration already completed' };
    }

    let migratedItems = 0;

    // Migrate hierarchy settings
    try {
      const hierarchyData = await AsyncStorage.getItem('@hierarchy_data');
      if (hierarchyData) {
        const parsed = JSON.parse(hierarchyData);
        if (parsed.districtManagerName) {
          await supabase
            .from('hierarchy_settings')
            .upsert({
              district_manager_name: parsed.districtManagerName,
              updated_at: new Date().toISOString()
            });
          migratedItems++;
          console.log('Migrated hierarchy settings');
        }
      }
    } catch (err) {
      console.log('No hierarchy data to migrate or error:', err);
    }

    // Migrate master setup data (shops and districts)
    try {
      const masterSetupData = await AsyncStorage.getItem('@master_setup_data');
      if (masterSetupData) {
        const parsed = JSON.parse(masterSetupData);
        
        // Migrate shops
        if (parsed.shops && Array.isArray(parsed.shops)) {
          for (const shop of parsed.shops) {
            try {
              await supabase
                .from('shops')
                .upsert({
                  shop_number: shop.number,
                  shop_name: shop.name,
                  is_active: shop.isActive,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'shop_number'
                });
              migratedItems++;
            } catch (shopErr) {
              console.log('Error migrating shop:', shop.number, shopErr);
            }
          }
          console.log(`Migrated ${parsed.shops.length} shops`);
        }

        // Migrate districts
        if (parsed.districts && Array.isArray(parsed.districts)) {
          for (const district of parsed.districts) {
            try {
              // Insert district
              const { data: districtData, error: districtError } = await supabase
                .from('districts')
                .upsert({
                  name: district.name,
                  is_active: district.isActive,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'name'
                })
                .select()
                .single();

              if (districtError) {
                console.log('Error migrating district:', district.name, districtError);
                continue;
              }

              // Migrate shop assignments
              if (district.shopIds && Array.isArray(district.shopIds)) {
                // Get shop UUIDs from shop numbers
                const { data: shops } = await supabase
                  .from('shops')
                  .select('id, shop_number');

                if (shops) {
                  const shopMap = new Map(shops.map(s => [s.shop_number.toString(), s.id]));
                  
                  for (const shopId of district.shopIds) {
                    const shopNumber = shopId.replace('shop-', '');
                    const shopUuid = shopMap.get(shopNumber);
                    
                    if (shopUuid) {
                      try {
                        await supabase
                          .from('district_shops')
                          .upsert({
                            district_id: districtData.id,
                            shop_id: shopUuid
                          }, {
                            onConflict: 'district_id,shop_id'
                          });
                      } catch (assignErr) {
                        console.log('Error assigning shop to district:', assignErr);
                      }
                    }
                  }
                }
              }
              migratedItems++;
            } catch (districtErr) {
              console.log('Error migrating district:', district.name, districtErr);
            }
          }
          console.log(`Migrated ${parsed.districts.length} districts`);
        }
      }
    } catch (err) {
      console.log('No master setup data to migrate or error:', err);
    }

    // Migrate check-in data
    try {
      const keys = await AsyncStorage.getAllKeys();
      const checkInKeys = keys.filter(key => key.startsWith('@shop_day_'));
      
      for (const key of checkInKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            const keyParts = key.replace('@shop_day_', '').split('_');
            const shopNumber = keyParts[0];
            const date = keyParts[1];

            // Get shop UUID
            const { data: shop } = await supabase
              .from('shops')
              .select('id')
              .eq('shop_number', parseInt(shopNumber))
              .single();

            if (shop) {
              // Migrate each time slot
              for (const [timeSlot, checkInData] of Object.entries(parsed)) {
                if (typeof checkInData === 'object' && checkInData !== null) {
                  const data = checkInData as any;
                  try {
                    await supabase
                      .from('check_ins')
                      .upsert({
                        shop_id: shop.id,
                        check_in_date: date,
                        time_slot: timeSlot,
                        cars: data.cars || 0,
                        sales: data.sales || 0,
                        big4: data.big4 || 0,
                        coolants: data.coolant || data.coolants || 0,
                        diffs: data.diffs || 0,
                        donations: data.donations || 0,
                        mobil1: data.mobil1 || 0,
                        staffing: data.staffing || 0,
                        temperature: data.temperature || null,
                        is_submitted: true,
                        updated_at: new Date().toISOString()
                      }, {
                        onConflict: 'shop_id,check_in_date,time_slot'
                      });
                    migratedItems++;
                  } catch (checkInErr) {
                    console.log('Error migrating check-in:', checkInErr);
                  }
                }
              }
            }
          }
        } catch (keyErr) {
          console.log('Error processing key:', key, keyErr);
        }
      }
      console.log(`Processed ${checkInKeys.length} check-in data keys`);
    } catch (err) {
      console.log('No check-in data to migrate or error:', err);
    }

    // Migrate chat messages
    try {
      const chatData = await AsyncStorage.getItem('@chat_messages_default');
      if (chatData) {
        const parsed = JSON.parse(chatData);
        if (Array.isArray(parsed)) {
          for (const message of parsed) {
            try {
              await supabase
                .from('chat_messages')
                .insert({
                  room_id: message.roomId || 'default',
                  sender: message.sender,
                  message: message.text,
                  is_current_user: message.isCurrentUser,
                  created_at: message.timestamp
                });
              migratedItems++;
            } catch (msgErr) {
              console.log('Error migrating message:', msgErr);
            }
          }
          console.log(`Migrated ${parsed.length} chat messages`);
        }
      }
    } catch (err) {
      console.log('No chat data to migrate or error:', err);
    }

    // Mark migration as completed
    await AsyncStorage.setItem(migrationKey, 'true');
    
    console.log(`Migration completed! Migrated ${migratedItems} items total.`);
    
    return { 
      success: true, 
      message: `Migration completed successfully! Migrated ${migratedItems} items.` 
    };

  } catch (error) {
    console.error('Migration failed:', error);
    return { 
      success: false, 
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// Function to show migration prompt to user
export const promptDataMigration = async () => {
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      'Data Migration',
      'Would you like to migrate your existing data to Supabase? This will move your shops, districts, check-ins, and chat messages to the cloud.',
      [
        {
          text: 'Skip',
          style: 'cancel',
          onPress: () => resolve(false)
        },
        {
          text: 'Migrate',
          onPress: () => resolve(true)
        }
      ]
    );
  });
};

// Function to clear old AsyncStorage data after successful migration
export const clearOldAsyncStorageData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const keysToRemove = keys.filter(key => 
      key.startsWith('@shop_day_') ||
      key.startsWith('@shop_submission_') ||
      key === '@master_setup_data' ||
      key === '@hierarchy_data' ||
      key === '@chat_messages_default' ||
      key === '@selected_shops' ||
      key === '@last_reset_date' ||
      key === '@user_name'
    );

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log(`Cleared ${keysToRemove.length} old AsyncStorage keys`);
    }
  } catch (error) {
    console.error('Error clearing old AsyncStorage data:', error);
  }
};
