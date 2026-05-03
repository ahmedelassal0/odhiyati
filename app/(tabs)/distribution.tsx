import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useCowStore } from '@/src/store/cowStore';
import { useCustomerStore } from '@/src/store/customerStore';
import { useDistributionStore } from '@/src/store/distributionStore';
import { runDistribution, preCheckWarnings } from '@/src/utils/distributionEngine';
import { WarningBanner } from '@/src/components/WarningBanner';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Colors } from '@/src/constants/colors';
import { useRouter } from 'expo-router';

export default function DistributionScreen() {
  const router = useRouter();
  const { cows, loadCows } = useCowStore();
  const { customers, loadCustomers } = useCustomerStore();
  const { results, warnings, setResults, setWarnings, clearResults, loadResults } = useDistributionStore();
  const [running, setRunning] = useState(false);
  const [preWarnings, setPreWarnings] = useState<any[]>([]);

  useEffect(() => {
    loadCows();
    loadCustomers();
    loadResults();
  }, []);

  useEffect(() => {
    if (customers.length > 0 && cows.length > 0) {
      const w = preCheckWarnings(customers, cows);
      setPreWarnings(w);
    }
  }, [customers, cows]);

  const handleRunDistribution = async () => {
    const highWarnings = preWarnings.filter(w => w.severity === 'high');
    if (highWarnings.length > 0) {
      Alert.alert(
        'تحذير',
        'توجد تحذيرات عالية الخطورة. هل تريد المتابعة؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'متابعة', onPress: executeDistribution },
        ]
      );
    } else {
      executeDistribution();
    }
  };

  const executeDistribution = async () => {
    setRunning(true);
    try {
      const { results: newResults, warnings: newWarnings } = await runDistribution(
        customers,
        cows
      );
      await setResults(newResults);
      setWarnings(newWarnings);
      
      Alert.alert(
        'تم التوزيع ✅',
        `تم توزيع الأجزاء على ${newResults.length} مشترك${newWarnings.length > 0 ? `\n⚠️ ${newWarnings.length} تحذيرات` : ''}`,
        [
          { text: 'عرض النتائج', onPress: () => router.push('/(tabs)/results') },
          { text: 'موافق' },
        ]
      );
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء التوزيع');
      console.error(error);
    } finally {
      setRunning(false);
    }
  };

  const handleClearResults = () => {
    Alert.alert(
      'مسح النتائج',
      'هل أنت متأكد من مسح جميع نتائج التوزيع؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'مسح',
          style: 'destructive',
          onPress: clearResults,
        },
      ]
    );
  };

  const assignedCustomers = customers.filter(c => c.cowId);
  const unassignedCustomers = customers.filter(c => !c.cowId);

  if (customers.length === 0 || cows.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="⚡"
          title="لا يمكن بدء التوزيع"
          description={
            customers.length === 0
              ? 'أضف مشتركين أولاً'
              : 'أضف أبقار أولاً'
          }
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Status Header */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>📊 حالة التوزيع</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={styles.statusValue}>{assignedCustomers.length}</Text>
            <Text style={styles.statusLabel}>مشترك مخصص</Text>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <Text style={[styles.statusValue, unassignedCustomers.length > 0 && { color: Colors.warning }]}>
              {unassignedCustomers.length}
            </Text>
            <Text style={styles.statusLabel}>بدون بقرة</Text>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <Text style={styles.statusValue}>{cows.length}</Text>
            <Text style={styles.statusLabel}>بقرة</Text>
          </View>
        </View>
      </View>

      {/* Pre-Check Warnings */}
      {preWarnings.length > 0 && (
        <WarningBanner warnings={preWarnings} />
      )}

      {/* Cow Distribution Summary */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🐄 ملخص الأبقار</Text>
      </View>
      {cows.map(cow => {
        const cowCustomers = customers.filter(c => c.cowId === cow.id);
        return (
          <View key={cow.id} style={styles.cowSummaryCard}>
            <View style={styles.cowSummaryHeader}>
              <Text style={styles.cowSummaryName}>🐄 {cow.name}</Text>
              <Text style={styles.cowSummaryShares}>
                {cow.takenShares}/{cow.totalShares} سهم
              </Text>
            </View>
            {cowCustomers.length > 0 ? (
              <View style={styles.cowSubscribers}>
                {cowCustomers.map(customer => (
                  <View key={customer.id} style={styles.subscriberRow}>
                    <Text style={styles.subscriberName}>
                      👤 {customer.name}
                    </Text>
                    <Text style={styles.subscriberShares}>
                      {customer.shares} سهم • {customer.requestedParts.length} أجزاء
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noSubscribers}>لا يوجد مشتركين</Text>
            )}
          </View>
        );
      })}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="⚡ ابدأ التوزيع التلقائي"
          onPress={handleRunDistribution}
          variant="primary"
          size="large"
          fullWidth
          loading={running}
          disabled={assignedCustomers.length === 0}
        />
        
        {results.length > 0 && (
          <>
            <Button
              title="📋 عرض النتائج"
              onPress={() => router.push('/(tabs)/results')}
              variant="outline"
              size="large"
              fullWidth
              style={styles.actionButton}
            />
            <Button
              title="🔄 إعادة التوزيع"
              onPress={handleRunDistribution}
              variant="secondary"
              size="medium"
              fullWidth
              loading={running}
              style={styles.actionButton}
            />
            <Button
              title="🗑️ مسح النتائج"
              onPress={handleClearResults}
              variant="danger"
              size="medium"
              fullWidth
              style={styles.actionButton}
            />
          </>
        )}
      </View>

      {/* Post-Distribution Warnings */}
      {warnings.length > 0 && (
        <View style={styles.postWarnings}>
          <WarningBanner warnings={warnings} />
        </View>
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
  
  // Status
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 14,
  },
  statusGrid: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  statusDivider: {
    width: 1,
    backgroundColor: Colors.divider,
  },
  
  // Section
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  
  // Cow Summary
  cowSummaryCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cowSummaryHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cowSummaryName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cowSummaryShares: {
    fontSize: 13,
    color: Colors.secondaryLight,
    fontWeight: '600',
  },
  cowSubscribers: {
    gap: 6,
  },
  subscriberRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    padding: 10,
  },
  subscriberName: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  subscriberShares: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  noSubscribers: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Actions
  actions: {
    marginTop: 20,
    gap: 10,
  },
  actionButton: {
    marginTop: 0,
  },
  
  // Post Warnings
  postWarnings: {
    marginTop: 20,
  },
  
  bottomSpacer: {
    height: 30,
  },
});
