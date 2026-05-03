import { DistributionResultCard } from '@/src/components/DistributionResult';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Colors } from '@/src/constants/colors';
import { exportAllData } from '@/src/database/database';
import { useDistributionStore } from '@/src/store/distributionStore';
import { useCustomerStore } from '@/src/store/customerStore';
import { exportCowSummary, exportCustomerCard, exportToPdf } from '@/src/utils/pdfExporter';
import { File as ExpoFile, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useState } from 'react';
import { PARTS_MAP } from '@/src/constants/parts';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ResultsScreen() {
  const router = useRouter();
  const { results, loadResults } = useDistributionStore();
  const { customers, loadCustomers } = useCustomerStore();
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'customer' | 'cow'>('customer');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadResults();
    loadCustomers();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadResults();
    setRefreshing(false);
  }, []);

  // Group results by cow
  const resultsByCow = results.reduce((acc, result) => {
    if (!acc[result.cowId]) {
      acc[result.cowId] = {
        cowName: result.cowName,
        results: [],
      };
    }
    acc[result.cowId].results.push(result);
    return acc;
  }, {} as Record<string, { cowName: string; results: typeof results }>);

  const handleExportPdf = async () => {
    if (results.length === 0) return;
    setExporting(true);
    try {
      await exportToPdf(results);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء تصدير PDF');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportCustomerCard = async (resultId: string) => {
    const result = results.find(r => r.id === resultId);
    if (!result) return;
    try {
      await exportCustomerCard(result);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء تصدير البطاقة');
    }
  };

  const handleExportCowSummary = async (cowId: string) => {
    const cowData = resultsByCow[cowId];
    if (!cowData) return;
    try {
      await exportCowSummary(cowData.cowName, cowData.results);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء تصدير ملخص البقرة');
    }
  };


  const handleBackupData = async () => {
    try {
      const jsonData = await exportAllData();
      const backupFile = new ExpoFile(Paths.document, `eid_adha_backup_${Date.now()}.json`);
      backupFile.create();
      backupFile.write(jsonData);
      await Sharing.shareAsync(backupFile.uri, {
        mimeType: 'application/json',
        dialogTitle: 'نسخة احتياطية - ذبائح عيد الأضحى',
      });
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء النسخة الاحتياطية');
      console.error(error);
    }
  };

  if (results.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="📋"
          title="لا توجد نتائج بعد"
          description="قم بتشغيل التوزيع أولاً من شاشة التوزيع"
          actionTitle="الذهاب للتوزيع"
          onAction={() => router.push('/(tabs)/distribution')}
        />
        {/* Backup/Restore */}
        <View style={styles.backupContainer}>
          <Button
            title="💾 نسخة احتياطية للبيانات"
            onPress={handleBackupData}
            variant="outline"
            size="medium"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'customer' && styles.toggleBtnActive]}
          onPress={() => setViewMode('customer')}
        >
          <Text style={[styles.toggleText, viewMode === 'customer' && styles.toggleTextActive]}>
            👤 حسب المشترك
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'cow' && styles.toggleBtnActive]}
          onPress={() => setViewMode('cow')}
        >
          <Text style={[styles.toggleText, viewMode === 'cow' && styles.toggleTextActive]}>
            🐄 حسب البقرة
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <Button
          title="📄 PDF"
          onPress={handleExportPdf}
          variant="primary"
          size="small"
          loading={exporting}
        />
        <Button
          title="💾 نسخة احتياطية"
          onPress={handleBackupData}
          variant="outline"
          size="small"
        />
      </View>

      {/* Results */}
      {viewMode === 'customer' ? (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <DistributionResultCard
              result={item}
              onExportCard={() => handleExportCustomerCard(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      ) : (
        <FlatList
          data={Object.entries(resultsByCow)}
          keyExtractor={([cowId]) => cowId}
          renderItem={({ item: [cowId, data] }) => (
            <View style={styles.cowGroup}>
              <View style={styles.cowGroupHeader}>
                <Text style={styles.cowGroupName}>🐄 {data.cowName}</Text>
                <TouchableOpacity
                  style={styles.cowExportBtn}
                  onPress={() => handleExportCowSummary(cowId)}
                >
                  <Text style={styles.cowExportText}>📄 تصدير</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cowGroupCount}>
                {data.results.length} مشتركين
              </Text>
              {data.results.map(result => (
                <DistributionResultCard
                  key={result.id}
                  result={result}
                  onExportCard={() => handleExportCustomerCard(result.id)}
                />
              ))}
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row-reverse',
    margin: 16,
    marginBottom: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  toggleTextActive: {
    color: Colors.textPrimary,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },

  list: {
    padding: 16,
    paddingTop: 8,
  },

  // Cow Group
  cowGroup: {
    marginBottom: 20,
  },
  cowGroupHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cowGroupName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cowExportBtn: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cowExportText: {
    fontSize: 12,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  cowGroupCount: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'right',
    marginBottom: 10,
  },

  // Backup
  backupContainer: {
    padding: 20,
    alignItems: 'center',
  },
});
