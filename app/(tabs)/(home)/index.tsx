
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useHierarchyData } from "@/hooks/useHierarchyData";
import { useTheme } from "@react-navigation/native";
import { useCheckInData } from "@/hooks/useCheckInData";
import { useMasterSetup } from "@/hooks/useMasterSetup";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, View, Text, TouchableOpacity, Image, RefreshControl, Switch } from "react-native";
import { GlassView } from "expo-glass-effect";
import { Stack } from "expo-router";
import FloatingChatButton from "@/components/FloatingChatButton";
import { scheduleCheckInNotifications } from "@/utils/notificationService";
import { calculateAllOutliers } from "@/utils/outlierCalculations";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cardContainer: {
    marginBottom: 16,
  },
  shopCard: {
    padding: 16,
    borderRadius: 12,
    minHeight: 120,
  },
  shopCardHeader: {
    marginBottom: 12,
  },
  shopNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  shopName: {
    fontSize: 14,
    opacity: 0.8,
  },
  shopCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 16,
  },
  modeToggleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  outlierBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  outlierBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  // Hooks
  const { hierarchy, loading: hierarchyLoading, refreshHierarchy } = useHierarchyData();
  const { checkInData, loading: checkInLoading, refreshCheckInData } = useCheckInData();
  const { setupData, loading: setupLoading } = useMasterSetup();
  
  // State
  const [refreshing, setRefreshing] = useState(false);
  const [showOutliers, setShowOutliers] = useState(false);
  const [notificationsSetup, setNotificationsSetup] = useState(false);

  console.log('HomeScreen render - hierarchyLoading:', hierarchyLoading);
  console.log('HomeScreen render - checkInLoading:', checkInLoading);
  console.log('HomeScreen render - setupLoading:', setupLoading);
  console.log('HomeScreen render - hierarchy:', hierarchy ? `loaded with ${hierarchy.shops?.length || 0} shops` : 'null');
  console.log('HomeScreen render - checkInData:', checkInData ? `loaded for ${Object.keys(checkInData).length} shops` : 'null');

  // Setup notifications once
  useEffect(() => {
    if (!notificationsSetup) {
      console.log('HomeScreen: Setting up notifications...');
      try {
        scheduleCheckInNotifications();
        setNotificationsSetup(true);
      } catch (error) {
        console.error('HomeScreen: Error setting up notifications:', error);
        setNotificationsSetup(true); // Still mark as setup to avoid infinite retries
      }
    }
  }, [notificationsSetup]);

  // Calculate outliers
  const outliers = useMemo(() => {
    try {
      if (!checkInData || !setupData?.metricGoals || !hierarchy?.shops) {
        console.log('HomeScreen: Outlier calculation skipped - missing data');
        return [];
      }

      console.log('HomeScreen: Calculating outliers...');
      const shopDataMap = new Map(
        Object.entries(checkInData).map(([shopId, data]) => [shopId, data])
      );

      const allShops = hierarchy.shops.map(shop => ({
        id: shop.id,
        number: shop.number,
        name: shop.name
      }));

      const result = calculateAllOutliers(shopDataMap, setupData.metricGoals, allShops);
      console.log('HomeScreen: Calculated', result.length, 'outliers');
      return result;
    } catch (error) {
      console.error('HomeScreen: Error calculating outliers:', error);
      return [];
    }
  }, [checkInData, setupData?.metricGoals, hierarchy?.shops]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshHierarchy(),
        refreshCheckInData()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshHierarchy, refreshCheckInData]);

  // Get filtered shops
  const getFilteredShops = useCallback(() => {
    if (!hierarchy?.shops) return [];
    
    if (showOutliers) {
      // Show only outlier shops
      const outlierShopIds = new Set(outliers.map(o => o.shopId));
      return hierarchy.shops.filter(shop => outlierShopIds.has(shop.id));
    }
    
    // Show all active shops
    return hierarchy.shops.filter(shop => shop.isActive);
  }, [hierarchy?.shops, showOutliers, outliers]);

  // Shop card renderer
  const renderShopCard = useCallback(({ item: shop }: { item: any }) => {
    const shopData = checkInData?.[shop.id];
    const isOutlier = outliers.some(o => o.shopId === shop.id);
    
    // Calculate totals for display
    const totalSales = shopData?.sales || 0;
    const totalCars = shopData?.cars || 0;
    const totalBig4 = shopData?.big4 || 0;
    
    return (
      <TouchableOpacity 
        style={styles.cardContainer}
        onPress={() => router.push(`/formsheet?shopId=${shop.id}&shopNumber=${shop.number}`)}
      >
        <GlassView 
          style={[
            styles.shopCard,
            { backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }
          ]} 
          glassEffectStyle="regular"
        >
          <View style={styles.shopCardHeader}>
            <Text style={[styles.shopNumber, { color: theme.colors.text }]}>
              Shop #{shop.number}
            </Text>
            <Text style={[styles.shopName, { color: theme.colors.text }]}>
              {shop.name}
            </Text>
          </View>
          
          <View style={styles.shopCardStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {totalCars}
              </Text>
              <Text style={[styles.statLabel, { color: theme.dark ? '#98989D' : '#666' }]}>
                Cars
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                ${totalSales.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: theme.dark ? '#98989D' : '#666' }]}>
                Sales
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {totalBig4}
              </Text>
              <Text style={[styles.statLabel, { color: theme.dark ? '#98989D' : '#666' }]}>
                Big 4
              </Text>
            </View>
          </View>
          
          {isOutlier && (
            <View style={styles.outlierBadge}>
              <Text style={styles.outlierBadgeText}>OUTLIER</Text>
            </View>
          )}
        </GlassView>
      </TouchableOpacity>
    );
  }, [checkInData, outliers, router, theme]);

  // Show loading screen while loading data
  if (hierarchyLoading) {
    console.log('HomeScreen: Showing loading screen');
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Image 
            source={require('@/assets/images/natively-dark.png')} 
            style={{ width: 80, height: 80, opacity: 0.5 }}
          />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading Shop Stats...
          </Text>
        </View>
      </View>
    );
  }

  // Show error state if there's an error loading data
  if (!hierarchy || !hierarchy.shops || hierarchy.shops.length === 0) {
    console.log('HomeScreen: No hierarchy data available');
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            No shop data available. Please check your connection and try again.
          </Text>
        </View>
      </View>
    );
  }

  console.log('HomeScreen: Rendering main content with', hierarchy.shops.length, 'shops');
  
  const filteredShops = getFilteredShops();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: "Shop Stats",
          headerShown: false
        }} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {hierarchy?.districtManagerName || 'District Manager'}
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.text }]}>
          {filteredShops.length} {showOutliers ? 'Outlier' : 'Active'} Shops
        </Text>
      </View>

      {/* Mode Toggle */}
      <GlassView style={styles.modeToggleContainer} glassEffectStyle="regular">
        <Text style={[styles.modeToggleLabel, { color: theme.colors.text }]}>
          Show Outliers Only ({outliers.length})
        </Text>
        <Switch
          value={showOutliers}
          onValueChange={setShowOutliers}
          trackColor={{ false: theme.dark ? '#333' : '#ccc', true: theme.colors.primary }}
        />
      </GlassView>

      {/* Shop Cards */}
      <FlatList
        style={styles.content}
        data={filteredShops}
        renderItem={renderShopCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <FloatingChatButton />
    </View>
  );
}
