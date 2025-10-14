
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

  const hasInitialized = useMemo(() => {
    return setupData.shops.length > 0 && hierarchy !== null;
  }, [setupData.shops.length, hierarchy]);

  useEffect(() => {
    if (hierarchy?.districtManagerName) {
      setTempName(hierarchy.districtManagerName);
    }
  }, [hierarchy?.districtManagerName]);

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
            style={{ marginBottom: 15 }}
            disabled={setupLoading || hierarchyLoading}
          />
          
          <Button
            title="Generate Test Data"
            onPress={generateTestCheckIns}
            variant="secondary"
            disabled={checkInLoading}
          />
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
