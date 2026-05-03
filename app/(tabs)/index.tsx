import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCowStore } from '@/src/store/cowStore';
import { useCustomerStore } from '@/src/store/customerStore';
import { useDistributionStore } from '@/src/store/distributionStore';
import { Colors } from '@/src/constants/colors';

export default function DashboardScreen() {
  const router = useRouter();
  const { cows, loadCows } = useCowStore();
  const { customers, loadCustomers } = useCustomerStore();
  const { results, loadResults } = useDistributionStore();
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    await Promise.all([loadCows(), loadCustomers(), loadResults()]);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  // Stats
  const totalShares = cows.reduce((sum, c) => sum + c.totalShares, 0);
  const takenShares = cows.reduce((sum, c) => sum + c.takenShares, 0);
  const availableShares = totalShares - takenShares;
  const completeCows = cows.filter(c => c.status === 'complete').length;
  const unassignedCustomers = customers.filter(c => !c.cowId).length;

  const stats = [
    {
      icon: '👥',
      label: 'المشتركين',
      value: customers.length.toString(),
      color: Colors.primary,
      bgColor: Colors.primaryBg,
    },
    {
      icon: '🐄',
      label: 'الأبقار',
      value: cows.length.toString(),
      color: Colors.secondary,
      bgColor: Colors.secondaryBg,
    },
    {
      icon: '📊',
      label: 'الأسهم الموزعة',
      value: `${takenShares}/${totalShares}`,
      color: Colors.info,
      bgColor: Colors.infoBg,
    },
    {
      icon: '✅',
      label: 'مكتملة',
      value: `${completeCows}/${cows.length}`,
      color: Colors.success,
      bgColor: Colors.successBg,
    },
  ];

  const quickActions = [
    {
      icon: '➕',
      label: 'إضافة مشترك',
      route: '/customer-form' as const,
      color: Colors.primary,
      bgColor: Colors.primaryBg,
    },
    {
      icon: '🐄',
      label: 'إضافة بقرة',
      route: '/cow-form' as const,
      color: Colors.secondary,
      bgColor: Colors.secondaryBg,
    },
    {
      icon: '⚡',
      label: 'بدء التوزيع',
      route: '/(tabs)/distribution' as const,
      color: Colors.accent,
      bgColor: '#2E1065',
    },
    {
      icon: '📋',
      label: 'عرض النتائج',
      route: '/(tabs)/results' as const,
      color: Colors.success,
      bgColor: Colors.successBg,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Hero Header */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🐄</Text>
        <Text style={styles.heroTitle}>ذبائح عيد الأضحى</Text>
        <Text style={styles.heroSubtitle}>
          إدارة وتوزيع الأضاحي بسهولة
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View
            key={index}
            style={[styles.statCard, { backgroundColor: stat.bgColor }]}
          >
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={[styles.statValue, { color: stat.color }]}>
              {stat.value}
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Warnings */}
      {unassignedCustomers > 0 && (
        <View style={styles.alertCard}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <Text style={styles.alertText}>
            {unassignedCustomers} مشتركين بدون بقرة مخصصة
          </Text>
        </View>
      )}

      {availableShares > 0 && cows.length > 0 && (
        <View style={[styles.alertCard, styles.alertInfo]}>
          <Text style={styles.alertIcon}>💡</Text>
          <Text style={[styles.alertText, { color: Colors.info }]}>
            {availableShares} أسهم متبقية متاحة للتوزيع
          </Text>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
      </View>
      <View style={styles.actionsGrid}>
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionCard, { backgroundColor: action.bgColor }]}
            onPress={() => router.push(action.route)}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: action.color + '30' }]}>
              <Text style={styles.actionIcon}>{action.icon}</Text>
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Activity */}
      {results.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>آخر التوزيعات</Text>
          </View>
          {results.slice(0, 3).map((result) => (
            <View key={result.id} style={styles.activityItem}>
              <View style={styles.activityDot} />
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>{result.customerName}</Text>
                <Text style={styles.activitySubtitle}>
                  🐄 {result.cowName} • {result.parts.filter(p => p.received).length} أجزاء
                </Text>
              </View>
              <Text style={styles.activityTime}>
                {new Date(result.createdAt).toLocaleDateString('ar-EG')}
              </Text>
            </View>
          ))}
        </>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
  },
  
  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 8,
  },
  heroEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Stats
  statsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  
  // Alerts
  alertCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.warningBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  alertInfo: {
    backgroundColor: Colors.infoBg,
    borderColor: Colors.info,
  },
  alertIcon: {
    fontSize: 18,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '500',
    textAlign: 'right',
  },
  
  // Section
  sectionHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  
  // Actions
  actionsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  actionCard: {
    width: '48%',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 22,
  },
  actionLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Activity
  activityItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 12,
  },
  activityInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  activitySubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginRight: 8,
  },
  
  bottomSpacer: {
    height: 30,
  },
});
