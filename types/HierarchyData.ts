
export interface Shop {
  id: string;
  name: string;
  number: number;
  isActive: boolean;
}

export interface DistrictHierarchy {
  districtManagerName: string;
  districtId: string;
  shops: Shop[];
  lastUpdated: string;
}

export const DEFAULT_SHOPS: Shop[] = Array.from({ length: 12 }, (_, i) => ({
  id: `shop-${i + 1}`,
  name: `Shop ${i + 1}`,
  number: i + 1,
  isActive: true,
}));
