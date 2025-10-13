
import * as XLSX from 'xlsx';
import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { WeeklyData, ShopCheckIn } from '@/types/CheckInData';

export async function exportToExcel(weeklyData: WeeklyData, type: 'daily' | 'weekly') {
  try {
    const workbook = XLSX.utils.book_new();
    
    if (type === 'daily') {
      // Export today's data
      const today = new Date().toISOString().split('T')[0];
      const todayData = weeklyData.dailyData.find(day => day.date === today);
      
      if (todayData && todayData.checkIns.length > 0) {
        const worksheetData = [
          ['Shop ID', 'Shop Name', 'Check-in Time', 'Cars', 'Sales', 'Big 4', 'Coolants', 'Diffs', 'Donations', 'Mobil1', 'Staffing', 'Temp'],
          ...todayData.checkIns.map(checkIn => [
            checkIn.shopId,
            checkIn.shopName,
            checkIn.checkInTime,
            checkIn.data.cars,
            checkIn.data.sales,
            checkIn.data.big4,
            checkIn.data.coolants,
            checkIn.data.diffs,
            checkIn.data.donations,
            checkIn.data.mobil1,
            checkIn.data.staffing,
            checkIn.data.temp
          ])
        ];
        
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, `Daily_${today}`);
      }
    } else {
      // Export weekly data
      weeklyData.dailyData.forEach(day => {
        if (day.checkIns.length > 0) {
          const worksheetData = [
            ['Shop ID', 'Shop Name', 'Check-in Time', 'Cars', 'Sales', 'Big 4', 'Coolants', 'Diffs', 'Donations', 'Mobil1', 'Staffing', 'Temp'],
            ...day.checkIns.map(checkIn => [
              checkIn.shopId,
              checkIn.shopName,
              checkIn.checkInTime,
              checkIn.data.cars,
              checkIn.data.sales,
              checkIn.data.big4,
              checkIn.data.coolants,
              checkIn.data.diffs,
              checkIn.data.donations,
              checkIn.data.mobil1,
              checkIn.data.staffing,
              checkIn.data.temp
            ])
          ];
          
          const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
          XLSX.utils.book_append_sheet(workbook, worksheet, day.date);
        }
      });
    }

    // Generate Excel file
    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const filename = `${type}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Use the correct FileSystem properties - import them directly
    const uri = documentDirectory + filename;
    
    await writeAsStringAsync(uri, wbout, {
      encoding: EncodingType.Base64,
    });

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    }
    
    return true;
  } catch (error) {
    console.log('Error exporting to Excel:', error);
    return false;
  }
}
