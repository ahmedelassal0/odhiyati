import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';
import 'react-native-reanimated';
import { Colors } from '@/src/constants/colors';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useEffect } from 'react';

// Force RTL for Arabic
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          contentStyle: {
            backgroundColor: Colors.background,
          },
          animation: 'slide_from_left',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="customer-form"
          options={{
            title: 'المشترك',
            presentation: 'modal',
            headerTitle: '👤 بيانات المشترك',
          }}
        />
        <Stack.Screen
          name="cow-form"
          options={{
            title: 'البقرة',
            presentation: 'modal',
            headerTitle: '🐄 بيانات البقرة',
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
