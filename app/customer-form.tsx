import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCustomerStore } from '@/src/store/customerStore';
import { useCowStore } from '@/src/store/cowStore';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { PartsSelector } from '@/src/components/PartsSelector';
import { Colors } from '@/src/constants/colors';
import { PartKey } from '@/src/types';
import { TouchableOpacity } from 'react-native';

export default function CustomerFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  
  const { customers, addCustomer, updateCustomer } = useCustomerStore();
  const { cows, loadCows, recalculateTakenShares } = useCowStore();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [shares, setShares] = useState('1');
  const [cowId, setCowId] = useState<string | null>(null);
  const [requestedParts, setRequestedParts] = useState<PartKey[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCows();
  }, []);

  useEffect(() => {
    if (isEdit) {
      const customer = customers.find(c => c.id === id);
      if (customer) {
        setName(customer.name);
        setPhone(customer.phone);
        setAddress(customer.address);
        setShares(customer.shares.toString());
        setCowId(customer.cowId);
        setRequestedParts([...customer.requestedParts]);
        setNotes(customer.notes);
      }
    }
  }, [id, customers]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'اسم المشترك مطلوب';
    if (!shares || parseInt(shares) < 1) newErrors.shares = 'عدد الأسهم يجب أن يكون 1 على الأقل';
    
    // Check cow capacity
    if (cowId) {
      const cow = cows.find(c => c.id === cowId);
      if (cow) {
        const existingCustomersShares = customers
          .filter(c => c.cowId === cowId && c.id !== id)
          .reduce((sum, c) => sum + c.shares, 0);
        const newTotal = existingCustomersShares + parseInt(shares || '0');
        if (newTotal > cow.totalShares) {
          newErrors.cowId = `البقرة ممتلئة: ${existingCustomersShares}/${cow.totalShares} سهم مأخوذ`;
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        shares: parseInt(shares),
        cowId,
        requestedParts,
        notes: notes.trim(),
      };

      const oldCowId = isEdit ? customers.find(c => c.id === id)?.cowId : null;
      
      if (isEdit) {
        await updateCustomer(id!, data);
      } else {
        await addCustomer(data);
      }

      // Recalculate cow shares
      if (cowId) await recalculateTakenShares(cowId);
      if (oldCowId && oldCowId !== cowId) await recalculateTakenShares(oldCowId);

      router.back();
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء الحفظ');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const togglePart = (partKey: PartKey) => {
    setRequestedParts(prev =>
      prev.includes(partKey)
        ? prev.filter(p => p !== partKey)
        : [...prev, partKey]
    );
  };

  const selectAllParts = () => {
    const allParts: PartKey[] = ['meat', 'liver', 'kidney', 'heart', 'spleen', 'tripe', 'lungs', 'intestines', 'frontLeg', 'backLeg', 'head'];
    setRequestedParts(allParts);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>{isEdit ? '✏️' : '➕'}</Text>
          <Text style={styles.headerTitle}>
            {isEdit ? 'تعديل المشترك' : 'إضافة مشترك جديد'}
          </Text>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المعلومات الأساسية</Text>
          
          <Input
            label="اسم المشترك *"
            icon="👤"
            value={name}
            onChangeText={setName}
            placeholder="أدخل اسم المشترك"
            error={errors.name}
          />
          
          <Input
            label="رقم الهاتف"
            icon="📱"
            value={phone}
            onChangeText={setPhone}
            placeholder="أدخل رقم الهاتف"
            keyboardType="phone-pad"
          />
          
          <Input
            label="العنوان"
            icon="📍"
            value={address}
            onChangeText={setAddress}
            placeholder="أدخل العنوان"
          />
          
          <Input
            label="عدد الأسهم *"
            icon="📊"
            value={shares}
            onChangeText={setShares}
            placeholder="1"
            keyboardType="numeric"
            error={errors.shares}
          />
          
          <Input
            label="ملاحظات"
            icon="📝"
            value={notes}
            onChangeText={setNotes}
            placeholder="ملاحظات إضافية..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Cow Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تخصيص البقرة</Text>
          {errors.cowId && <Text style={styles.errorText}>{errors.cowId}</Text>}
          
          <TouchableOpacity
            style={[styles.cowOption, !cowId && styles.cowOptionSelected]}
            onPress={() => setCowId(null)}
          >
            <Text style={styles.cowOptionText}>بدون بقرة (لاحقاً)</Text>
            {!cowId && <Text style={styles.checkMark}>✓</Text>}
          </TouchableOpacity>
          
          {cows.map(cow => {
            const isSelected = cowId === cow.id;
            const remaining = cow.totalShares - cow.takenShares;
            const isFull = remaining <= 0 && !isSelected;
            
            return (
              <TouchableOpacity
                key={cow.id}
                style={[
                  styles.cowOption,
                  isSelected && styles.cowOptionSelected,
                  isFull && styles.cowOptionDisabled,
                ]}
                onPress={() => !isFull && setCowId(cow.id)}
                disabled={isFull}
              >
                <View style={styles.cowOptionInfo}>
                  <Text style={[styles.cowOptionText, isFull && styles.cowOptionTextDisabled]}>
                    🐄 {cow.name}
                  </Text>
                  <Text style={[styles.cowOptionShares, isFull && styles.cowOptionTextDisabled]}>
                    {remaining > 0 ? `${remaining} أسهم متبقية` : 'مكتمل'}
                  </Text>
                </View>
                {isSelected && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Parts Selection */}
        <View style={styles.section}>
          <View style={styles.partsSectionHeader}>
            <Text style={styles.sectionTitle}>الأجزاء المطلوبة</Text>
            <Button
              title="تحديد الكل"
              onPress={selectAllParts}
              variant="ghost"
              size="small"
            />
          </View>
          <PartsSelector
            selectedParts={requestedParts}
            onTogglePart={togglePart}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={isEdit ? 'حفظ التعديلات' : 'إضافة المشترك'}
            onPress={handleSave}
            variant="primary"
            size="large"
            fullWidth
            loading={saving}
            icon={isEdit ? '💾' : '✅'}
          />
          <Button
            title="إلغاء"
            onPress={() => router.back()}
            variant="ghost"
            size="medium"
            fullWidth
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  
  // Header
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  headerIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  
  // Section
  section: {
    marginBottom: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 14,
  },
  partsSectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  // Cow selection
  cowOption: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cowOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  cowOptionDisabled: {
    opacity: 0.4,
  },
  cowOptionInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cowOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  cowOptionTextDisabled: {
    color: Colors.textMuted,
  },
  cowOptionShares: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  checkMark: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '700',
    marginRight: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 8,
  },
  
  // Actions
  actions: {
    gap: 10,
    marginTop: 8,
  },
  
  bottomSpacer: {
    height: 40,
  },
});
