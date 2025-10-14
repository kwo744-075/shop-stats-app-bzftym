
import { CheckInItem } from '@/types/CheckInData';
import { MetricGoals } from '@/types/SetupData';

export interface OutlierResult {
  shopId: string;
  shopNumber: number;
  shopName: string;
  isOutlier: boolean;
  missingMetricsCount: number;
  missingMetrics: string[];
}

export interface DistrictOutlierSummary {
  districtId: string;
  districtName: string;
  totalShops: number;
  outlierCount: number;
  outlierShops: OutlierResult[];
}

/**
 * Calculates if a shop is an outlier based on missing metrics compared to goals
 * A shop is considered an outlier if it's missing 3 or more metrics versus the goals
 */
export function calculateShopOutlierStatus(
  shopData: CheckInItem | null,
  goals: MetricGoals,
  shopId: string,
  shopNumber: number,
  shopName: string
): OutlierResult {
  const missingMetrics: string[] = [];

  if (!shopData) {
    // If no data at all, all metrics are missing
    return {
      shopId,
      shopNumber,
      shopName,
      isOutlier: true,
      missingMetricsCount: 9, // All metrics
      missingMetrics: ['cars', 'sales', 'big4', 'coolants', 'diffs', 'donations', 'mobil1', 'staffing', 'temperature']
    };
  }

  // Check each metric against goals
  if (shopData.cars < goals.cars) {
    missingMetrics.push('cars');
  }
  if (shopData.sales < goals.sales) {
    missingMetrics.push('sales');
  }
  if (shopData.big4 < goals.big4) {
    missingMetrics.push('big4');
  }
  if (shopData.coolants < goals.coolants) {
    missingMetrics.push('coolants');
  }
  if (shopData.diffs < goals.diffs) {
    missingMetrics.push('diffs');
  }
  if (shopData.donations < goals.donations) {
    missingMetrics.push('donations');
  }
  if (shopData.mobil1 < goals.mobil1) {
    missingMetrics.push('mobil1');
  }
  if (shopData.staffing < goals.staffing) {
    missingMetrics.push('staffing');
  }
  // Temperature check - if not meeting the goal temperature level
  if (goals.temperature === 'green' && (shopData.temperature === 'red' || shopData.temperature === 'yellow')) {
    missingMetrics.push('temperature');
  } else if (goals.temperature === 'yellow' && shopData.temperature === 'red') {
    missingMetrics.push('temperature');
  }

  const missingMetricsCount = missingMetrics.length;
  const isOutlier = missingMetricsCount >= 3;

  return {
    shopId,
    shopNumber,
    shopName,
    isOutlier,
    missingMetricsCount,
    missingMetrics
  };
}

/**
 * Calculates outlier status for all shops in a district
 */
export function calculateDistrictOutliers(
  shopDataMap: Map<string, CheckInItem | null>,
  goals: MetricGoals,
  districtShops: { id: string; number: number; name: string }[],
  districtId: string,
  districtName: string
): DistrictOutlierSummary {
  const outlierResults: OutlierResult[] = [];

  for (const shop of districtShops) {
    const shopData = shopDataMap.get(shop.id);
    const result = calculateShopOutlierStatus(shopData, goals, shop.id, shop.number, shop.name);
    outlierResults.push(result);
  }

  const outlierShops = outlierResults.filter(result => result.isOutlier);

  return {
    districtId,
    districtName,
    totalShops: districtShops.length,
    outlierCount: outlierShops.length,
    outlierShops
  };
}

/**
 * Gets a summary of all outliers across all districts
 */
export function calculateAllOutliers(
  shopDataMap: Map<string, CheckInItem | null>,
  goals: MetricGoals,
  allShops: { id: string; number: number; name: string }[]
): OutlierResult[] {
  const outlierResults: OutlierResult[] = [];

  for (const shop of allShops) {
    const shopData = shopDataMap.get(shop.id);
    const result = calculateShopOutlierStatus(shopData, goals, shop.id, shop.number, shop.name);
    if (result.isOutlier) {
      outlierResults.push(result);
    }
  }

  return outlierResults.sort((a, b) => a.shopNumber - b.shopNumber);
}

/**
 * Interface for shop performance ranking
 */
export interface ShopRanking {
  shopId: string;
  shopNumber: number;
  shopName: string;
  totalScore: number;
  percentageScore: number;
  rank: number;
  isTopPerformer: boolean;
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

/**
 * Calculates performance rankings for all shops
 */
export function calculateShopRankings(
  shopDataMap: Map<string, CheckInItem | null>,
  goals: MetricGoals,
  allShops: { id: string; number: number; name: string }[]
): ShopRanking[] {
  const rankings: ShopRanking[] = [];

  for (const shop of allShops) {
    const shopData = shopDataMap.get(shop.id);
    
    if (!shopData) {
      // No data - score of 0
      rankings.push({
        shopId: shop.id,
        shopNumber: shop.number,
        shopName: shop.name,
        totalScore: 0,
        percentageScore: 0,
        rank: 0, // Will be set after sorting
        isTopPerformer: false,
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

    // Calculate performance scores as percentages of goals
    const carScore = Math.min(shopData.cars / goals.cars, 1) * 100;
    const salesScore = Math.min(shopData.sales / goals.sales, 1) * 100;
    const big4Score = Math.min(shopData.big4 / goals.big4, 1) * 100;
    const coolantsScore = Math.min(shopData.coolants / goals.coolants, 1) * 100;
    const diffsScore = Math.min(shopData.diffs / goals.diffs, 1) * 100;
    const donationsScore = Math.min(shopData.donations / goals.donations, 1) * 100;
    const mobil1Score = Math.min(shopData.mobil1 / goals.mobil1, 1) * 100;
    const staffingScore = Math.min(shopData.staffing / goals.staffing, 1) * 100;
    
    // Temperature scoring based on goal level
    let temperatureScore = 0;
    if (goals.temperature === 'green') {
      temperatureScore = shopData.temperature === 'green' ? 100 : shopData.temperature === 'yellow' ? 50 : 0;
    } else if (goals.temperature === 'yellow') {
      temperatureScore = shopData.temperature === 'green' ? 100 : shopData.temperature === 'yellow' ? 100 : 0;
    } else {
      temperatureScore = 100; // Any temperature meets red goal
    }

    const totalScore = (carScore + salesScore + big4Score + coolantsScore + diffsScore + donationsScore + mobil1Score + staffingScore + temperatureScore) / 9;

    rankings.push({
      shopId: shop.id,
      shopNumber: shop.number,
      shopName: shop.name,
      totalScore,
      percentageScore: Math.round(totalScore),
      rank: 0, // Will be set after sorting
      isTopPerformer: false, // Will be set after sorting
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

  // Sort by total score (highest first) and assign ranks
  rankings.sort((a, b) => b.totalScore - a.totalScore);
  
  rankings.forEach((ranking, index) => {
    ranking.rank = index + 1;
    ranking.isTopPerformer = index < 10; // Top 10 are considered top performers
  });

  return rankings;
}

/**
 * Gets top performing shops
 */
export function getTopPerformers(
  shopDataMap: Map<string, CheckInItem | null>,
  goals: MetricGoals,
  allShops: { id: string; number: number; name: string }[],
  limit: number = 10
): ShopRanking[] {
  const rankings = calculateShopRankings(shopDataMap, goals, allShops);
  return rankings.slice(0, limit);
}
