
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants';

// Get Supabase configuration from environment variables
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || 
                     process.env.EXPO_PUBLIC_SUPABASE_URL || 
                     "https://okzgxhennmjmvcnnzyur.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || 
                                process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9remd4aGVubm1qbXZjbm56eXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzODA1NjUsImV4cCI6MjA3NTk1NjU2NX0.Sc3ZH9wm_iblGXvKhFS_ZMwwudfvACnLJZh2CyuV4gA";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

console.log('Supabase client initialized with URL:', SUPABASE_URL);
