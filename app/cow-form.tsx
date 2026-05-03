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
import { useCowStore } from '@/src/store/cowStore';
import { useCustomerStore } from '@/src/store/customerStore';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Colors } from '@/src/constants/colors';
import { DEFAULT_SHARES_PER_COW, PARTS } from '@/src/constants/parts';

export default function CowFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  
  const { cows, addCow, updateCow, setCowPartWeight, getCowPartWeights } = useCowStore();
  const { customers } = useCustomerStore();
  
  const [name, setName] = useState('');
  const [totalShares, setTotalShares] = useState(DEFAULT_SHARES_PER_COW.toString());
  const [partWeights, setPartWeights] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit) {
      const cow = cows.find(c => c.id === id);
      if (cow) {
        setName(cow.name);
        setTotalShares(cow.totalShares.toString());
        
        // Load weights
        getCowPartWeights(cow.id).then(weights => {
          const weightStrings: Record<string, string> = {};
          for (const [key, value] of Object.entries(weights)) {
            weightStrings[key] = value.toString();
          }
          setPartWeights(weightStrings);
        });
      }
    }
  }, [id, cows]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'اسم/رقم البقرة مطلوب';
    if (!totalShares || parseInt(totalShares) < 1) {
      newErrors.totalShares = 'عدد الأسهم يجب أن يكون 1 على الأقل';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setSaving(true);
    try {
      if (isEdit) {
        await updateCow(id!, {
          name: name.trim(),
          totalShares: parseInt(totalShares),
        });
        
        // Save part weights
        for (const part of PARTS) {
          const weightStr = partWeights[part.key];
          const weight = weightStr ? parseFloat(weightStr) : null;
          if (weight !== null && !isNaN(weight)) {
            await setCowPartWeight(id!, part.key, weight);
          } else {
            await setCowPartWeight(id!, part.key, null);
          }
        }
      } else {
        const newCow = await addCow(name.trim(), parseInt(totalShares));
        
        // Save part weights for new cow
        for (const part of PARTS) {
          const weightStr = partWeights[part.key];
          const weight = weightStr ? parseFloat(weightStr) : null;
          if (weight !== null && !isNaN(weight)) {
            await setCowPartWeight(newCow.id, part.key, weight);
          }
        }
      }
      
      router.back();
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء الحفظ');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const cowSubscribers = isEdit
    ? customers.filter(c => c.cowId === id)
    : [];

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
          <Text style={styles.headerIcon}>🐄</Text>
          <Text style={styles.headerTitle}>
            {isEdit ? 'تعديل البقرة' : 'إضافة بقرة جديدة'}
          </Text>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المعلومات الأساسية</Text>
          
          <Input
            label="اسم / رقم البقرة *"
            icon="🐄"
            value={name}
            onChangeText={setName}
            placeholder="مثلاً: بقرة 1"
            error={errors.name}
          />
          
          <Input
            label="عدد الأسهم الكلي *"
            icon="📊"
            value={totalShares}
            onChangeText={setTotalShares}
            placeholder="7"
            keyboardType="numeric"
            error={errors.totalShares}
          />
        </View>

        {/* Part Weights (optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>أوزان الأجزاء (اختياري)</Text>
          <Text style={styles.sectionHint}>
            أدخل الوزن بالكيلوجرام — اتركه فارغاً إذا لم يتوفر
          </Text>
          
          {PARTS.map(part => (
            <View key={part.key} style={styles.weightRow}>
              <Text style={styles.weightLabel}>
                {part.icon} {part.label}
              </Text>
              <View style={styles.weightInputContainer}>
                <Input
                  value={partWeights[part.key] || ''}
                  onChangeText={(val) => setPartWeights(prev => ({ ...prev, [part.key]: val }))}
                  placeholder="كجم"
                  keyboardType="decimal-pad"
                  containerStyle={styles.weightInput}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Subscribers (edit mode only) */}
        {isEdit && cowSubscribers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>المشتركون ({cowSubscribers.length})</Text>
            {cowSubscribers.map(customer => (
              <View key={customer.id} style={styles.subscriberRow}>
                <Text style={styles.subscriberName}>👤 {customer.name}</Text>
                <Text style={styles.subscriberShares}>{customer.shares} سهم</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={isEdit ? 'حفظ التعديلات' : 'إضافة البقرة'}
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
    fontSize: 48,
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
    marginBottom: 10,
  },
  sectionHint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    marginBottom: 14,
    lineHeight: 18,
  },
  
  // Weights
  weightRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 4,
    gap: 12,
  },
  weightLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    width: 110,
    textAlign: 'right',
  },
  weightInputContainer: {
    flex: 1,
  },
  weightInput: {
    marginBottom: 4,
  },
  
  // Subscribers
  subscriberRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  subscriberName: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  subscriberShares: {
    fontSize: 13,
    color: Colors.textMuted,
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
