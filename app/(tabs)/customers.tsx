import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCustomerStore } from '@/src/store/customerStore';
import { useCowStore } from '@/src/store/cowStore';
import { CustomerCard } from '@/src/components/CustomerCard';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Button } from '@/src/components/ui/Button';
import { Colors } from '@/src/constants/colors';
import { Customer } from '@/src/types';

export default function CustomersScreen() {
  const router = useRouter();
  const { customers, loadCustomers, deleteCustomer } = useCustomerStore();
  const { cows, loadCows } = useCowStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadCows();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCustomers(), loadCows()]);
    setRefreshing(false);
  }, []);

  const filteredCustomers = customers.filter(c =>
    c.name.includes(searchQuery) ||
    c.phone.includes(searchQuery) ||
    c.address.includes(searchQuery)
  );

  const getCowName = (cowId: string | null) => {
    if (!cowId) return undefined;
    return cows.find(c => c.id === cowId)?.name;
  };

  const handleDelete = (customer: Customer) => {
    Alert.alert(
      'حذف المشترك',
      `هل أنت متأكد من حذف "${customer.name}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            await deleteCustomer(customer.id);
            // Recalculate cow shares
            if (customer.cowId) {
              const cowStore = useCowStore.getState();
              await cowStore.recalculateTakenShares(customer.cowId);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 البحث عن مشترك..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign="right"
        />
      </View>

      {/* Add Button */}
      <View style={styles.addButtonContainer}>
        <Button
          title="إضافة مشترك جديد"
          icon="➕"
          onPress={() => router.push('/customer-form')}
          fullWidth
          size="large"
        />
        <Text style={styles.countText}>
          {filteredCustomers.length} مشترك
        </Text>
      </View>

      {/* Customer List */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <CustomerCard
            customer={item}
            cowName={getCowName(item.cowId)}
            onPress={() => router.push(`/customer-form?id=${item.id}`)}
            onDelete={() => handleDelete(item)}
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
        ListEmptyComponent={
          <EmptyState
            icon="👥"
            title="لا يوجد مشتركين بعد"
            description="أضف أول مشترك لبدء إدارة التوزيع"
            actionTitle="إضافة مشترك"
            onAction={() => router.push('/customer-form')}
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
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    writingDirection: 'rtl',
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  countText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
    minWidth: 70,
    textAlign: 'center',
  },
  list: {
    padding: 16,
    paddingTop: 4,
  },
});
