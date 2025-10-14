
import { Platform } from 'react-native';
import * as Font from 'expo-font';

export interface FontLoadResult {
  success: boolean;
  error?: Error;
}

export const loadFontsWithTimeout = async (
  fonts: Record<string, any>,
  timeout: number = 3000
): Promise<FontLoadResult> => {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      console.log('Font loading timeout exceeded, continuing without custom fonts');
      resolve({ success: false, error: new Error('Font loading timeout') });
    }, timeout);

    Font.loadAsync(fonts)
      .then(() => {
        clearTimeout(timeoutId);
        console.log('Fonts loaded successfully');
        resolve({ success: true });
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        console.log('Font loading failed:', error);
        resolve({ success: false, error });
      });
  });
};

export const getFontFamily = (fontName: string, loaded: boolean): string => {
  if (Platform.OS === 'web') {
    return loaded ? fontName : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  }
  
  if (Platform.OS === 'ios') {
    return loaded ? fontName : 'System';
  }
  
  if (Platform.OS === 'android') {
    return loaded ? fontName : 'Roboto';
  }
  
  return loaded ? fontName : 'System';
};
