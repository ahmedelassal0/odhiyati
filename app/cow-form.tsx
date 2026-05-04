import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
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
  
  const { cows, addCow, updateCow, setCowPartData, getCowPartData } = useCowStore();
  const { customers } = useCustomerStore();
  
  const [name, setName] = useState('');
  const [totalShares, setTotalShares] = useState(DEFAULT_SHARES_PER_COW.toString());
  const [partWeights, setPartWeights] = useState<Record<string, string>>({});
  const [partReadiness, setPartReadiness] = useState<Record<string, 'not_ready' | 'preparing' | 'ready'>>({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit) {
      const cow = cows.find(c => c.id === id);
      if (cow) {
        setName(cow.name);
        setTotalShares(cow.totalShares.toString());
        
        // Load data
        getCowPartData(cow.id).then(data => {
          const weightStrings: Record<string, string> = {};
          const readinessMap: Record<string, 'not_ready' | 'preparing' | 'ready'> = {};
          for (const [key, value] of Object.entries(data)) {
            weightStrings[key] = value.weight?.toString() || '';
            readinessMap[key] = value.readiness;
          }
          setPartWeights(weightStrings);
          setPartReadiness(readinessMap);
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
        
        // Save part data
        for (const part of PARTS) {
          const weightStr = partWeights[part.key];
          const weight = weightStr ? parseFloat(weightStr) : null;
          const readiness = partReadiness[part.key] || (['frontLeg', 'backLeg', 'head'].includes(part.key) ? 'not_ready' : 'ready');
          
          await setCowPartData(id!, part.key, { 
            weight: (weight !== null && !isNaN(weight)) ? weight : null, 
            readiness 
          });
        }
      } else {
        const newCow = await addCow(name.trim(), parseInt(totalShares));
        
        // Save part data for new cow
        for (const part of PARTS) {
          const weightStr = partWeights[part.key];
          const weight = weightStr ? parseFloat(weightStr) : null;
          const readiness = partReadiness[part.key] || (['frontLeg', 'backLeg', 'head'].includes(part.key) ? 'not_ready' : 'ready');

          await setCowPartData(newCow.id, part.key, {
            weight: (weight !== null && !isNaN(weight)) ? weight : null,
            readiness
          });
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
            <View key={part.key} style={styles.partCard}>
              <View style={styles.weightRow}>
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
              
              {/* Readiness Selector */}
              <View style={styles.readinessContainer}>
                {[
                  { id: 'not_ready', label: 'غير جاهز', color: Colors.error },
                  { id: 'preparing', label: 'بيجهز', color: Colors.warning },
                  { id: 'ready', label: 'جاهز', color: Colors.success },
                ].map((status) => {
                  const currentReadiness = partReadiness[part.key] || (['frontLeg', 'backLeg', 'head'].includes(part.key) ? 'not_ready' : 'ready');
                  const isActive = currentReadiness === status.id;
                  
                  return (
                    <TouchableOpacity
                      key={status.id}
                      style={[
                        styles.readinessBtn,
                        isActive && { backgroundColor: status.color + '20', borderColor: status.color }
                      ]}
                      onPress={() => setPartReadiness(prev => ({ ...prev, [part.key]: status.id as any }))}
                    >
                      <Text style={[
                        styles.readinessText,
                        isActive && { color: status.color, fontWeight: '700' }
                      ]}>
                        {status.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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
  
  // Parts
  partCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  weightRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  weightLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
    width: 100,
    textAlign: 'right',
  },
  weightInputContainer: {
    flex: 1,
  },
  weightInput: {
    marginBottom: 0,
  },
  readinessContainer: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 4,
  },
  readinessBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  readinessText: {
    fontSize: 11,
    color: Colors.textMuted,
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
