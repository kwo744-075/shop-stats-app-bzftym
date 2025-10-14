
import { useTheme } from '@react-navigation/native';
import { CheckInItem, ShopCheckIn, CHECK_IN_TIMES, TEMP_OPTIONS, ShopSubmissionStatus } from '@/types/CheckInData';
import { GlassView } from 'expo-glass-effect';
import { useMasterSetup } from '@/hooks/useMasterSetup';
import React, { useState, useEffect, useCallback } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import Button from '@/components/button';
import { useCheckInData } from '@/hooks/useCheckInData';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigationContext } from '@/contexts/NavigationContext';

interface CheckInFormProps {
  onSubmit?: () => void;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  shopSelector: {
    marginBottom: 20,
  },
  shopSelectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  shopInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  shopValidation: {
    fontSize: 14,
    marginTop: 4,
  },
  timeSlotContainer: {
    marginBottom: 24,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeSlotTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  timeSlotToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formGrid: {
    gap: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  temperatureContainer: {
    gap: 8,
  },
  temperatureOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  temperatureOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  temperatureOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 40,
  },
  weeklySummaryContainer: {
    marginBottom: 24,
  },
  weeklySummaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryGrid: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  dailyActionsContainer: {
    marginBottom: 24,
  },
  dailyActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  dailyActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  dailyActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dailyActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// Helper functions
const formatCurrency = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '$0.00';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(numValue) ? '$0.00' : `$${numValue.toFixed(2)}`;
};

const parseCurrencyInput = (value: string | null | undefined): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const formatWholeNumber = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '0';
  const numValue = typeof value === 'string' ? parseInt(value) : value;
  return isNaN(numValue) ? '0' : numValue.toString();
};

export default function CheckInForm({ onSubmit }: CheckInFormProps) {
  const { selectedShopIds } = useNavigationContext();
  const [selectedShopNumber, setSelectedShopNumber] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [show5to8Toggle, setShow5to8Toggle] = useState(false);
  const [checkInData, setCheckInData] = useState<ShopCheckIn>({
    shopId: '',
    shopNumber: 0,
    date: new Date().toISOString().split('T')[0],
    timeSlots: {
      '12:00': { cars: 0, sales: 0, big4: 0, coolants: 0, diffs: 0, donations: 0, mobil1: 0, staffing: 0, temperature: 'green' },
      '14:30': { cars: 0, sales: 0, big4: 0, coolants: 0, diffs: 0, donations: 0, mobil1: 0, staffing: 0, temperature: 'green' },
      '17:00': { cars: 0, sales: 0, big4: 0, coolants: 0, diffs: 0, donations: 0, mobil1: 0, staffing: 0, temperature: 'green' },
      '20:00': { cars: 0, sales: 0, big4: 0, coolants: 0, diffs: 0, donations: 0, mobil1: 0, staffing: 0, temperature: 'green' },
    },
    submissionStatus: {}
  });

  const theme = useTheme();
  const { submitCheckIn, getShopData, getWeeklySummary, loading } = useCheckInData();
  const { setupData } = useMasterSetup();

  // Load shop data when shop is selected
  const loadShopData = useCallback(async () => {
    if (selectedShopNumber && setupData?.shops) {
      const shopNumber = parseInt(selectedShopNumber);
      const shop = setupData.shops.find(s => s.number === shopNumber);
      
      if (shop) {
        const existingData = await getShopData(shop.id);
        if (existingData) {
          setCheckInData(prev => ({
            ...prev,
            shopId: shop.id,
            shopNumber: shop.number,
            timeSlots: existingData.timeSlots || prev.timeSlots,
            submissionStatus: existingData.submissionStatus || {}
          }));
        } else {
          setCheckInData(prev => ({
            ...prev,
            shopId: shop.id,
            shopNumber: shop.number,
          }));
        }
      }
    }
  }, [selectedShopNumber, setupData?.shops, getShopData]);

  const loadWeeklySummary = useCallback(async () => {
    if (checkInData.shopId) {
      const summary = await getWeeklySummary(checkInData.shopId);
      console.log('Weekly summary loaded:', summary);
    }
  }, [checkInData.shopId, getWeeklySummary]);

  useEffect(() => {
    if (selectedShopIds && selectedShopIds.length > 0) {
      const firstShopId = selectedShopIds[0];
      const shop = setupData?.shops.find(s => s.id === firstShopId);
      if (shop) {
        setSelectedShopNumber(shop.number.toString());
      }
    }
  }, [selectedShopIds, setupData?.shops]);

  useEffect(() => {
    if (selectedShopNumber && isVisible) {
      loadShopData();
      loadWeeklySummary();
    }
  }, [selectedShopNumber, isVisible, loadShopData, loadWeeklySummary]);

  useEffect(() => {
    if (show5to8Toggle) {
      loadWeeklySummary();
    }
  }, [show5to8Toggle, loadWeeklySummary]);

  const handleShopNumberValidation = useCallback(() => {
    if (!selectedShopNumber) return;
    
    const shopNumber = parseInt(selectedShopNumber);
    const shop = setupData?.shops.find(s => s.number === shopNumber);
    
    if (!shop) {
      Alert.alert('Invalid Shop', 'Shop number not found. Please enter a valid shop number.');
      return;
    }
    
    if (!shop.isActive) {
      Alert.alert('Inactive Shop', 'This shop is currently inactive. Please contact your manager.');
      return;
    }
    
    loadShopData();
  }, [selectedShopNumber, setupData?.shops, loadShopData]);

  const updateField = useCallback((timeSlot: string, field: keyof CheckInItem, value: string | number) => {
    setCheckInData(prev => ({
      ...prev,
      timeSlots: {
        ...prev.timeSlots,
        [timeSlot]: {
          ...prev.timeSlots[timeSlot],
          [field]: value
        }
      }
    }));
  }, []);

  const handleCurrencyChange = useCallback((timeSlot: string, field: 'sales' | 'donations', text: string) => {
    // Allow typing without formatting
    updateField(timeSlot, field, text);
  }, [updateField]);

  const handleCurrencyBlur = useCallback((timeSlot: string, field: 'sales' | 'donations') => {
    // Format on blur
    const currentValue = checkInData.timeSlots[timeSlot][field];
    const numericValue = parseCurrencyInput(currentValue.toString());
    updateField(timeSlot, field, numericValue);
  }, [checkInData.timeSlots, updateField]);

  const handleWholeNumberChange = useCallback((timeSlot: string, field: 'cars' | 'staffing' | 'big4' | 'coolants' | 'diffs' | 'mobil1', text: string) => {
    // Only allow numeric input
    const numericText = text.replace(/[^0-9]/g, '');
    updateField(timeSlot, field, numericText);
  }, [updateField]);

  const handleWholeNumberBlur = useCallback((timeSlot: string, field: 'cars' | 'staffing' | 'big4' | 'coolants' | 'diffs' | 'mobil1') => {
    // Convert to number on blur
    const currentValue = checkInData.timeSlots[timeSlot][field];
    const numericValue = parseInt(currentValue.toString()) || 0;
    updateField(timeSlot, field, numericValue);
  }, [checkInData.timeSlots, updateField]);

  const getTempColor = (temp: string) => {
    switch (temp) {
      case 'red': return '#ef4444';
      case 'yellow': return '#f59e0b';
      case 'green': return '#22c55e';
      default: return '#22c55e';
    }
  };

  const renderWeeklySummary = () => {
    // This would show weekly totals - placeholder for now
    return (
      <GlassView style={[
        styles.weeklySummaryContainer,
        Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
      ]} glassEffectStyle="regular">
        <Text style={[styles.weeklySummaryTitle, { color: theme.colors.text }]}>
          Weekly Summary
        </Text>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryRow, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
            <Text style={[styles.summaryLabel, { color: theme.colors.text }]}>Total Cars</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>0</Text>
          </View>
          <View style={[styles.summaryRow, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
            <Text style={[styles.summaryLabel, { color: theme.colors.text }]}>Total Sales</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>$0.00</Text>
          </View>
        </View>
      </GlassView>
    );
  };

  const renderTimeSlotForm = (timeSlot: string, displayTime: string) => {
    const data = checkInData.timeSlots[timeSlot];
    const isSubmitted = checkInData.submissionStatus[timeSlot] === 'submitted';
    
    return (
      <GlassView 
        key={timeSlot}
        style={[
          styles.timeSlotContainer,
          Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
        ]} 
        glassEffectStyle="regular"
      >
        <View style={styles.timeSlotHeader}>
          <Text style={[styles.timeSlotTitle, { color: theme.colors.text }]}>
            {displayTime} Check-in
          </Text>
          {isSubmitted && (
            <View style={[styles.timeSlotToggle, { backgroundColor: '#22c55e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }]}>
              <IconSymbol name="checkmark.circle.fill" size={16} color="white" />
              <Text style={[styles.toggleText, { color: 'white' }]}>Submitted</Text>
            </View>
          )}
        </View>

        <View style={styles.formGrid}>
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Cars</Text>
              <TextInput
                style={[styles.fieldInput, { 
                  color: theme.colors.text,
                  borderColor: theme.dark ? '#333' : '#ddd',
                  backgroundColor: theme.dark ? '#222' : '#fff'
                }]}
                value={formatWholeNumber(data.cars)}
                onChangeText={(text) => handleWholeNumberChange(timeSlot, 'cars', text)}
                onBlur={() => handleWholeNumberBlur(timeSlot, 'cars')}
                placeholder="0"
                placeholderTextColor={theme.dark ? '#666' : '#999'}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Sales</Text>
              <TextInput
                style={[styles.fieldInput, { 
                  color: theme.colors.text,
                  borderColor: theme.dark ? '#333' : '#ddd',
                  backgroundColor: theme.dark ? '#222' : '#fff'
                }]}
                value={typeof data.sales === 'number' ? formatCurrency(data.sales) : data.sales.toString()}
                onChangeText={(text) => handleCurrencyChange(timeSlot, 'sales', text)}
                onBlur={() => handleCurrencyBlur(timeSlot, 'sales')}
                placeholder="$0.00"
                placeholderTextColor={theme.dark ? '#666' : '#999'}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Big 4</Text>
              <TextInput
                style={[styles.fieldInput, { 
                  color: theme.colors.text,
                  borderColor: theme.dark ? '#333' : '#ddd',
                  backgroundColor: theme.dark ? '#222' : '#fff'
                }]}
                value={formatWholeNumber(data.big4)}
                onChangeText={(text) => handleWholeNumberChange(timeSlot, 'big4', text)}
                onBlur={() => handleWholeNumberBlur(timeSlot, 'big4')}
                placeholder="0"
                placeholderTextColor={theme.dark ? '#666' : '#999'}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Coolants</Text>
              <TextInput
                style={[styles.fieldInput, { 
                  color: theme.colors.text,
                  borderColor: theme.dark ? '#333' : '#ddd',
                  backgroundColor: theme.dark ? '#222' : '#fff'
                }]}
                value={formatWholeNumber(data.coolants)}
                onChangeText={(text) => handleWholeNumberChange(timeSlot, 'coolants', text)}
                onBlur={() => handleWholeNumberBlur(timeSlot, 'coolants')}
                placeholder="0"
                placeholderTextColor={theme.dark ? '#666' : '#999'}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Diffs</Text>
              <TextInput
                style={[styles.fieldInput, { 
                  color: theme.colors.text,
                  borderColor: theme.dark ? '#333' : '#ddd',
                  backgroundColor: theme.dark ? '#222' : '#fff'
                }]}
                value={formatWholeNumber(data.diffs)}
                onChangeText={(text) => handleWholeNumberChange(timeSlot, 'diffs', text)}
                onBlur={() => handleWholeNumberBlur(timeSlot, 'diffs')}
                placeholder="0"
                placeholderTextColor={theme.dark ? '#666' : '#999'}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Donations</Text>
              <TextInput
                style={[styles.fieldInput, { 
                  color: theme.colors.text,
                  borderColor: theme.dark ? '#333' : '#ddd',
                  backgroundColor: theme.dark ? '#222' : '#fff'
                }]}
                value={typeof data.donations === 'number' ? formatCurrency(data.donations) : data.donations.toString()}
                onChangeText={(text) => handleCurrencyChange(timeSlot, 'donations', text)}
                onBlur={() => handleCurrencyBlur(timeSlot, 'donations')}
                placeholder="$0.00"
                placeholderTextColor={theme.dark ? '#666' : '#999'}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Mobil1</Text>
              <TextInput
                style={[styles.fieldInput, { 
                  color: theme.colors.text,
                  borderColor: theme.dark ? '#333' : '#ddd',
                  backgroundColor: theme.dark ? '#222' : '#fff'
                }]}
                value={formatWholeNumber(data.mobil1)}
                onChangeText={(text) => handleWholeNumberChange(timeSlot, 'mobil1', text)}
                onBlur={() => handleWholeNumberBlur(timeSlot, 'mobil1')}
                placeholder="0"
                placeholderTextColor={theme.dark ? '#666' : '#999'}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Staffing</Text>
              <TextInput
                style={[styles.fieldInput, { 
                  color: theme.colors.text,
                  borderColor: theme.dark ? '#333' : '#ddd',
                  backgroundColor: theme.dark ? '#222' : '#fff'
                }]}
                value={formatWholeNumber(data.staffing)}
                onChangeText={(text) => handleWholeNumberChange(timeSlot, 'staffing', text)}
                onBlur={() => handleWholeNumberBlur(timeSlot, 'staffing')}
                placeholder="0"
                placeholderTextColor={theme.dark ? '#666' : '#999'}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.temperatureContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Temperature</Text>
            <View style={styles.temperatureOptions}>
              {TEMP_OPTIONS.map((temp) => (
                <TouchableOpacity
                  key={temp}
                  style={[
                    styles.temperatureOption,
                    { 
                      backgroundColor: getTempColor(temp),
                      opacity: data.temperature === temp ? 1 : 0.5
                    }
                  ]}
                  onPress={() => updateField(timeSlot, 'temperature', temp)}
                >
                  <Text style={styles.temperatureOptionText}>
                    {temp.charAt(0).toUpperCase() + temp.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </GlassView>
    );
  };

  const handleSubmit = useCallback(async () => {
    if (!checkInData.shopId) {
      Alert.alert('Error', 'Please select a shop first.');
      return;
    }

    try {
      await submitCheckIn(checkInData);
      Alert.alert('Success', 'Check-in data submitted successfully!');
      onSubmit?.();
    } catch (error) {
      console.error('Error submitting check-in:', error);
      Alert.alert('Error', 'Failed to submit check-in data. Please try again.');
    }
  }, [checkInData, submitCheckIn, onSubmit]);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setIsVisible(false)}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Shop Check-in
          </Text>
          <TouchableOpacity onPress={() => setIsVisible(false)} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Shop Selector */}
          <GlassView style={[
            styles.shopSelector,
            Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          ]} glassEffectStyle="regular">
            <Text style={[styles.shopSelectorTitle, { color: theme.colors.text }]}>
              Select Shop
            </Text>
            <TextInput
              style={[styles.shopInput, { 
                color: theme.colors.text,
                borderColor: theme.dark ? '#333' : '#ddd',
                backgroundColor: theme.dark ? '#222' : '#fff'
              }]}
              value={selectedShopNumber}
              onChangeText={setSelectedShopNumber}
              onBlur={handleShopNumberValidation}
              placeholder="Enter shop number"
              placeholderTextColor={theme.dark ? '#666' : '#999'}
              keyboardType="numeric"
            />
            {selectedShopNumber && setupData?.shops.find(s => s.number === parseInt(selectedShopNumber)) && (
              <Text style={[styles.shopValidation, { color: '#22c55e' }]}>
                ✓ Shop {selectedShopNumber} - {setupData.shops.find(s => s.number === parseInt(selectedShopNumber))?.name}
              </Text>
            )}
          </GlassView>

          {/* Weekly Summary */}
          {checkInData.shopId && renderWeeklySummary()}

          {/* Daily Actions */}
          {checkInData.shopId && (
            <GlassView style={[
              styles.dailyActionsContainer,
              Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
            ]} glassEffectStyle="regular">
              <Text style={[styles.dailyActionsTitle, { color: theme.colors.text }]}>
                Daily Actions
              </Text>
              <View style={styles.dailyActionsGrid}>
                <TouchableOpacity 
                  style={[styles.dailyActionButton, { 
                    borderColor: theme.colors.primary,
                    backgroundColor: show5to8Toggle ? theme.colors.primary : 'transparent'
                  }]}
                  onPress={() => setShow5to8Toggle(!show5to8Toggle)}
                >
                  <Text style={[styles.dailyActionButtonText, { 
                    color: show5to8Toggle ? 'white' : theme.colors.primary 
                  }]}>
                    5-8 PM Toggle
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassView>
          )}

          {/* Time Slot Forms */}
          {checkInData.shopId && CHECK_IN_TIMES.map(({ time, display }) => 
            renderTimeSlotForm(time, display)
          )}

          {/* Submit Button */}
          {checkInData.shopId && (
            <Button 
              onPress={handleSubmit} 
              variant="primary" 
              style={styles.submitButton}
              loading={loading}
            >
              Submit All Check-ins
            </Button>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
