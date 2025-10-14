
export interface CheckInItem {
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

export interface ShopCheckIn {
  shopId: string;
  shopName: string;
  checkInTime: '12pm' | '2:30pm' | '5pm' | '8pm';
  timestamp: string;
  data: CheckInItem;
  isSubmitted?: boolean;
}

export interface DailyData {
  date: string;
  checkIns: ShopCheckIn[];
}

export interface WeeklyData {
  weekStart: string;
  weekEnd: string;
  dailyData: DailyData[];
}

export interface ShopDayData {
  [timeSlot: string]: CheckInItem;
}

export interface ShopSubmissionStatus {
  [timeSlot: string]: boolean;
}

export const CHECK_IN_TIMES = ['12pm', '2:30pm', '5pm', '8pm'] as const;
export const TEMP_OPTIONS = ['red', 'yellow', 'green'] as const;

// Field labels for display
export const FIELD_LABELS: { [key: string]: string } = {
  cars: 'Cars',
  sales: 'Sales',
  big4: 'Big 4',
  coolants: 'Coolants',
  diffs: 'Diffs',
  donations: 'Donations',
  mobil1: 'Mobil1',
  staffing: 'Staffing',
  temperature: 'Temperature'
};
