
export interface MasterShop {
  id: string;
  number: number;
  name: string;
  isActive: boolean;
}

export interface District {
  id: string;
  name: string;
  shopIds: string[];
  isActive: boolean;
}

export interface MetricGoals {
  id?: string;
  cars: number;
  sales: number;
  big4: number;
  coolants: number;
  diffs: number;
  donations: number;
  mobil1: number;
  staffing: number;
  temperature: 'red' | 'yellow' | 'green';
}

export interface MasterSetupData {
  shops: MasterShop[];
  districts: District[];
  metricGoals?: MetricGoals;
  lastUpdated: string;
}

// Default shops based on the provided list with placeholder names
export const DEFAULT_MASTER_SHOPS: MasterShop[] = [
  // Baton Rouge North
  { id: 'shop-17', number: 17, name: 'Name Here', isActive: true },
  { id: 'shop-22', number: 22, name: 'Name Here', isActive: true },
  { id: 'shop-641', number: 641, name: 'Name Here', isActive: true },
  { id: 'shop-717', number: 717, name: 'Name Here', isActive: true },
  { id: 'shop-843', number: 843, name: 'Name Here', isActive: true },
  { id: 'shop-881', number: 881, name: 'Name Here', isActive: true },
  
  // Baton Rouge South
  { id: 'shop-18', number: 18, name: 'Name Here', isActive: true },
  { id: 'shop-19', number: 19, name: 'Name Here', isActive: true },
  { id: 'shop-282', number: 282, name: 'Name Here', isActive: true },
  { id: 'shop-447', number: 447, name: 'Name Here', isActive: true },
  { id: 'shop-448', number: 448, name: 'Name Here', isActive: true },
  { id: 'shop-531', number: 531, name: 'Name Here', isActive: true },
  { id: 'shop-832', number: 832, name: 'Name Here', isActive: true },
  
  // Gulf Coast North
  { id: 'shop-3', number: 3, name: 'Name Here', isActive: true },
  { id: 'shop-5', number: 5, name: 'Name Here', isActive: true },
  { id: 'shop-11', number: 11, name: 'Name Here', isActive: true },
  { id: 'shop-14', number: 14, name: 'Name Here', isActive: true },
  { id: 'shop-20', number: 20, name: 'Name Here', isActive: true },
  { id: 'shop-21', number: 21, name: 'Name Here', isActive: true },
  { id: 'shop-23', number: 23, name: 'Name Here', isActive: true },
  { id: 'shop-24', number: 24, name: 'Name Here', isActive: true },
  { id: 'shop-26', number: 26, name: 'Name Here', isActive: true },
  
  // Gulf Coast West
  { id: 'shop-46', number: 46, name: 'Name Here', isActive: true },
  { id: 'shop-283', number: 283, name: 'Name Here', isActive: true },
  { id: 'shop-847', number: 847, name: 'Name Here', isActive: true },
  { id: 'shop-865', number: 865, name: 'Name Here', isActive: true },
  { id: 'shop-919', number: 919, name: 'Name Here', isActive: true },
  { id: 'shop-954', number: 954, name: 'Name Here', isActive: true },
  { id: 'shop-3017', number: 3017, name: 'Name Here', isActive: true },
  
  // Lafayette
  { id: 'shop-29', number: 29, name: 'Name Here', isActive: true },
  { id: 'shop-40', number: 40, name: 'Name Here', isActive: true },
  { id: 'shop-280', number: 280, name: 'Name Here', isActive: true },
  { id: 'shop-599', number: 599, name: 'Name Here', isActive: true },
  { id: 'shop-720', number: 720, name: 'Name Here', isActive: true },
  { id: 'shop-728', number: 728, name: 'Name Here', isActive: true },
  { id: 'shop-830', number: 830, name: 'Name Here', isActive: true },
  { id: 'shop-975', number: 975, name: 'Name Here', isActive: true },
  
  // NOLA North
  { id: 'shop-1', number: 1, name: 'Name Here', isActive: true },
  { id: 'shop-2', number: 2, name: 'Name Here', isActive: true },
  { id: 'shop-4', number: 4, name: 'Name Here', isActive: true },
  { id: 'shop-6', number: 6, name: 'Name Here', isActive: true },
  { id: 'shop-15', number: 15, name: 'Name Here', isActive: true },
  { id: 'shop-28', number: 28, name: 'Name Here', isActive: true },
  { id: 'shop-32', number: 32, name: 'Name Here', isActive: true },
  { id: 'shop-606', number: 606, name: 'Name Here', isActive: true },
  
  // NOLA South
  { id: 'shop-8', number: 8, name: 'Name Here', isActive: true },
  { id: 'shop-10', number: 10, name: 'Name Here', isActive: true },
  { id: 'shop-12', number: 12, name: 'Name Here', isActive: true },
  { id: 'shop-13', number: 13, name: 'Name Here', isActive: true },
  { id: 'shop-31', number: 31, name: 'Name Here', isActive: true },
  { id: 'shop-92', number: 92, name: 'Name Here', isActive: true },
  { id: 'shop-116', number: 116, name: 'Name Here', isActive: true },
  { id: 'shop-870', number: 870, name: 'Name Here', isActive: true },
  { id: 'shop-3004', number: 3004, name: 'Name Here', isActive: true },
];

export const DEFAULT_DISTRICTS: District[] = [
  {
    id: 'district-baton-rouge-north',
    name: 'Baton Rouge North',
    shopIds: ['shop-17', 'shop-22', 'shop-641', 'shop-717', 'shop-843', 'shop-881'],
    isActive: true,
  },
  {
    id: 'district-baton-rouge-south',
    name: 'Baton Rouge South',
    shopIds: ['shop-18', 'shop-19', 'shop-282', 'shop-447', 'shop-448', 'shop-531', 'shop-832'],
    isActive: true,
  },
  {
    id: 'district-gulf-coast-north',
    name: 'Gulf Coast North',
    shopIds: ['shop-3', 'shop-5', 'shop-11', 'shop-14', 'shop-20', 'shop-21', 'shop-23', 'shop-24', 'shop-26'],
    isActive: true,
  },
  {
    id: 'district-gulf-coast-west',
    name: 'Gulf Coast West',
    shopIds: ['shop-46', 'shop-283', 'shop-847', 'shop-865', 'shop-919', 'shop-954', 'shop-3017'],
    isActive: true,
  },
  {
    id: 'district-lafayette',
    name: 'Lafayette',
    shopIds: ['shop-29', 'shop-40', 'shop-280', 'shop-599', 'shop-720', 'shop-728', 'shop-830', 'shop-975'],
    isActive: true,
  },
  {
    id: 'district-nola-north',
    name: 'NOLA North',
    shopIds: ['shop-1', 'shop-2', 'shop-4', 'shop-6', 'shop-15', 'shop-28', 'shop-32', 'shop-606'],
    isActive: true,
  },
  {
    id: 'district-nola-south',
    name: 'NOLA South',
    shopIds: ['shop-8', 'shop-10', 'shop-12', 'shop-13', 'shop-31', 'shop-92', 'shop-116', 'shop-870', 'shop-3004'],
    isActive: true,
  },
];
