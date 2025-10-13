
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useHierarchyData } from "@/hooks/useHierarchyData";
import { useTheme } from "@react-navigation/native";
import { useCheckInData } from "@/hooks/useCheckInData";
import { useMasterSetup } from "@/hooks/useMasterSetup";
import DashboardCard from "@/components/DashboardCard";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, View, Text, Platform, Switch, TouchableOpacity, Image, RefreshControl } from "react-native";
import { scheduleCheckInNotifications } from "@/utils/notificationService";
import { GlassView } from "expo-glass-effect";
import { IconSymbol } from "@/components/IconSymbol";
import { Stack, Link } from "expo-router";
import FloatingChatButton from "@/components/FloatingChatButton";
import { useNavigationContext } from "@/contexts/NavigationContext";
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
});

export default function HomeScreen() {
  const { hasInitialized, navigationLoading } = useNavigationContext();
  const { hierarchy, loading: hierarchyLoading, refreshHierarchy } = useHierarchyData();
  const [refreshing, setRefreshing] = useState(false);
  const [showOutliers, setShowOutliers] = useState(false);
  const [setupNotifications, setSetupNotifications] = useState(false);
  const theme = useTheme();
  const { checkInData, loading: checkInLoading, refreshCheckInData } = useCheckInData();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const { setupData, loading: setupLoading } = useMasterSetup();

  // Memoize outlier calculations
  const outliers = useMemo(() => {
    if (!checkInData || !setupData?.metricGoals || !hierarchy?.shops) {
      return [];
    }

    const shopDataMap = new Map(
      Object.entries(checkInData).map(([shopId, data]) => [shopId, data])
    );

    const allShops = hierarchy.shops.map(shop => ({
      id: shop.id,
      number: shop.number,
      name: shop.name
    }));

    return calculateAllOutliers(shopDataMap, setupData.metricGoals, allShops);
  }, [checkInData, setupData?.metricGoals, hierarchy?.shops]);

  // Setup notifications on first load
  useEffect(() => {
    if (hasInitialized && !navigationLoading && !setupNotifications) {
      console.log('Setting up notifications...');
      scheduleCheckInNotifications();
      setSetupNotifications(true);
    }
  }, [hasInitialized, navigationLoading, setupNotifications]);

  // Auto-refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!refreshing && !hierarchyLoading && !checkInLoading) {
        console.log('Auto-refreshing data...');
        refreshHierarchy();
        refreshCheckInData();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [refreshing, hierarchyLoading, checkInLoading, refreshHierarchy, refreshCheckInData]);

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

  const getCurrentMode = useCallback(() => {
    return showOutliers ? 'outliers' : 'normal';
  }, [showOutliers]);

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

  const renderShopCard = useCallback(({ item: shop }: { item: any }) => {
    const shopData = checkInData?.[shop.id];
    const isOutlier = outliers.some(o => o.shopId === shop.id);
    
    return (
      <View style={styles.cardContainer}>
        <DashboardCard
          key={shop.id}
          shop={shop}
          data={shopData}
          onPress={() => router.push(`/formsheet?shopId=${shop.id}&shopNumber=${shop.number}`)}
        />
        {isOutlier && (
          <View style={styles.outlierBadge}>
            <Text style={styles.outlierBadgeText}>OUTLIER</Text>
          </View>
        )}
      </View>
    );
  }, [checkInData, outliers, router]);

  if (!hasInitialized || navigationLoading) {
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
        ref={flatListRef}
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
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={8}
        getItemLayout={(data, index) => ({
          length: 200, // Approximate height of each card
          offset: 200 * index,
          index,
        })}
      />

      <FloatingChatButton />
    </View>
  );
}
