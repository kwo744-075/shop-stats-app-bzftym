
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import { GlassView } from 'expo-glass-effect';
import { IconSymbol } from '@/components/IconSymbol';
import { useCheckInData } from '@/hooks/useCheckInData';
import { useMasterSetup } from '@/hooks/useMasterSetup';
import { useHierarchyData } from '@/hooks/useHierarchyData';
import { useNavigationContext } from '@/contexts/NavigationContext';
import { calculateAllOutliers, OutlierResult } from '@/utils/outlierCalculations';
import { CheckInItem } from '@/types/CheckInData';

interface ShopPerformance {
  shopId: string;
  shopNumber: number;
  shopName: string;
  totalScore: number;
  percentageScore: number;
  metrics: {
    cars: number;
    sales: number;
    big4: number;
    coolants: number;
    diffs: number;
    donations: number;
    mobil1: number;
    staffing: number;
    temperatureScore: number;
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100, // Space for floating tab bar
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#888',
    marginLeft: 12,
    marginTop: 4,
  },
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  cardContent: {
    padding: 16,
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  lastShopRow: {
    borderBottomWidth: 0,
  },
  shopInfo: {
    flex: 1,
  },
  shopNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  shopName: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  percentageText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  outlierBadge: {
    backgroundColor: '#f44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  outlierText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  missingMetricsText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 2,
  },
  rankBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  goldBadge: {
    backgroundColor: '#FFD700',
  },
  silverBadge: {
    backgroundColor: '#C0C0C0',
  },
  bronzeBadge: {
    backgroundColor: '#CD7F32',
  },
  showMoreButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  showMoreText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default function RankingsScreen() {
  const { colors } = useTheme();
  const { getCurrentMode, selectedShopIds } = useNavigationContext();
  const { checkInData, loading: checkInLoading, refreshData } = useCheckInData();
  const { setupData, loading: setupLoading } = useMasterSetup();
  const { hierarchy, loading: hierarchyLoading } = useHierarchyData();
  
  const [refreshing, setRefreshing] = useState(false);
  const [showAllPerformers, setShowAllPerformers] = useState(false);
  const [showAllOutliers, setShowAllOutliers] = useState(false);
  const [showFullRankings, setShowFullRankings] = useState(false);

  const currentMode = getCurrentMode();
  const isLoading = checkInLoading || setupLoading || hierarchyLoading;

  // Calculate shop performances
  const shopPerformances = useMemo(() => {
    if (!checkInData || !setupData?.metricGoals || !hierarchy) {
      return [];
    }

    const performances: ShopPerformance[] = [];
    const goals = setupData.metricGoals;

    // Get all shops based on current mode
    const shops = currentMode === 'RD Roll' 
      ? hierarchy.districts.flatMap(d => d.shops)
      : hierarchy.districts.find(d => d.id === currentMode)?.shops || 
        selectedShopIds.map(id => {
          const shop = hierarchy.districts.flatMap(d => d.shops).find(s => s.id === id);
          return shop || { id, number: parseInt(id), name: `Shop ${id}`, isActive: true };
        });

    for (const shop of shops) {
      const shopData = checkInData.get(shop.id);
      
      if (!shopData) {
        // No data - score of 0
        performances.push({
          shopId: shop.id,
          shopNumber: shop.number,
          shopName: shop.name,
          totalScore: 0,
          percentageScore: 0,
          metrics: {
            cars: 0,
            sales: 0,
            big4: 0,
            coolants: 0,
            diffs: 0,
            donations: 0,
            mobil1: 0,
            staffing: 0,
            temperatureScore: 0,
          },
        });
        continue;
      }

      // Calculate performance scores
      const carScore = Math.min(shopData.cars / goals.cars, 1) * 100;
      const salesScore = Math.min(shopData.sales / goals.sales, 1) * 100;
      const big4Score = Math.min(shopData.big4 / goals.big4, 1) * 100;
      const coolantsScore = Math.min(shopData.coolants / goals.coolants, 1) * 100;
      const diffsScore = Math.min(shopData.diffs / goals.diffs, 1) * 100;
      const donationsScore = Math.min(shopData.donations / goals.donations, 1) * 100;
      const mobil1Score = Math.min(shopData.mobil1 / goals.mobil1, 1) * 100;
      const staffingScore = Math.min(shopData.staffing / goals.staffing, 1) * 100;
      
      // Temperature scoring
      let temperatureScore = 0;
      if (goals.temperature === 'green') {
        temperatureScore = shopData.temperature === 'green' ? 100 : shopData.temperature === 'yellow' ? 50 : 0;
      } else if (goals.temperature === 'yellow') {
        temperatureScore = shopData.temperature === 'green' ? 100 : shopData.temperature === 'yellow' ? 100 : 0;
      } else {
        temperatureScore = 100; // Any temperature meets red goal
      }

      const totalScore = (carScore + salesScore + big4Score + coolantsScore + diffsScore + donationsScore + mobil1Score + staffingScore + temperatureScore) / 9;

      performances.push({
        shopId: shop.id,
        shopNumber: shop.number,
        shopName: shop.name,
        totalScore,
        percentageScore: Math.round(totalScore),
        metrics: {
          cars: shopData.cars,
          sales: shopData.sales,
          big4: shopData.big4,
          coolants: shopData.coolants,
          diffs: shopData.diffs,
          donations: shopData.donations,
          mobil1: shopData.mobil1,
          staffing: shopData.staffing,
          temperatureScore,
        },
      });
    }

    return performances.sort((a, b) => b.totalScore - a.totalScore);
  }, [checkInData, setupData?.metricGoals, hierarchy, currentMode, selectedShopIds]);

  // Calculate outliers
  const outliers = useMemo(() => {
    if (!checkInData || !setupData?.metricGoals || !hierarchy) {
      return [];
    }

    const shops = currentMode === 'RD Roll' 
      ? hierarchy.districts.flatMap(d => d.shops)
      : hierarchy.districts.find(d => d.id === currentMode)?.shops || 
        selectedShopIds.map(id => {
          const shop = hierarchy.districts.flatMap(d => d.shops).find(s => s.id === id);
          return shop || { id, number: parseInt(id), name: `Shop ${id}`, isActive: true };
        });

    return calculateAllOutliers(checkInData, setupData.metricGoals, shops);
  }, [checkInData, setupData?.metricGoals, hierarchy, currentMode, selectedShopIds]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.log('Error refreshing rankings data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  const getRankBadgeStyle = (index: number) => {
    if (index === 0) return [styles.rankBadge, styles.goldBadge];
    if (index === 1) return [styles.rankBadge, styles.silverBadge];
    if (index === 2) return [styles.rankBadge, styles.bronzeBadge];
    return styles.rankBadge;
  };

  const renderShopPerformance = (shop: ShopPerformance, index: number, isLast: boolean) => (
    <View key={shop.shopId} style={[styles.shopRow, isLast && styles.lastShopRow]}>
      <View style={styles.shopInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={getRankBadgeStyle(index)}>
            <Text style={styles.rankText}>#{index + 1}</Text>
          </View>
          <Text style={styles.shopNumber}>Shop {shop.shopNumber}</Text>
        </View>
        <Text style={styles.shopName}>{shop.shopName}</Text>
      </View>
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>{shop.percentageScore}%</Text>
        <Text style={styles.percentageText}>Performance</Text>
      </View>
    </View>
  );

  const renderOutlier = (outlier: OutlierResult, index: number, isLast: boolean) => (
    <View key={outlier.shopId} style={[styles.shopRow, isLast && styles.lastShopRow]}>
      <View style={styles.shopInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.shopNumber}>Shop {outlier.shopNumber}</Text>
          <View style={styles.outlierBadge}>
            <Text style={styles.outlierText}>OUTLIER</Text>
          </View>
        </View>
        <Text style={styles.shopName}>{outlier.shopName}</Text>
        <Text style={styles.missingMetricsText}>
          Missing {outlier.missingMetricsCount} metrics
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#fff', fontSize: 16 }}>Loading rankings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const topPerformers = shopPerformances.slice(0, showAllPerformers ? undefined : 10);
  const topOutliers = outliers.slice(0, showAllOutliers ? undefined : 10);
  const fullRankings = showFullRankings ? shopPerformances : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
            colors={['#2196F3']}
          />
        }
      >
        {/* Top Performers Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="trophy.fill" size={28} color="#FFD700" />
            <View>
              <Text style={styles.sectionTitle}>Top Performers</Text>
              <Text style={styles.sectionSubtitle}>
                {showAllPerformers ? 'All shops' : 'Top 10 shops'} by performance score
              </Text>
            </View>
          </View>
          
          <View style={styles.cardContainer}>
            <GlassView intensity={20} style={styles.cardContent}>
              {topPerformers.length > 0 ? (
                <>
                  {topPerformers.map((shop, index) => 
                    renderShopPerformance(shop, index, index === topPerformers.length - 1)
                  )}
                  {!showAllPerformers && shopPerformances.length > 10 && (
                    <TouchableOpacity
                      style={styles.showMoreButton}
                      onPress={() => setShowAllPerformers(true)}
                    >
                      <Text style={styles.showMoreText}>
                        Show All {shopPerformances.length} Shops
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <IconSymbol name="chart.bar" size={48} color="#888" />
                  <Text style={styles.emptyText}>No performance data available</Text>
                </View>
              )}
            </GlassView>
          </View>
        </View>

        {/* Outliers Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="exclamationmark.triangle.fill" size={28} color="#f44336" />
            <View>
              <Text style={styles.sectionTitle}>Outliers</Text>
              <Text style={styles.sectionSubtitle}>
                Shops missing 3+ metrics vs goals ({outliers.length} total)
              </Text>
            </View>
          </View>
          
          <View style={styles.cardContainer}>
            <GlassView intensity={20} style={styles.cardContent}>
              {topOutliers.length > 0 ? (
                <>
                  {topOutliers.map((outlier, index) => 
                    renderOutlier(outlier, index, index === topOutliers.length - 1)
                  )}
                  {!showAllOutliers && outliers.length > 10 && (
                    <TouchableOpacity
                      style={styles.showMoreButton}
                      onPress={() => setShowAllOutliers(true)}
                    >
                      <Text style={styles.showMoreText}>
                        Show All {outliers.length} Outliers
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <IconSymbol name="checkmark.circle" size={48} color="#4CAF50" />
                  <Text style={styles.emptyText}>No outliers found - great job!</Text>
                </View>
              )}
            </GlassView>
          </View>
        </View>

        {/* Full Rankings Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="list.number" size={28} color="#2196F3" />
            <View>
              <Text style={styles.sectionTitle}>Full Rankings</Text>
              <Text style={styles.sectionSubtitle}>
                Complete performance ranking of all shops
              </Text>
            </View>
          </View>
          
          {!showFullRankings ? (
            <TouchableOpacity
              style={styles.cardContainer}
              onPress={() => setShowFullRankings(true)}
            >
              <GlassView intensity={20} style={styles.cardContent}>
                <View style={styles.emptyState}>
                  <IconSymbol name="list.bullet" size={48} color="#2196F3" />
                  <Text style={styles.showMoreText}>
                    View Full Rankings ({shopPerformances.length} shops)
                  </Text>
                </View>
              </GlassView>
            </TouchableOpacity>
          ) : (
            <View style={styles.cardContainer}>
              <GlassView intensity={20} style={styles.cardContent}>
                {fullRankings.map((shop, index) => 
                  renderShopPerformance(shop, index, index === fullRankings.length - 1)
                )}
              </GlassView>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
