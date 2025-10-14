
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { GlassView } from 'expo-glass-effect';
import { useMasterSetup } from '@/hooks/useMasterSetup';
import { MasterShop, District } from '@/types/SetupData';
import Button from '@/components/button';
import * as Haptics from 'expo-haptics';
import { useCheckInData } from '@/hooks/useCheckInData';

interface MasterSetupScreenProps {
  visible: boolean;
  onClose: () => void;
}

interface CommunicationSchedule {
  id: string;
  message: string;
  schedule_time: string;
  schedule_days: string[];
  is_active: boolean;
}

const DEFAULT_PASSWORD = 'take5';

export default function MasterSetupScreen({ visible, onClose }: MasterSetupScreenProps) {
  const theme = useTheme();
  const { setupData, loading, addShop, updateShop, deleteShop, addDistrict, updateDistrict, deleteDistrict, updateMetricGoals } = useMasterSetup();
  const { generateTestCheckIns } = useCheckInData();
  
  // Authentication state
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Shop form state
  const [newShopNumber, setNewShopNumber] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [editingShop, setEditingShop] = useState<MasterShop | null>(null);
  const [editShopName, setEditShopName] = useState('');
  
  // District form state
  const [newDistrictName, setNewDistrictName] = useState('');
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);
  const [editDistrictName, setEditDistrictName] = useState('');
  const [selectedShopsForDistrict, setSelectedShopsForDistrict] = useState<string[]>([]);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'shops' | 'districts' | 'goals'>('shops');
  
  // KPI goals form state (only Big4, coolants, diffs, mobil1 as percentages)
  const [goalsBig4, setGoalsBig4] = useState('0');
  const [goalsCoolants, setGoalsCoolants] = useState('0');
  const [goalsDiffs, setGoalsDiffs] = useState('0');
  const [goalsMobil1, setGoalsMobil1] = useState('0');

  // Communication Schedule state
  const [communicationSchedules, setCommunicationSchedules] = useState<CommunicationSchedule[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newScheduleTime, setNewScheduleTime] = useState('09:00');
  const [editingSchedule, setEditingSchedule] = useState<CommunicationSchedule | null>(null);

  // Memoize active shops sorted by shop number
  const activeShops = useMemo(() => {
    const shops = setupData?.shops.filter(shop => shop.isActive) || [];
    return shops.sort((a, b) => a.number - b.number);
  }, [setupData?.shops]);

  // Memoize all shops sorted by shop number
  const sortedShops = useMemo(() => {
    const shops = setupData?.shops || [];
    return shops.sort((a, b) => a.number - b.number);
  }, [setupData?.shops]);

  // Get shops that are not assigned to any district
  const unassignedShops = useMemo(() => {
    if (!setupData) return [];
    
    const assignedShopIds = new Set(
      setupData.districts.flatMap(district => district.shopIds)
    );
    
    const unassigned = setupData.shops.filter(shop => !assignedShopIds.has(shop.id));
    
    console.log('Unassigned shops calculation:', {
      totalShops: setupData.shops.length,
      assignedShopIds: Array.from(assignedShopIds),
      unassignedShops: unassigned.map(s => ({ id: s.id, number: s.number, name: s.name }))
    });
    
    return unassigned;
  }, [setupData]);

  const resetForms = useCallback(() => {
    setNewShopNumber('');
    setNewShopName('');
    setEditingShop(null);
    setEditShopName('');
    setNewDistrictName('');
    setEditingDistrict(null);
    setEditDistrictName('');
    setSelectedShopsForDistrict([]);
    
    // Reset KPI goals form to current values or defaults
    const goals = setupData?.metricGoals;
    setGoalsBig4(goals?.big4?.toString() || '0');
    setGoalsCoolants(goals?.coolants?.toString() || '0');
    setGoalsDiffs(goals?.diffs?.toString() || '0');
    setGoalsMobil1(goals?.mobil1?.toString() || '0');

    // Reset communication schedule forms
    setNewMessage('');
    setNewScheduleTime('09:00');
    setEditingSchedule(null);
  }, [setupData?.metricGoals]);

  useEffect(() => {
    if (!visible) {
      // Reset form when modal closes
      resetForms();
      setIsAuthenticated(false);
      setPassword('');
    }
  }, [visible, resetForms]);

  useEffect(() => {
    if (setupData && !loading) {
      console.log('MasterSetupScreen: Setup data loaded', setupData);
      
      // Initialize KPI goals form with current values
      const goals = setupData.metricGoals;
      if (goals) {
        setGoalsBig4(goals.big4.toString());
        setGoalsCoolants(goals.coolants.toString());
        setGoalsDiffs(goals.diffs.toString());
        setGoalsMobil1(goals.mobil1.toString());
      }
    }
  }, [setupData, loading]);

  // Load communication schedules
  const loadCommunicationSchedules = useCallback(async () => {
    try {
      const { supabase } = await import('@/app/integrations/supabase/client');
      const { data, error } = await supabase
        .from('communication_schedules')
        .select('*')
        .order('created_at');

      if (error) {
        console.error('Error loading communication schedules:', error);
        return;
      }

      setCommunicationSchedules(data || []);
    } catch (error) {
      console.error('Error loading communication schedules:', error);
    }
  }, []);

  useEffect(() => {
    if (visible && isAuthenticated) {
      loadCommunicationSchedules();
    }
  }, [visible, isAuthenticated, loadCommunicationSchedules]);

  const handlePasswordSubmit = useCallback(() => {
    if (password === DEFAULT_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      Alert.alert('Access Denied', 'Incorrect password. Please try again.');
      setPassword('');
    }
  }, [password]);

  const handleAddShop = useCallback(async () => {
    const shopNumber = parseInt(newShopNumber);
    if (isNaN(shopNumber) || shopNumber <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid shop number.');
      return;
    }

    if (!newShopName.trim()) {
      Alert.alert('Invalid Input', 'Please enter a shop name.');
      return;
    }

    // Check if shop number already exists
    const existingShop = setupData?.shops.find(shop => shop.number === shopNumber);
    if (existingShop) {
      Alert.alert('Error', 'Shop number already exists. Please choose a different number.');
      return;
    }

    const success = await addShop({
      number: shopNumber,
      name: newShopName.trim(),
      isActive: true
    });

    if (success) {
      Alert.alert('Success', `Shop ${shopNumber} (${newShopName.trim()}) added successfully!`);
      setNewShopNumber('');
      setNewShopName('');
      console.log('MasterSetupScreen: Shop added successfully');
    } else {
      Alert.alert('Error', 'Failed to add shop. Please try again.');
    }
  }, [newShopNumber, newShopName, addShop, setupData?.shops]);

  const handleEditShop = useCallback((shop: MasterShop) => {
    setEditingShop(shop);
    setEditShopName(shop.name);
  }, []);

  const handleSaveShopEdit = useCallback(async () => {
    if (!editingShop) return;

    if (!editShopName.trim()) {
      Alert.alert('Invalid Input', 'Please enter a shop name.');
      return;
    }

    const success = await updateShop(editingShop.id, { name: editShopName.trim() });
    if (success) {
      Alert.alert('Success', 'Shop updated successfully!');
      setEditingShop(null);
      setEditShopName('');
    } else {
      Alert.alert('Error', 'Failed to update shop.');
    }
  }, [editingShop, editShopName, updateShop]);

  const handleDeleteShop = useCallback((shop: MasterShop) => {
    console.log('handleDeleteShop called for shop:', shop);
    
    // Check if shop is assigned to any district
    const isAssignedToDistrict = setupData?.districts.some(district => 
      district.shopIds.includes(shop.id)
    );

    console.log('Shop assignment status:', { 
      shopId: shop.id, 
      shopNumber: shop.number, 
      isAssignedToDistrict,
      districts: setupData?.districts.map(d => ({ name: d.name, shopIds: d.shopIds }))
    });

    if (isAssignedToDistrict) {
      Alert.alert(
        'Cannot Delete Shop',
        `Shop ${shop.number} (${shop.name}) is currently assigned to a district. Please remove it from all districts before deleting.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Shop',
      `Are you sure you want to delete Shop ${shop.number} (${shop.name})? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('Attempting to delete shop:', shop.id);
            const success = await deleteShop(shop.id);
            console.log('Delete shop result:', success);
            if (success) {
              Alert.alert('Success', 'Shop deleted successfully!');
            } else {
              Alert.alert('Error', 'Failed to delete shop.');
            }
          }
        }
      ]
    );
  }, [deleteShop, setupData?.districts]);

  const handleToggleShop = useCallback(async (shopId: string, currentActive: boolean) => {
    const success = await updateShop(shopId, { isActive: !currentActive });
    if (!success) {
      Alert.alert('Error', 'Failed to update shop status.');
    }
  }, [updateShop]);

  const handleAddDistrict = useCallback(async () => {
    if (!newDistrictName.trim()) {
      Alert.alert('Invalid Input', 'Please enter a district name.');
      return;
    }

    const success = await addDistrict({
      name: newDistrictName.trim(),
      shopIds: [],
      isActive: true
    });

    if (success) {
      Alert.alert('Success', 'District added successfully!');
      setNewDistrictName('');
    } else {
      Alert.alert('Error', 'Failed to add district.');
    }
  }, [newDistrictName, addDistrict]);

  const handleEditDistrict = useCallback((district: District) => {
    setEditingDistrict(district);
    setEditDistrictName(district.name);
    setSelectedShopsForDistrict([...district.shopIds]);
  }, []);

  const handleSaveDistrictEdit = useCallback(async () => {
    if (!editingDistrict) return;

    if (!editDistrictName.trim()) {
      Alert.alert('Invalid Input', 'Please enter a district name.');
      return;
    }

    const success = await updateDistrict(editingDistrict.id, {
      name: editDistrictName.trim(),
      shopIds: selectedShopsForDistrict
    });

    if (success) {
      Alert.alert('Success', 'District updated successfully!');
      setEditingDistrict(null);
      setEditDistrictName('');
      setSelectedShopsForDistrict([]);
    } else {
      Alert.alert('Error', 'Failed to update district.');
    }
  }, [editingDistrict, editDistrictName, selectedShopsForDistrict, updateDistrict]);

  const handleDeleteDistrict = useCallback((district: District) => {
    Alert.alert(
      'Delete District',
      `Are you sure you want to delete ${district.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteDistrict(district.id);
            if (success) {
              Alert.alert('Success', 'District deleted successfully!');
            } else {
              Alert.alert('Error', 'Failed to delete district.');
            }
          }
        }
      ]
    );
  }, [deleteDistrict]);

  const handleToggleShopInDistrict = useCallback((shopId: string) => {
    setSelectedShopsForDistrict(prev => 
      prev.includes(shopId) 
        ? prev.filter(id => id !== shopId)
        : [...prev, shopId]
    );
  }, []);

  const handleSaveKPIGoals = useCallback(async () => {
    try {
      const goals = {
        // Keep existing values for removed fields
        cars: setupData?.metricGoals?.cars || 0,
        sales: setupData?.metricGoals?.sales || 0,
        staffing: setupData?.metricGoals?.staffing || 0,
        donations: setupData?.metricGoals?.donations || 0,
        temperature: setupData?.metricGoals?.temperature || 'green',
        // Update only KPI goals (as percentages)
        big4: parseInt(goalsBig4) || 0,
        coolants: parseInt(goalsCoolants) || 0,
        diffs: parseInt(goalsDiffs) || 0,
        mobil1: parseInt(goalsMobil1) || 0,
      };

      await updateMetricGoals(goals);
      Alert.alert('Success', 'KPI goals updated successfully!');
    } catch (error) {
      console.log('Error updating KPI goals:', error);
      Alert.alert('Error', 'Failed to update KPI goals. Please try again.');
    }
  }, [goalsBig4, goalsCoolants, goalsDiffs, goalsMobil1, setupData?.metricGoals, updateMetricGoals]);

  // Communication Schedule functions
  const handleAddCommunicationSchedule = useCallback(async () => {
    if (!newMessage.trim()) {
      Alert.alert('Invalid Input', 'Please enter a message.');
      return;
    }

    try {
      const { supabase } = await import('@/app/integrations/supabase/client');
      const { error } = await supabase
        .from('communication_schedules')
        .insert({
          message: newMessage.trim(),
          schedule_time: newScheduleTime,
          schedule_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          is_active: true
        });

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Communication schedule added successfully!');
      setNewMessage('');
      setNewScheduleTime('09:00');
      await loadCommunicationSchedules();
    } catch (error) {
      console.error('Error adding communication schedule:', error);
      Alert.alert('Error', 'Failed to add communication schedule.');
    }
  }, [newMessage, newScheduleTime, loadCommunicationSchedules]);

  const handleDeleteCommunicationSchedule = useCallback(async (scheduleId: string) => {
    try {
      const { supabase } = await import('@/app/integrations/supabase/client');
      const { error } = await supabase
        .from('communication_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Communication schedule deleted successfully!');
      await loadCommunicationSchedules();
    } catch (error) {
      console.error('Error deleting communication schedule:', error);
      Alert.alert('Error', 'Failed to delete communication schedule.');
    }
  }, [loadCommunicationSchedules]);

  // Test Data Generation
  const handleGenerateTestData = useCallback(async () => {
    Alert.alert(
      'Generate Test Data',
      'This will populate all shops with test check-in data based on the provided data. This may take a few moments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              await generateTestCheckIns();
              Alert.alert('Success', 'Test data generated successfully!');
            } catch (error) {
              console.error('Error generating test data:', error);
              Alert.alert('Error', 'Failed to generate test data.');
            }
          }
        }
      ]
    );
  }, [generateTestCheckIns]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {!isAuthenticated ? (
          <View style={styles.authContainer}>
            <GlassView style={[
              styles.authCard,
              Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
            ]} glassEffectStyle="regular">
              <IconSymbol name="lock.fill" size={48} color={theme.colors.primary} />
              <Text style={[styles.authTitle, { color: theme.colors.text }]}>
                Master Setup Access
              </Text>
              <Text style={[styles.authSubtitle, { color: theme.dark ? '#98989D' : '#666' }]}>
                Enter password to access master configuration
              </Text>
              
              <TextInput
                style={[styles.passwordInput, { 
                  color: theme.colors.text,
                  borderColor: theme.dark ? '#333' : '#ddd',
                  backgroundColor: theme.dark ? '#222' : '#fff'
                }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={theme.dark ? '#666' : '#999'}
                secureTextEntry
                onSubmitEditing={handlePasswordSubmit}
                autoFocus
              />
              
              <View style={styles.authButtons}>
                <Button onPress={handlePasswordSubmit} variant="primary" style={styles.authButton}>
                  Access Setup
                </Button>
                <Button onPress={onClose} variant="secondary" style={styles.authButton}>
                  Cancel
                </Button>
              </View>
            </GlassView>
          </View>
        ) : (
          <View style={styles.setupContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                Master Setup
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <IconSymbol name="xmark" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'shops' && styles.activeTab,
                  { borderBottomColor: activeTab === 'shops' ? theme.colors.primary : 'transparent' }
                ]}
                onPress={() => setActiveTab('shops')}
              >
                <Text style={[
                  styles.tabText,
                  { color: activeTab === 'shops' ? theme.colors.primary : theme.dark ? '#666' : '#999' }
                ]}>
                  Shops ({setupData?.shops.length || 0})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'districts' && styles.activeTab,
                  { borderBottomColor: activeTab === 'districts' ? theme.colors.primary : 'transparent' }
                ]}
                onPress={() => setActiveTab('districts')}
              >
                <Text style={[
                  styles.tabText,
                  { color: activeTab === 'districts' ? theme.colors.primary : theme.dark ? '#666' : '#999' }
                ]}>
                  Districts ({setupData?.districts.length || 0})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'goals' && styles.activeTab,
                  { borderBottomColor: activeTab === 'goals' ? theme.colors.primary : 'transparent' }
                ]}
                onPress={() => setActiveTab('goals')}
              >
                <Text style={[
                  styles.tabText,
                  { color: activeTab === 'goals' ? theme.colors.primary : theme.dark ? '#666' : '#999' }
                ]}>
                  KPI Goals
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.content} 
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
            >
              {activeTab === 'shops' ? (
                <View style={styles.tabContent}>
                  {/* Add New Shop */}
                  <GlassView style={[
                    styles.section,
                    Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                  ]} glassEffectStyle="regular">
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      Add New Shop
                    </Text>
                    
                    <View style={styles.shopFormContainer}>
                      <View style={styles.shopFormRow}>
                        <View style={styles.shopNumberContainer}>
                          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Shop Number</Text>
                          <TextInput
                            style={[styles.input, styles.shopNumberInput, { 
                              color: theme.colors.text,
                              borderColor: theme.dark ? '#333' : '#ddd',
                              backgroundColor: theme.dark ? '#222' : '#fff'
                            }]}
                            value={newShopNumber}
                            onChangeText={setNewShopNumber}
                            placeholder="Shop #"
                            placeholderTextColor={theme.dark ? '#666' : '#999'}
                            keyboardType="numeric"
                          />
                        </View>
                        
                        <View style={styles.shopNameContainer}>
                          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Shop Name</Text>
                          <TextInput
                            style={[styles.input, styles.shopNameInput, { 
                              color: theme.colors.text,
                              borderColor: theme.dark ? '#333' : '#ddd',
                              backgroundColor: theme.dark ? '#222' : '#fff'
                            }]}
                            value={newShopName}
                            onChangeText={setNewShopName}
                            placeholder="Enter shop name"
                            placeholderTextColor={theme.dark ? '#666' : '#999'}
                            multiline={false}
                          />
                        </View>
                      </View>
                      
                      <Button onPress={handleAddShop} variant="primary" style={styles.addButton}>
                        Add Shop
                      </Button>
                    </View>
                  </GlassView>

                  {/* Shops List */}
                  <GlassView style={[
                    styles.section,
                    Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                  ]} glassEffectStyle="regular">
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      Shops ({sortedShops.length}) - Sorted by Shop Number
                    </Text>
                    
                    {sortedShops.map((shop) => {
                      const isAssignedToDistrict = setupData?.districts.some(district => 
                        district.shopIds.includes(shop.id)
                      );
                      
                      return (
                        <View key={shop.id} style={[styles.listItem, { 
                          borderBottomColor: theme.dark ? '#333' : '#eee',
                          opacity: shop.isActive ? 1 : 0.5
                        }]}>
                          {editingShop?.id === shop.id ? (
                            <View style={styles.editRow}>
                              <Text style={[styles.shopNumber, { color: theme.colors.text }]}>
                                #{shop.number}
                              </Text>
                              <TextInput
                                style={[styles.editInput, { 
                                  color: theme.colors.text,
                                  borderColor: theme.dark ? '#333' : '#ddd',
                                  backgroundColor: theme.dark ? '#222' : '#fff'
                                }]}
                                value={editShopName}
                                onChangeText={setEditShopName}
                                placeholder="Shop Name"
                                placeholderTextColor={theme.dark ? '#666' : '#999'}
                              />
                              <View style={styles.editButtons}>
                                <TouchableOpacity onPress={handleSaveShopEdit} style={[styles.iconButton, styles.saveButton]}>
                                  <IconSymbol name="checkmark" size={16} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setEditingShop(null)} style={[styles.iconButton, styles.cancelButton]}>
                                  <IconSymbol name="xmark" size={16} color="white" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          ) : (
                            <View style={styles.itemRow}>
                              <View style={styles.itemInfo}>
                                <Text style={[styles.shopNumber, { color: theme.colors.text }]}>
                                  #{shop.number}
                                </Text>
                                <Text style={[styles.shopName, { color: theme.colors.text }]}>
                                  {shop.name || 'Name Here'}
                                </Text>
                                {isAssignedToDistrict && (
                                  <Text style={[styles.assignmentStatus, { color: theme.colors.primary }]}>
                                    Assigned to District
                                  </Text>
                                )}
                              </View>
                              <View style={styles.itemActions}>
                                <Switch
                                  value={shop.isActive}
                                  onValueChange={(value) => handleToggleShop(shop.id, shop.isActive)}
                                  trackColor={{ false: theme.dark ? '#333' : '#ccc', true: theme.colors.primary }}
                                />
                                <TouchableOpacity onPress={() => handleEditShop(shop)} style={styles.iconButton}>
                                  <IconSymbol name="pencil" size={16} color={theme.colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                  onPress={() => {
                                    console.log('Trash icon pressed for shop:', shop);
                                    if (!isAssignedToDistrict) {
                                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    }
                                    handleDeleteShop(shop);
                                  }} 
                                  style={[
                                    styles.iconButton,
                                    !isAssignedToDistrict && styles.deleteButton,
                                    isAssignedToDistrict && { opacity: 0.3, backgroundColor: 'rgba(239, 68, 68, 0.3)' }
                                  ]}
                                  disabled={isAssignedToDistrict}
                                  activeOpacity={0.7}
                                >
                                  <IconSymbol name="trash" size={16} color={isAssignedToDistrict ? "#ef4444" : "white"} />
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </GlassView>

                  {/* Unassigned shops section */}
                  {unassignedShops.length > 0 && (
                    <GlassView style={[
                      styles.section,
                      Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 193, 7, 0.05)' }
                    ]} glassEffectStyle="regular">
                      <View style={styles.unassignedHeader}>
                        <IconSymbol name="exclamationmark.triangle" size={20} color="#f59e0b" />
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                          Unassigned Shops ({unassignedShops.length})
                        </Text>
                      </View>
                      <Text style={[styles.unassignedDescription, { color: theme.dark ? '#98989D' : '#666' }]}>
                        These shops are not assigned to any district and can be safely deleted.
                      </Text>
                      
                      {unassignedShops.map((shop) => (
                        <View key={shop.id} style={[styles.listItem, { 
                          borderBottomColor: theme.dark ? '#333' : '#eee',
                          backgroundColor: theme.dark ? 'rgba(255, 193, 7, 0.05)' : 'rgba(255, 193, 7, 0.02)'
                        }]}>
                          <View style={styles.itemRow}>
                            <View style={styles.itemInfo}>
                              <Text style={[styles.shopNumber, { color: theme.colors.text }]}>
                                #{shop.number}
                              </Text>
                              <Text style={[styles.shopName, { color: theme.colors.text }]}>
                                {shop.name || 'Name Here'}
                              </Text>
                            </View>
                            <View style={styles.itemActions}>
                              <TouchableOpacity onPress={() => handleEditShop(shop)} style={styles.iconButton}>
                                <IconSymbol name="pencil" size={16} color={theme.colors.primary} />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                onPress={() => {
                                  console.log('Trash icon pressed for unassigned shop:', shop);
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                  handleDeleteShop(shop);
                                }} 
                                style={[styles.iconButton, styles.deleteButton]}
                                activeOpacity={0.7}
                              >
                                <IconSymbol name="trash" size={16} color="white" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))}
                    </GlassView>
                  )}
                </View>
              ) : activeTab === 'districts' ? (
                <View style={styles.tabContent}>
                  {/* Add New District */}
                  <GlassView style={[
                    styles.section,
                    Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                  ]} glassEffectStyle="regular">
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      Add New District
                    </Text>
                    
                    <TextInput
                      style={[styles.input, { 
                        color: theme.colors.text,
                        borderColor: theme.dark ? '#333' : '#ddd',
                        backgroundColor: theme.dark ? '#222' : '#fff'
                      }]}
                      value={newDistrictName}
                      onChangeText={setNewDistrictName}
                      placeholder="District Name"
                      placeholderTextColor={theme.dark ? '#666' : '#999'}
                    />
                    
                    <Button onPress={handleAddDistrict} variant="primary" style={styles.addButton}>
                      Add District
                    </Button>
                  </GlassView>

                  {/* Districts List */}
                  <GlassView style={[
                    styles.section,
                    Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                  ]} glassEffectStyle="regular">
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      Districts ({setupData?.districts.length || 0})
                    </Text>
                    
                    {setupData?.districts.map((district) => (
                      <View key={district.id} style={[styles.listItem, { 
                        borderBottomColor: theme.dark ? '#333' : '#eee',
                        opacity: district.isActive ? 1 : 0.5
                      }]}>
                        {editingDistrict?.id === district.id ? (
                          <View style={styles.editDistrictContainer}>
                            <TextInput
                              style={[styles.editInput, { 
                                color: theme.colors.text,
                                borderColor: theme.dark ? '#333' : '#ddd',
                                backgroundColor: theme.dark ? '#222' : '#fff'
                              }]}
                              value={editDistrictName}
                              onChangeText={setEditDistrictName}
                              placeholder="District Name"
                              placeholderTextColor={theme.dark ? '#666' : '#999'}
                            />
                            
                            <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>
                              Assign Shops (sorted by shop number):
                            </Text>
                            
                            <View style={styles.shopsGrid}>
                              {activeShops.map((shop) => (
                                <TouchableOpacity
                                  key={shop.id}
                                  style={[
                                    styles.shopChip,
                                    selectedShopsForDistrict.includes(shop.id) && styles.selectedShopChip,
                                    { 
                                      borderColor: selectedShopsForDistrict.includes(shop.id) ? theme.colors.primary : theme.dark ? '#333' : '#ddd',
                                      backgroundColor: selectedShopsForDistrict.includes(shop.id) ? theme.colors.primary : theme.dark ? '#222' : '#fff'
                                    }
                                  ]}
                                  onPress={() => handleToggleShopInDistrict(shop.id)}
                                >
                                  <Text style={[
                                    styles.shopChipText,
                                    { color: selectedShopsForDistrict.includes(shop.id) ? 'white' : theme.colors.text }
                                  ]}>
                                    #{shop.number}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                            
                            <View style={styles.editButtons}>
                              <TouchableOpacity onPress={handleSaveDistrictEdit} style={[styles.iconButton, styles.saveButton]}>
                                <IconSymbol name="checkmark" size={16} color="white" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => setEditingDistrict(null)} style={[styles.iconButton, styles.cancelButton]}>
                                <IconSymbol name="xmark" size={16} color="white" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.itemRow}>
                            <View style={styles.itemInfo}>
                              <Text style={[styles.districtName, { color: theme.colors.text }]}>
                                {district.name}
                              </Text>
                              <Text style={[styles.shopCount, { color: theme.dark ? '#666' : '#999' }]}>
                                {district.shopIds.length} shops
                              </Text>
                              <View style={styles.districtShopsPreview}>
                                {district.shopIds.slice(0, 5).map((shopId) => {
                                  const shop = setupData?.shops.find(s => s.id === shopId);
                                  return shop ? (
                                    <Text key={shopId} style={[styles.shopPreviewNumber, { color: theme.colors.primary }]}>
                                      #{shop.number}
                                    </Text>
                                  ) : null;
                                })}
                                {district.shopIds.length > 5 && (
                                  <Text style={[styles.moreShopsText, { color: theme.dark ? '#666' : '#999' }]}>
                                    +{district.shopIds.length - 5} more
                                  </Text>
                                )}
                              </View>
                            </View>
                            <View style={styles.itemActions}>
                              <TouchableOpacity onPress={() => handleEditDistrict(district)} style={styles.iconButton}>
                                <IconSymbol name="pencil" size={16} color={theme.colors.primary} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteDistrict(district)} style={styles.iconButton}>
                                <IconSymbol name="trash" size={16} color="#ef4444" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    ))}
                  </GlassView>
                </View>
              ) : (
                // KPI Goals Tab
                <View style={styles.tabContent}>
                  {/* KPI Goals Section */}
                  <GlassView style={[
                    styles.section,
                    Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                  ]} glassEffectStyle="regular">
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      KPI Goals
                    </Text>
                    <Text style={[styles.goalsDescription, { color: theme.dark ? '#98989D' : '#666' }]}>
                      Set percentage goals for KPI metrics. These are used for ranking and outlier detection.
                    </Text>
                    
                    <View style={styles.goalsGrid}>
                      <View style={styles.goalRow}>
                        <View style={styles.goalItem}>
                          <Text style={[styles.goalLabel, { color: theme.colors.text }]}>Big 4 (%)</Text>
                          <TextInput
                            style={[styles.goalInput, { 
                              color: theme.colors.text,
                              borderColor: theme.dark ? '#333' : '#ddd',
                              backgroundColor: theme.dark ? '#222' : '#fff'
                            }]}
                            value={goalsBig4}
                            onChangeText={setGoalsBig4}
                            placeholder="0"
                            placeholderTextColor={theme.dark ? '#666' : '#999'}
                            keyboardType="numeric"
                          />
                        </View>
                        
                        <View style={styles.goalItem}>
                          <Text style={[styles.goalLabel, { color: theme.colors.text }]}>Coolants (%)</Text>
                          <TextInput
                            style={[styles.goalInput, { 
                              color: theme.colors.text,
                              borderColor: theme.dark ? '#333' : '#ddd',
                              backgroundColor: theme.dark ? '#222' : '#fff'
                            }]}
                            value={goalsCoolants}
                            onChangeText={setGoalsCoolants}
                            placeholder="0"
                            placeholderTextColor={theme.dark ? '#666' : '#999'}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                      
                      <View style={styles.goalRow}>
                        <View style={styles.goalItem}>
                          <Text style={[styles.goalLabel, { color: theme.colors.text }]}>Diffs (%)</Text>
                          <TextInput
                            style={[styles.goalInput, { 
                              color: theme.colors.text,
                              borderColor: theme.dark ? '#333' : '#ddd',
                              backgroundColor: theme.dark ? '#222' : '#fff'
                            }]}
                            value={goalsDiffs}
                            onChangeText={setGoalsDiffs}
                            placeholder="0"
                            placeholderTextColor={theme.dark ? '#666' : '#999'}
                            keyboardType="numeric"
                          />
                        </View>
                        
                        <View style={styles.goalItem}>
                          <Text style={[styles.goalLabel, { color: theme.colors.text }]}>Mobil1 (%)</Text>
                          <TextInput
                            style={[styles.goalInput, { 
                              color: theme.colors.text,
                              borderColor: theme.dark ? '#333' : '#ddd',
                              backgroundColor: theme.dark ? '#222' : '#fff'
                            }]}
                            value={goalsMobil1}
                            onChangeText={setGoalsMobil1}
                            placeholder="0"
                            placeholderTextColor={theme.dark ? '#666' : '#999'}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                    </View>
                    
                    <Button onPress={handleSaveKPIGoals} variant="primary" style={styles.saveGoalsButton}>
                      Save KPI Goals
                    </Button>
                  </GlassView>

                  {/* Communication Schedule Section */}
                  <GlassView style={[
                    styles.section,
                    Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                  ]} glassEffectStyle="regular">
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      Communication Schedule
                    </Text>
                    <Text style={[styles.goalsDescription, { color: theme.dark ? '#98989D' : '#666' }]}>
                      Schedule messages to appear as pop-ups when users open the app.
                    </Text>
                    
                    {/* Add New Schedule */}
                    <View style={styles.scheduleForm}>
                      <TextInput
                        style={[styles.input, { 
                          color: theme.colors.text,
                          borderColor: theme.dark ? '#333' : '#ddd',
                          backgroundColor: theme.dark ? '#222' : '#fff',
                          marginBottom: 12
                        }]}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Enter message"
                        placeholderTextColor={theme.dark ? '#666' : '#999'}
                        multiline
                      />
                      
                      <View style={styles.timeInputContainer}>
                        <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Schedule Time:</Text>
                        <TextInput
                          style={[styles.timeInput, { 
                            color: theme.colors.text,
                            borderColor: theme.dark ? '#333' : '#ddd',
                            backgroundColor: theme.dark ? '#222' : '#fff'
                          }]}
                          value={newScheduleTime}
                          onChangeText={setNewScheduleTime}
                          placeholder="09:00"
                          placeholderTextColor={theme.dark ? '#666' : '#999'}
                        />
                      </View>
                      
                      <Button onPress={handleAddCommunicationSchedule} variant="primary" style={styles.addButton}>
                        Add Schedule
                      </Button>
                    </View>

                    {/* Existing Schedules */}
                    {communicationSchedules.length > 0 && (
                      <View style={styles.schedulesList}>
                        <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>
                          Scheduled Messages ({communicationSchedules.length})
                        </Text>
                        
                        {communicationSchedules.map((schedule) => (
                          <View key={schedule.id} style={[styles.scheduleItem, { 
                            borderColor: theme.dark ? '#333' : '#eee',
                            backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                          }]}>
                            <View style={styles.scheduleContent}>
                              <Text style={[styles.scheduleMessage, { color: theme.colors.text }]}>
                                {schedule.message}
                              </Text>
                              <Text style={[styles.scheduleTime, { color: theme.dark ? '#98989D' : '#666' }]}>
                                Daily at {schedule.schedule_time}
                              </Text>
                            </View>
                            <TouchableOpacity 
                              onPress={() => handleDeleteCommunicationSchedule(schedule.id)}
                              style={[styles.iconButton, styles.deleteButton]}
                            >
                              <IconSymbol name="trash" size={16} color="white" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </GlassView>

                  {/* Test Data Section */}
                  <GlassView style={[
                    styles.section,
                    Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)' }
                  ]} glassEffectStyle="regular">
                    <View style={styles.testDataHeader}>
                      <IconSymbol name="flask" size={20} color="#22c55e" />
                      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Test Data Generation
                      </Text>
                    </View>
                    <Text style={[styles.goalsDescription, { color: theme.dark ? '#98989D' : '#666' }]}>
                      Generate test check-in data for all shops based on the provided data. This will populate all 4 check-in time slots with realistic data.
                    </Text>
                    
                    <Button onPress={handleGenerateTestData} variant="secondary" style={styles.testDataButton}>
                      Generate Test Data
                    </Button>
                  </GlassView>
                  
                  {/* Current KPI Goals Display */}
                  {setupData?.metricGoals && (
                    <GlassView style={[
                      styles.section,
                      Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)' }
                    ]} glassEffectStyle="regular">
                      <View style={styles.currentGoalsHeader}>
                        <IconSymbol name="target" size={20} color="#22c55e" />
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                          Current KPI Goals
                        </Text>
                      </View>
                      
                      <View style={styles.currentGoalsGrid}>
                        <View style={styles.currentGoalItem}>
                          <Text style={[styles.currentGoalLabel, { color: theme.dark ? '#98989D' : '#666' }]}>Big 4</Text>
                          <Text style={[styles.currentGoalValue, { color: theme.colors.text }]}>{setupData.metricGoals.big4}%</Text>
                        </View>
                        <View style={styles.currentGoalItem}>
                          <Text style={[styles.currentGoalLabel, { color: theme.dark ? '#98989D' : '#666' }]}>Coolants</Text>
                          <Text style={[styles.currentGoalValue, { color: theme.colors.text }]}>{setupData.metricGoals.coolants}%</Text>
                        </View>
                        <View style={styles.currentGoalItem}>
                          <Text style={[styles.currentGoalLabel, { color: theme.dark ? '#98989D' : '#666' }]}>Diffs</Text>
                          <Text style={[styles.currentGoalValue, { color: theme.colors.text }]}>{setupData.metricGoals.diffs}%</Text>
                        </View>
                        <View style={styles.currentGoalItem}>
                          <Text style={[styles.currentGoalLabel, { color: theme.dark ? '#98989D' : '#666' }]}>Mobil1</Text>
                          <Text style={[styles.currentGoalValue, { color: theme.colors.text }]}>{setupData.metricGoals.mobil1}%</Text>
                        </View>
                      </View>
                    </GlassView>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authCard: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  passwordInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  authButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  authButton: {
    flex: 1,
  },
  setupContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    alignItems: 'center',
  },
  activeTab: {
    // Active tab styling handled by borderBottomColor
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tabContent: {
    gap: 16,
  },
  section: {
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 12,
  },
  shopFormContainer: {
    gap: 16,
  },
  shopFormRow: {
    flexDirection: 'row',
    gap: 12,
  },
  shopNumberContainer: {
    flex: 1,
  },
  shopNameContainer: {
    flex: 2,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  shopNumberInput: {
    // Specific styling for shop number input
  },
  shopNameInput: {
    // Specific styling for shop name input
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  addButton: {
    alignSelf: 'flex-start',
  },
  listItem: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  shopName: {
    fontSize: 14,
    marginTop: 2,
  },
  assignmentStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  districtName: {
    fontSize: 16,
    fontWeight: '600',
  },
  shopCount: {
    fontSize: 14,
    marginTop: 2,
  },
  districtShopsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
    alignItems: 'center',
  },
  shopPreviewNumber: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreShopsText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editDistrictContainer: {
    gap: 12,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  saveButton: {
    backgroundColor: '#22c55e',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  shopsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shopChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  selectedShopChip: {
    // Selected styling handled by backgroundColor and borderColor
  },
  shopChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  unassignedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  unassignedDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  goalsDescription: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  goalsGrid: {
    gap: 16,
    marginBottom: 20,
  },
  goalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  goalItem: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  goalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveGoalsButton: {
    alignSelf: 'flex-start',
  },
  // Communication Schedule styles
  scheduleForm: {
    marginBottom: 20,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    width: 80,
  },
  schedulesList: {
    marginTop: 20,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 12,
  },
  // Test Data styles
  testDataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  testDataButton: {
    alignSelf: 'flex-start',
  },
  currentGoalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  currentGoalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  currentGoalItem: {
    alignItems: 'center',
    minWidth: '30%',
    flex: 1,
  },
  currentGoalLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  currentGoalValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
