import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCowStore } from '@/src/store/cowStore';
import { useCustomerStore } from '@/src/store/customerStore';
import { CowCard } from '@/src/components/CowCard';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Button } from '@/src/components/ui/Button';
import { Colors } from '@/src/constants/colors';
import { Cow } from '@/src/types';

export default function CowsScreen() {
  const router = useRouter();
  const { cows, loadCows, deleteCow } = useCowStore();
  const { customers, loadCustomers } = useCustomerStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCows();
    loadCustomers();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCows(), loadCustomers()]);
    setRefreshing(false);
  }, []);

  const getSubscriberCount = (cowId: string) => {
    return customers.filter(c => c.cowId === cowId).length;
  };

  const handleDelete = (cow: Cow) => {
    const subscribers = getSubscriberCount(cow.id);
    if (subscribers > 0) {
      Alert.alert(
        'لا يمكن الحذف',
        `البقرة "${cow.name}" مرتبطة بـ ${subscribers} مشتركين. قم بإلغاء تخصيصهم أولاً.`,
        [{ text: 'موافق' }]
      );
      return;
    }
    
    Alert.alert(
      'حذف البقرة',
      `هل أنت متأكد من حذف "${cow.name}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => deleteCow(cow.id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{cows.length}</Text>
          <Text style={styles.summaryLabel}>إجمالي</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>
            {cows.filter(c => c.status === 'complete').length}
          </Text>
          <Text style={styles.summaryLabel}>مكتملة</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.secondary }]}>
            {cows.filter(c => c.status === 'available').length}
          </Text>
          <Text style={styles.summaryLabel}>متاحة</Text>
        </View>
      </View>

      {/* Add Button */}
      <View style={styles.addButtonContainer}>
        <Button
          title="إضافة بقرة جديدة"
          icon="🐄"
          onPress={() => router.push('/cow-form')}
          fullWidth
          size="large"
        />
      </View>

      {/* Cow List */}
      <FlatList
        data={cows}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const cowCustomers = customers.filter(c => c.cowId === item.id);
          return (
            <CowCard
              cow={item}
              subscriberCount={cowCustomers.length}
              cowCustomers={cowCustomers}
              onPress={() => router.push(`/cow-form?id=${item.id}`)}
              onDelete={() => handleDelete(item)}
            />
          );
        }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="🐄"
            title="لا يوجد أبقار بعد"
            description="أضف أول بقرة لبدء تسجيل الذبائح"
            actionTitle="إضافة بقرة"
            onAction={() => router.push('/cow-form')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.divider,
  },
  addButtonContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  list: {
    padding: 16,
    paddingTop: 4,
  },
});
