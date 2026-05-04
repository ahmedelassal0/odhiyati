import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Alert, Linking } from 'react-native';
import { Colors } from '@/src/constants/colors';
import { useDistributionStore } from '@/src/store/distributionStore';
import { useCustomerStore } from '@/src/store/customerStore';
import { exportDeliveryCard, exportCustomerReceiptPdf } from '@/src/utils/pdfExporter';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { PARTS_MAP } from '@/src/constants/parts';
import { DistributionResult } from '@/src/types';

export default function DeliveryScreen() {
  const { results, loadResults, toggleDelivery } = useDistributionStore();
  const { customers, loadCustomers } = useCustomerStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'partial' | 'pending'>('all');
  const [selectedCowId, setSelectedCowId] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
    loadCustomers();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadResults();
    setRefreshing(false);
  }, []);

  const handleToggle = async (distributionId: string, partKey: string, currentStatus: boolean, readiness: string) => {
    if (readiness !== 'ready' && !currentStatus) {
      Alert.alert('تنبيه', 'هذا الجزء غير جاهز للتسليم بعد');
      return;
    }
    await toggleDelivery(distributionId, partKey, !currentStatus);
  };

  const handleSelectAll = async (resultId: string) => {
    const result = results.find(r => r.id === resultId);
    if (!result) return;
    
    const unDeliveredParts = result.parts.filter(p => p.received && !p.delivered && p.readiness === 'ready');
    if (unDeliveredParts.length === 0) {
      Alert.alert('تنبيه', 'لا توجد أجزاء جاهزة للتسليم حالياً');
      return;
    }
    for (const part of unDeliveredParts) {
      await toggleDelivery(resultId, part.partKey, true);
    }
  };

  const handleShareWhatsapp = async (resultId: string) => {
    const result = results.find(r => r.id === resultId);
    if (!result) return;
    
    try {
      await exportDeliveryCard(result);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء الـ PDF');
    }
  };

  const handleShareCustomer = async (resultId: string) => {
    const result = results.find(r => r.id === resultId);
    if (!result) return;
    const customer = customers.find(c => c.id === result.customerId);
    if (!customer || !customer.phone) {
      Alert.alert('تنبيه', 'لا يوجد رقم هاتف مسجل لهذا المشترك');
      return;
    }
    
    const receivedParts = result.parts.filter(p => p.received);
    
    let text = `مرحباً ${result.customerName}،\nتفاصيل إيصال الأضحية الخاص بك:\n\n`;
    
    receivedParts.forEach(p => {
      let displayLabel = p.label;
      if (p.partKey === 'meat') {
        const meatWeight = (customer.shares || 1) * 20;
        displayLabel = `${meatWeight} كيلو لحم`;
      }
      text += `- ${PARTS_MAP[p.partKey]?.icon || ''} ${displayLabel} ${p.weight ? `(${p.weight} كجم)` : ''} ${p.delivered ? '(✅ استلمت)' : '(⏳ يجهز)'}\n`;
    });
    
    text += `\nتقبل الله منا ومنكم صالح الأعمال 🤲`;
    
    let formattedPhone = customer.phone;
    if (formattedPhone.startsWith('01')) {
      formattedPhone = '+20' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }
    
    const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('خطأ', 'تطبيق واتساب غير مثبت على جهازك');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء فتح واتساب');
    }
  };

  const renderDeliveryCard = ({ item }: { item: DistributionResult }) => {
    const receivedParts = item.parts.filter(p => p.received);
    if (receivedParts.length === 0) return null;

    const allDelivered = receivedParts.every(p => p.delivered);
    const someDelivered = receivedParts.some(p => p.delivered);

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.customerName.charAt(0)}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.cowName}>🐄 {item.cowName}</Text>
          </View>
          <View style={styles.headerActionsContainer}>
            <View style={styles.statusBadge}>
              <Text style={[styles.statusText, allDelivered ? styles.statusTextComplete : someDelivered ? styles.statusTextPartial : styles.statusTextPending]}>
                {allDelivered ? 'مكتمل' : someDelivered ? 'جزئي' : 'لم يستلم'}
              </Text>
            </View>
            {!allDelivered && (
              <TouchableOpacity style={styles.selectAllBtn} onPress={() => handleSelectAll(item.id)}>
                <Text style={styles.selectAllBtnText}>تحديد الكل</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.partsList}>
          {receivedParts.map((part, index) => {
            const isReady = part.readiness === 'ready';
            const isPreparing = part.readiness === 'preparing';
            const isNotReady = part.readiness === 'not_ready';

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.partRow,
                  part.delivered ? styles.partRowDelivered : styles.partRowPending,
                  !isReady && !part.delivered && styles.partRowDisabled
                ]}
                onPress={() => handleToggle(item.id, part.partKey, !!part.delivered, part.readiness)}
                disabled={!isReady && !part.delivered}
              >
                <View style={[
                  styles.checkbox,
                  part.delivered && styles.checkboxChecked,
                  !isReady && !part.delivered && styles.checkboxDisabled
                ]}>
                  {part.delivered && <Text style={styles.checkIcon}>✓</Text>}
                </View>
                <Text style={styles.partIcon}>
                  {PARTS_MAP[part.partKey]?.icon || ''}
                </Text>
                <View style={styles.partContent}>
                  <Text style={[styles.partLabel, part.delivered && styles.partLabelDelivered]}>
                    {part.label}
                  </Text>
                  {!part.delivered && (
                    <Text style={[
                      styles.readinessBadge,
                      isReady ? styles.readinessReady : isPreparing ? styles.readinessPreparing : styles.readinessNotReady
                    ]}>
                      {isReady ? 'جاهز' : isPreparing ? 'بيجهز' : 'غير جاهز'}
                    </Text>
                  )}
                </View>
                {part.weight && (
                  <Text style={styles.weightText}>{part.weight} كجم</Text>
                )}
                {part.note && (
                  <Text style={styles.partNote}>{part.note}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleShareWhatsapp(item.id)}>
            <Text style={styles.whatsappBtnIcon}>📊</Text>
            <Text style={styles.actionBtnText}>تقرير داخلي</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.whatsappBtn} onPress={() => handleShareCustomer(item.id)}>
            <Text style={styles.whatsappBtnIcon}>💬</Text>
            <Text style={styles.whatsappBtnText}>إرسال للمشترك</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (results.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="🚚"
          title="لا توجد نتائج للتوصيل"
          description="قم بتشغيل التوزيع أولاً من شاشة التوزيع"
        />
      </View>
    );
  }

  const filteredResults = results.filter(r => {
    const matchesSearch = 
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cowName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCow = !selectedCowId || r.cowId === selectedCowId;

    const receivedParts = r.parts.filter(p => p.received);
    const allDelivered = receivedParts.length > 0 && receivedParts.every(p => p.delivered);
    const someDelivered = receivedParts.some(p => p.delivered);
    const noneDelivered = receivedParts.every(p => !p.delivered);

    let matchesStatus = true;
    if (statusFilter === 'delivered') matchesStatus = allDelivered;
    else if (statusFilter === 'partial') matchesStatus = someDelivered && !allDelivered;
    else if (statusFilter === 'pending') matchesStatus = noneDelivered;

    return matchesSearch && matchesCow && matchesStatus;
  });

  // Get unique cows for filter
  const uniqueCows = results.reduce((acc, result) => {
    if (!acc.find(c => c.id === result.cowId)) {
      acc.push({ id: result.cowId, name: result.cowName });
    }
    return acc;
  }, [] as { id: string; name: string }[]);

  return (
    <View style={styles.container}>
      <View style={styles.filterSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن مشترك أو بقرة..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={styles.statusFilters}>
          {[
            { id: 'all', label: 'الكل' },
            { id: 'pending', label: 'لم يستلم' },
            { id: 'partial', label: 'جزئي' },
            { id: 'delivered', label: 'مكتمل' },
          ].map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.statusFilterBtn,
                statusFilter === filter.id && styles.statusFilterBtnActive,
              ]}
              onPress={() => setStatusFilter(filter.id as any)}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  statusFilter === filter.id && styles.statusFilterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.cowFiltersContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ id: null, name: 'كل الأبقار' }, ...uniqueCows]}
            keyExtractor={item => item.id || 'all'}
            contentContainerStyle={styles.cowFilterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.cowFilterBtn,
                  selectedCowId === item.id && styles.cowFilterBtnActive
                ]}
                onPress={() => setSelectedCowId(item.id)}
              >
                <Text style={[
                  styles.cowFilterText,
                  selectedCowId === item.id && styles.cowFilterTextActive
                ]}>
                  {item.id ? `🐄 ${item.name}` : item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      <FlatList
        data={filteredResults}
        keyExtractor={item => item.id}
        renderItem={renderDeliveryCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
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
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  searchIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  statusFilters: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  statusFilterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  statusFilterBtnActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primary,
  },
  statusFilterText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statusFilterTextActive: {
    color: '#FFF',
  },
  cowFiltersContainer: {
    height: 36,
  },
  cowFilterList: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  cowFilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    minWidth: 80,
    alignItems: 'center',
  },
  cowFilterBtnActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primary,
  },
  cowFilterText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  cowFilterTextActive: {
    color: '#FFF',
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatarText: {
    color: Colors.primaryLight,
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cowName: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerActionsContainer: {
    alignItems: 'center',
    gap: 6,
  },
  selectAllBtn: {
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  selectAllBtnText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextPending: {
    color: Colors.textMuted,
  },
  statusTextPartial: {
    color: '#F59E0B', // Amber
  },
  statusTextComplete: {
    color: Colors.success,
  },
  partsList: {
    gap: 8,
  },
  partRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  partRowPending: {
    backgroundColor: Colors.surface,
    borderColor: Colors.cardBorder,
  },
  partRowDelivered: {
    backgroundColor: '#D1FAE5',
    borderColor: Colors.success,
  },
  partRowDisabled: {
    opacity: 0.6,
    backgroundColor: Colors.surface,
    borderColor: Colors.divider,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxDisabled: {
    borderColor: Colors.textMuted,
    backgroundColor: 'transparent',
  },
  checkIcon: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  partIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  partContent: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  partLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  readinessBadge: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    fontWeight: '700',
  },
  readinessReady: {
    backgroundColor: Colors.success + '20',
    color: Colors.success,
  },
  readinessPreparing: {
    backgroundColor: Colors.warning + '20',
    color: Colors.warning,
  },
  readinessNotReady: {
    backgroundColor: Colors.error + '20',
    color: Colors.error,
  },
  partLabelDelivered: {
    color: Colors.success,
    fontWeight: '600',
  },
  weightText: {
    fontSize: 13,
    color: Colors.primaryLight,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  partNote: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
    paddingHorizontal: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  actionBtnText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  whatsappBtnIcon: {
    fontSize: 16,
  },
  whatsappBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
