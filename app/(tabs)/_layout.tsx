import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View, Text, I18nManager } from 'react-native';
import { Colors } from '@/src/constants/colors';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Text style={styles.iconText}>{emoji}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: Colors.textPrimary,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          headerTitle: '🐄 ذبائح عيد الأضحى',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'المشتركين',
          headerTitle: '👥 المشتركين',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cows"
        options={{
          title: 'الأبقار',
          headerTitle: '🐄 الأبقار',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🐄" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="distribution"
        options={{
          title: 'التوزيع',
          headerTitle: '⚡ التوزيع',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚡" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: 'النتائج',
          headerTitle: '📊 نتائج التوزيع',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="delivery"
        options={{
          title: 'التوصيل',
          headerTitle: '🚚 التوصيل والتسليم',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🚚" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'الإعدادات',
          headerTitle: '⚙️ الإعدادات',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.cardBorder,
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 10,
    paddingTop: 6,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  header: {
    backgroundColor: Colors.background,
    borderBottomColor: Colors.cardBorder,
    borderBottomWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: Colors.primaryBg,
  },
  iconText: {
    fontSize: 20,
  },
});
