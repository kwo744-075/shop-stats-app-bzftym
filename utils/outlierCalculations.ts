
import { MetricGoals } from '@/types/SetupData';
import { CheckInItem } from '@/types/CheckInData';

export interface OutlierResult {
  shopId: string;
  shopNumber: number;
  shopName: string;
  missingMetrics: string[];
  missingCount: number;
  isOutlier: boolean;
  districtId?: string;
  districtName?: string;
}

export interface DistrictOutlierResult {
  districtId: string;
  districtName: string;
  outliers: OutlierResult[];
  totalShops: number;
  outlierCount: number;
  outlierPercentage: number;
}

export interface ShopRanking {
  shopId: string;
  shopNumber: number;
  shopName: string;
  totalScore: number;
  percentageScore: number;
  metrics: {
    big4: number;
    coolants: number;
    diffs: number;
    mobil1: number;
  };
}

// Calculate outlier status for a single shop based on KPI goals only
export function calculateShopOutlierStatus(
  shopData: CheckInItem | null,
  goals: MetricGoals,
  shopId: string,
  shopNumber: number,
  shopName: string
): OutlierResult {
  const missingMetrics: string[] = [];

  if (!shopData) {
    // If no data, all KPI metrics are missing
    missingMetrics.push('Big4', 'Coolants', 'Diffs', 'Mobil1');
  } else {
    // Check only KPI goals (Big4, coolants, diffs, mobil1)
    if (goals.big4 > 0 && shopData.big4 < goals.big4) {
      missingMetrics.push('Big4');
    }
    if (goals.coolants > 0 && shopData.coolant < goals.coolants) {
      missingMetrics.push('Coolants');
    }
    if (goals.diffs > 0 && shopData.diffs < goals.diffs) {
      missingMetrics.push('Diffs');
    }
    if (goals.mobil1 > 0 && shopData.mobil1 < goals.mobil1) {
      missingMetrics.push('Mobil1');
    }
  }

  const missingCount = missingMetrics.length;
  const isOutlier = missingCount >= 3; // 3 or more missing KPI metrics = outlier

  return {
    shopId,
    shopNumber,
    shopName,
    missingMetrics,
    missingCount,
    isOutlier
  };
}

// Calculate outliers for a specific district
export function calculateDistrictOutliers(
  shopDataMap: Map<string, CheckInItem | null>,
  goals: MetricGoals,
  districtShops: { id: string; number: number; name: string }[],
  districtId: string,
  districtName: string
): DistrictOutlierResult {
  const outliers: OutlierResult[] = [];

  districtShops.forEach(shop => {
    const shopData = shopDataMap.get(shop.id);
    const outlierResult = calculateShopOutlierStatus(
      shopData,
      goals,
      shop.id,
      shop.number,
      shop.name
    );

    if (outlierResult.isOutlier) {
      outlierResult.districtId = districtId;
      outlierResult.districtName = districtName;
      outliers.push(outlierResult);
    }
  });

  const totalShops = districtShops.length;
  const outlierCount = outliers.length;
  const outlierPercentage = totalShops > 0 ? (outlierCount / totalShops) * 100 : 0;

  return {
    districtId,
    districtName,
    outliers,
    totalShops,
    outlierCount,
    outlierPercentage
  };
}

// Calculate outliers for all shops
export function calculateAllOutliers(
  shopDataMap: Map<string, CheckInItem | null>,
  goals: MetricGoals,
  allShops: { id: string; number: number; name: string }[]
): OutlierResult[] {
  const outliers: OutlierResult[] = [];

  allShops.forEach(shop => {
    const shopData = shopDataMap.get(shop.id);
    const outlierResult = calculateShopOutlierStatus(
      shopData,
      goals,
      shop.id,
      shop.number,
      shop.name
    );

    if (outlierResult.isOutlier) {
      outliers.push(outlierResult);
    }
  });

  return outliers;
}

// Calculate shop rankings based on KPI performance only
export function calculateShopRankings(
  shopDataMap: Map<string, CheckInItem | null>,
  goals: MetricGoals,
  allShops: { id: string; number: number; name: string }[]
): ShopRanking[] {
  const rankings: ShopRanking[] = [];

  allShops.forEach(shop => {
    const shopData = shopDataMap.get(shop.id);
    
    if (!shopData) {
      // No data = 0 score
      rankings.push({
        shopId: shop.id,
        shopNumber: shop.number,
        shopName: shop.name,
        totalScore: 0,
        percentageScore: 0,
        metrics: {
          big4: 0,
          coolants: 0,
          diffs: 0,
          mobil1: 0
        }
      });
      return;
    }

    // Calculate scores for KPI metrics only (as percentages)
    const big4Score = goals.big4 > 0 ? Math.min(100, (shopData.big4 / goals.big4) * 100) : 0;
    const coolantsScore = goals.coolants > 0 ? Math.min(100, (shopData.coolant / goals.coolants) * 100) : 0;
    const diffsScore = goals.diffs > 0 ? Math.min(100, (shopData.diffs / goals.diffs) * 100) : 0;
    const mobil1Score = goals.mobil1 > 0 ? Math.min(100, (shopData.mobil1 / goals.mobil1) * 100) : 0;

    // Total score is average of KPI metrics
    const totalScore = (big4Score + coolantsScore + diffsScore + mobil1Score) / 4;

    rankings.push({
      shopId: shop.id,
      shopNumber: shop.number,
      shopName: shop.name,
      totalScore,
      percentageScore: totalScore,
      metrics: {
        big4: big4Score,
        coolants: coolantsScore,
        diffs: diffsScore,
        mobil1: mobil1Score
      }
    });
  });

  // Sort by total score (highest first)
  return rankings.sort((a, b) => b.totalScore - a.totalScore);
}

// Get top performers based on KPI metrics only
export function getTopPerformers(
  shopDataMap: Map<string, CheckInItem | null>,
  goals: MetricGoals,
  allShops: { id: string; number: number; name: string }[],
  limit: number = 5
): ShopRanking[] {
  const rankings = calculateShopRankings(shopDataMap, goals, allShops);
  return rankings.slice(0, limit);
}
