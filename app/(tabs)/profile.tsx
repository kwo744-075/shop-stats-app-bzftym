
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/button";
import { useMasterSetup } from "@/hooks/useMasterSetup";
import { useCheckInData } from "@/hooks/useCheckInData";
import { CheckInItem } from "@/types/CheckInData";
import MasterSetupScreen from "@/components/MasterSetupScreen";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { GlassView } from "expo-glass-effect";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, TextInput, Alert, Image } from "react-native";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useHierarchyData } from "@/hooks/useHierarchyData";
import { useNavigationContext } from "@/contexts/NavigationContext";
import { useRouter } from "expo-router";
import { migrateDataToSupabase, clearOldAsyncStorageData } from "@/utils/dataMigration";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    opacity: 0.7,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    padding: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  nameText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  modeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  migrationSection: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  migrationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  migrationDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 15,
    lineHeight: 20,
  },
  // Shop Selection styles
  shopSelectionSection: {
    marginBottom: 30,
  },
  shopSelectionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
  },
  shopSelectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  shopSelectionDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
    lineHeight: 20,
  },
  shopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  shopChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedShopChip: {
    // Selected styling handled by backgroundColor and borderColor
  },
  shopChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectedShopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  selectedShopText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  // Action buttons with better visibility
  actionButton: {
    marginBottom: 12,
    minHeight: 48,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { setCurrentView, navigationLoading } = useNavigationContext();
  const { setupData, loading: setupLoading } = useMasterSetup();
  const { generateTestCheckIns, loading: checkInLoading } = useCheckInData();
  const { hierarchy, updateDistrictManagerName, loading: hierarchyLoading } = useHierarchyData();
  
  const [showMasterSetup, setShowMasterSetup] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  const hasInitialized = useMemo(() => {
    return setupData.shops.length > 0 && hierarchy !== null;
  }, [setupData.shops.length, hierarchy]);

  // Get active shops sorted by number
  const activeShops = useMemo(() => {
    return setupData.shops
      .filter(shop => shop.isActive)
      .sort((a, b) => a.number - b.number);
  }, [setupData.shops]);

  // Get selected shop details
  const selectedShop = useMemo(() => {
    if (!selectedShopId) return null;
    return setupData.shops.find(shop => shop.id === selectedShopId);
  }, [selectedShopId, setupData.shops]);

  useEffect(() => {
    if (hierarchy?.districtManagerName) {
      setTempName(hierarchy.districtManagerName);
    }
  }, [hierarchy?.districtManagerName]);

  // Load selected shop from storage
  useEffect(() => {
    const loadSelectedShop = async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const savedShopId = await AsyncStorage.getItem('selectedShopId');
        if (savedShopId && setupData.shops.some(shop => shop.id === savedShopId)) {
          setSelectedShopId(savedShopId);
        }
      } catch (error) {
        console.error('Error loading selected shop:', error);
      }
    };

    if (setupData.shops.length > 0) {
      loadSelectedShop();
    }
  }, [setupData.shops]);

  const refreshSetupData = useCallback(() => {
    // This will trigger a re-render with fresh data
    console.log('Refreshing setup data...');
  }, []);

  useEffect(() => {
    if (showMasterSetup && hasInitialized && !navigationLoading) {
      refreshSetupData();
    }
  }, [showMasterSetup, hasInitialized, navigationLoading, refreshSetupData]);

  useEffect(() => {
    if (hasInitialized && !navigationLoading) {
      refreshSetupData();
    }
  }, [hasInitialized, navigationLoading, refreshSetupData]);

  const getRandomNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const getRandomTemperature = () => {
    const temps = ['red', 'yellow', 'green'];
    return temps[Math.floor(Math.random() * temps.length)] as 'red' | 'yellow' | 'green';
  };

  const handleSaveName = useCallback(async () => {
    if (tempName.trim() && hierarchy) {
      try {
        await updateDistrictManagerName(tempName.trim());
        setEditingName(false);
      } catch (error) {
        Alert.alert('Error', 'Failed to update name');
      }
    }
  }, [tempName, hierarchy, updateDistrictManagerName]);

  const handleCancelEditName = useCallback(() => {
    setTempName(hierarchy?.districtManagerName || '');
    setEditingName(false);
  }, [hierarchy?.districtManagerName]);

  const getModeColor = () => {
    return colors.primary;
  };

  const handleSelectShop = useCallback(async (shopId: string) => {
    try {
      setSelectedShopId(shopId);
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('selectedShopId', shopId);
      
      const shop = setupData.shops.find(s => s.id === shopId);
      if (shop) {
        Alert.alert('Shop Selected', `You are now in shop mode for Shop #${shop.number} (${shop.name})`);
      }
    } catch (error) {
      console.error('Error saving selected shop:', error);
      Alert.alert('Error', 'Failed to save shop selection');
    }
  }, [setupData.shops]);

  const handleClearShopSelection = useCallback(async () => {
    try {
      setSelectedShopId(null);
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.removeItem('selectedShopId');
      Alert.alert('Shop Selection Cleared', 'You are now in district manager mode');
    } catch (error) {
      console.error('Error clearing shop selection:', error);
      Alert.alert('Error', 'Failed to clear shop selection');
    }
  }, []);

  const handleMigrateData = async () => {
    try {
      setMigrationLoading(true);
      
      Alert.alert(
        'Migrate Data',
        'This will migrate your existing AsyncStorage data to Supabase. This process may take a few moments.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setMigrationLoading(false)
          },
          {
            text: 'Migrate',
            onPress: async () => {
              try {
                const result = await migrateDataToSupabase();
                
                Alert.alert(
                  result.success ? 'Migration Successful' : 'Migration Failed',
                  result.message,
                  [
                    {
                      text: 'OK',
                      onPress: async () => {
                        if (result.success) {
                          // Optionally clear old data
                          Alert.alert(
                            'Clear Old Data',
                            'Would you like to clear the old AsyncStorage data now that migration is complete?',
                            [
                              { text: 'Keep Old Data', style: 'cancel' },
                              {
                                text: 'Clear Old Data',
                                onPress: async () => {
                                  await clearOldAsyncStorageData();
                                  Alert.alert('Success', 'Old data cleared successfully');
                                }
                              }
                            ]
                          );
                        }
                      }
                    }
                  ]
                );
              } catch (error) {
                Alert.alert('Migration Error', error instanceof Error ? error.message : 'Unknown error occurred');
              } finally {
                setMigrationLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      setMigrationLoading(false);
      Alert.alert('Error', 'Failed to start migration');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Manage your settings and preferences
          </Text>
        </View>

        {/* Mode Indicator */}
        <View style={[styles.modeIndicator, { backgroundColor: getModeColor() + '20', borderColor: getModeColor() + '40', borderWidth: 1 }]}>
          <IconSymbol name="cloud.fill" size={20} color={getModeColor()} />
          <Text style={[styles.modeText, { color: getModeColor() }]}>
            Supabase Mode - Data synced to cloud
          </Text>
        </View>

        {/* Shop Selection */}
        <View style={styles.shopSelectionSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Shop Selection</Text>
          <GlassView style={[styles.shopSelectionCard, { backgroundColor: colors.card + '80' }]}>
            <Text style={[styles.shopSelectionTitle, { color: colors.text }]}>
              Select Your Shop
            </Text>
            <Text style={[styles.shopSelectionDescription, { color: colors.text }]}>
              Choose a shop to enter shop mode, or leave unselected for district manager mode.
            </Text>
            
            {/* Current Selection */}
            {selectedShop && (
              <View style={[styles.selectedShopInfo, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40', borderWidth: 1 }]}>
                <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                <Text style={[styles.selectedShopText, { color: colors.primary }]}>
                  Currently selected: Shop #{selectedShop.number} ({selectedShop.name})
                </Text>
              </View>
            )}
            
            {/* Shop Grid */}
            <View style={styles.shopGrid}>
              {activeShops.map((shop) => (
                <TouchableOpacity
                  key={shop.id}
                  style={[
                    styles.shopChip,
                    selectedShopId === shop.id && styles.selectedShopChip,
                    { 
                      borderColor: selectedShopId === shop.id ? colors.primary : colors.border,
                      backgroundColor: selectedShopId === shop.id ? colors.primary : colors.card
                    }
                  ]}
                  onPress={() => handleSelectShop(shop.id)}
                >
                  <Text style={[
                    styles.shopChipText,
                    { color: selectedShopId === shop.id ? 'white' : colors.text }
                  ]}>
                    #{shop.number}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {selectedShopId && (
              <Button
                title="Clear Selection (District Mode)"
                onPress={handleClearShopSelection}
                variant="secondary"
                style={styles.actionButton}
              />
            )}
          </GlassView>
        </View>

        {/* District Manager Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>District Manager</Text>
          <GlassView style={[styles.card, { backgroundColor: colors.card + '80' }]}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>Name</Text>
              <View style={styles.nameContainer}>
                {editingName ? (
                  <>
                    <TextInput
                      style={[styles.nameInput, { 
                        color: colors.text, 
                        backgroundColor: colors.background + '50',
                        borderWidth: 1,
                        borderColor: colors.border
                      }]}
                      value={tempName}
                      onChangeText={setTempName}
                      placeholder="Enter name"
                      placeholderTextColor={colors.text + '60'}
                      autoFocus
                    />
                    <View style={styles.buttonRow}>
                      <TouchableOpacity 
                        style={styles.editButton}
                        onPress={handleSaveName}
                        disabled={hierarchyLoading}
                      >
                        <IconSymbol name="checkmark" size={20} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.editButton}
                        onPress={handleCancelEditName}
                      >
                        <IconSymbol name="xmark" size={20} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={[styles.nameText, { color: colors.text }]}>
                      {hierarchy?.districtManagerName || 'District Manager'}
                    </Text>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => setEditingName(true)}
                    >
                      <IconSymbol name="pencil" size={20} color={colors.text} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </GlassView>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistics</Text>
          <GlassView style={[styles.card, { backgroundColor: colors.card + '80' }]}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>Total Shops</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {setupData.shops.filter(shop => shop.isActive).length}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>Total Districts</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {setupData.districts.filter(district => district.isActive).length}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>Last Updated</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {new Date(setupData.lastUpdated).toLocaleDateString()}
              </Text>
            </View>
          </GlassView>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
          
          <Button
            title="Master Setup"
            onPress={() => setShowMasterSetup(true)}
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            disabled={setupLoading || hierarchyLoading}
          >
            <Text style={[styles.actionButtonText, { color: 'white' }]}>
              Master Setup
            </Text>
          </Button>
          
          <Button
            title="Generate Test Data"
            onPress={generateTestCheckIns}
            variant="secondary"
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            disabled={checkInLoading}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Generate Test Data
            </Text>
          </Button>
        </View>

        {/* Data Migration Section */}
        <View style={[styles.migrationSection, { borderColor: colors.border }]}>
          <Text style={[styles.migrationTitle, { color: colors.text }]}>
            Data Migration
          </Text>
          <Text style={[styles.migrationDescription, { color: colors.text }]}>
            If you have existing data in AsyncStorage that wasn't migrated during app startup, 
            you can manually migrate it to Supabase here. This will move your shops, districts, 
            check-ins, and chat messages to the cloud.
          </Text>
          <Button
            title={migrationLoading ? "Migrating..." : "Migrate AsyncStorage Data"}
            onPress={handleMigrateData}
            variant="secondary"
            disabled={migrationLoading}
          />
        </View>
      </ScrollView>

      {/* Master Setup Modal */}
      <MasterSetupScreen
        visible={showMasterSetup}
        onClose={() => setShowMasterSetup(false)}
      />
    </SafeAreaView>
  );
}
