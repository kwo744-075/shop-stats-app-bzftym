
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import Button from '@/components/button';
import { Shop } from '@/types/HierarchyData';
import { useHierarchyData } from '@/hooks/useHierarchyData';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';

interface HierarchySetupProps {
  onClose?: () => void;
}

export default function HierarchySetup({ onClose }: HierarchySetupProps) {
  const theme = useTheme();
  const { hierarchy, updateDistrictManager, updateShop, toggleShopActive, resetToDefaults } = useHierarchyData();
  const [editingDM, setEditingDM] = useState(false);
  const [editingShop, setEditingShop] = useState<string | null>(null);
  const [dmName, setDmName] = useState(hierarchy?.districtManagerName || '');
  const [shopName, setShopName] = useState('');

  const { triggerUpdate } = useAutoUpdate({
    onUpdateAvailable: () => {
      Alert.alert(
        'Data Updated',
        'Shop hierarchy has been updated on another device.',
        [{ text: 'OK' }]
      );
    },
  });

  const handleSaveDMName = async () => {
    if (dmName.trim()) {
      const success = await updateDistrictManager(dmName.trim());
      if (success) {
        setEditingDM(false);
        await triggerUpdate(); // Notify other devices
        Alert.alert('Success', 'District Manager name updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update District Manager name');
      }
    }
  };

  const handleEditShop = (shop: Shop) => {
    setEditingShop(shop.id);
    setShopName(shop.name);
  };

  const handleSaveShopName = async (shopId: string) => {
    if (shopName.trim()) {
      const success = await updateShop(shopId, { name: shopName.trim() });
      if (success) {
        setEditingShop(null);
        setShopName('');
        await triggerUpdate(); // Notify other devices
        Alert.alert('Success', 'Shop name updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update shop name');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingShop(null);
    setEditingDM(false);
    setShopName('');
    setDmName(hierarchy?.districtManagerName || '');
  };

  const handleToggleShop = async (shopId: string) => {
    const success = await toggleShopActive(shopId);
    if (success) {
      await triggerUpdate(); // Notify other devices
    } else {
      Alert.alert('Error', 'Failed to update shop status');
    }
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'This will reset all shop names to their default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const success = await resetToDefaults();
            if (success) {
              await triggerUpdate(); // Notify other devices
              Alert.alert('Success', 'Shop hierarchy reset to defaults');
            } else {
              Alert.alert('Error', 'Failed to reset hierarchy');
            }
          },
        },
      ]
    );
  };

  const handlePushUpdate = async () => {
    await triggerUpdate();
    Alert.alert(
      'Update Pushed',
      'All connected devices will be notified of the hierarchy changes.',
      [{ text: 'OK' }]
    );
  };

  if (!hierarchy) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading hierarchy data...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Shop Hierarchy Setup
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* District Manager Section */}
        <GlassView style={styles.section} glassEffectStyle="regular">
          <View style={styles.sectionHeader}>
            <IconSymbol name="person.fill" size={20} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              District Manager
            </Text>
          </View>

          {editingDM ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.textInput, { 
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                }]}
                value={dmName}
                onChangeText={setDmName}
                placeholder="Enter District Manager name"
                placeholderTextColor={theme.dark ? '#666' : '#999'}
                autoFocus
              />
              <View style={styles.editButtons}>
                <Button onPress={handleSaveDMName} variant="primary" size="sm">
                  Save
                </Button>
                <Button onPress={handleCancelEdit} variant="secondary" size="sm">
                  Cancel
                </Button>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.editableItem}
              onPress={() => setEditingDM(true)}
            >
              <Text style={[styles.itemText, { color: theme.colors.text }]}>
                {hierarchy.districtManagerName}
              </Text>
              <IconSymbol name="pencil" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </GlassView>

        {/* Shops Section */}
        <GlassView style={styles.section} glassEffectStyle="regular">
          <View style={styles.sectionHeader}>
            <IconSymbol name="house.fill" size={20} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Shops (1-12)
            </Text>
          </View>

          {hierarchy.shops.map((shop) => (
            <View key={shop.id} style={[styles.shopItem, { 
              borderBottomColor: theme.dark ? '#333' : '#eee' 
            }]}>
              <View style={styles.shopInfo}>
                <Text style={[styles.shopNumber, { color: theme.dark ? '#666' : '#999' }]}>
                  #{shop.number}
                </Text>
                
                {editingShop === shop.id ? (
                  <View style={styles.shopEditContainer}>
                    <TextInput
                      style={[styles.shopTextInput, { 
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                      }]}
                      value={shopName}
                      onChangeText={setShopName}
                      placeholder="Enter shop name"
                      placeholderTextColor={theme.dark ? '#666' : '#999'}
                      autoFocus
                    />
                    <View style={styles.shopEditButtons}>
                      <TouchableOpacity 
                        onPress={() => handleSaveShopName(shop.id)}
                        style={[styles.iconButton, { backgroundColor: theme.colors.primary }]}
                      >
                        <IconSymbol name="checkmark" size={16} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={handleCancelEdit}
                        style={[styles.iconButton, { backgroundColor: '#ef4444' }]}
                      >
                        <IconSymbol name="xmark" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.shopNameContainer}
                    onPress={() => handleEditShop(shop)}
                  >
                    <Text style={[styles.shopName, { color: theme.colors.text }]}>
                      {shop.name}
                    </Text>
                    <IconSymbol name="pencil" size={14} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.shopControls}>
                <Text style={[styles.activeLabel, { color: theme.dark ? '#666' : '#999' }]}>
                  Active
                </Text>
                <Switch
                  value={shop.isActive}
                  onValueChange={() => handleToggleShop(shop.id)}
                  trackColor={{ false: '#767577', true: theme.colors.primary }}
                  thumbColor={shop.isActive ? '#fff' : '#f4f3f4'}
                />
              </View>
            </View>
          ))}
        </GlassView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button 
            onPress={handleResetDefaults} 
            variant="secondary" 
            style={styles.actionButton}
          >
            Reset to Defaults
          </Button>
          <Button 
            onPress={handlePushUpdate} 
            variant="primary" 
            style={styles.actionButton}
          >
            Push Update to All Devices
          </Button>
        </View>

        {/* Info Section */}
        <GlassView style={styles.infoSection} glassEffectStyle="regular">
          <View style={styles.infoHeader}>
            <IconSymbol name="info.circle.fill" size={20} color={theme.colors.primary} />
            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
              Auto-Update Information
            </Text>
          </View>
          <Text style={[styles.infoText, { color: theme.dark ? '#666' : '#999' }]}>
            Changes made here will automatically sync across all connected devices. 
            The app checks for updates every 30 seconds and when brought to the foreground.
          </Text>
          <Text style={[styles.infoText, { color: theme.dark ? '#666' : '#999' }]}>
            Last updated: {new Date(hierarchy.lastUpdated).toLocaleString()}
          </Text>
        </GlassView>
      </ScrollView>
    </View>
  );
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 50,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editContainer: {
    gap: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editableItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  shopItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  shopInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopNumber: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 24,
  },
  shopEditContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopTextInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
  },
  shopEditButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopNameContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '500',
  },
  shopControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeLabel: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  infoSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});
