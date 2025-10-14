
import { Alert } from 'react-native';
import { supabase } from '@/app/integrations/supabase/client';

interface CommunicationSchedule {
  id: string;
  message: string;
  schedule_time: string;
  schedule_days: string[];
  is_active: boolean;
}

// Check and show scheduled communications
export const checkScheduledCommunications = async () => {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });

    // Get active communication schedules
    const { data: schedules, error } = await supabase
      .from('communication_schedules')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching communication schedules:', error);
      return;
    }

    if (!schedules || schedules.length === 0) {
      return;
    }

    // Check if any schedules match current time and day
    const matchingSchedules = schedules.filter((schedule: CommunicationSchedule) => {
      const scheduleTime = schedule.schedule_time;
      const scheduleDays = schedule.schedule_days || [];
      
      // Check if current time matches (within 1 minute tolerance)
      const currentMinutes = parseInt(currentTime.split(':')[0]) * 60 + parseInt(currentTime.split(':')[1]);
      const scheduleMinutes = parseInt(scheduleTime.split(':')[0]) * 60 + parseInt(scheduleTime.split(':')[1]);
      const timeDiff = Math.abs(currentMinutes - scheduleMinutes);
      
      return timeDiff <= 1 && scheduleDays.includes(currentDay);
    });

    // Show alerts for matching schedules
    matchingSchedules.forEach((schedule: CommunicationSchedule) => {
      Alert.alert(
        'Scheduled Message',
        schedule.message,
        [{ text: 'OK', style: 'default' }],
        { cancelable: true }
      );
    });

  } catch (error) {
    console.error('Error checking scheduled communications:', error);
  }
};

// Initialize communication checking (call this when app starts)
export const initializeCommunicationService = () => {
  // Check immediately
  checkScheduledCommunications();
  
  // Set up interval to check every minute
  const interval = setInterval(checkScheduledCommunications, 60000);
  
  return () => clearInterval(interval);
};
