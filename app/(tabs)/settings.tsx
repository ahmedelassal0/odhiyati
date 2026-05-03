import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '@/src/constants/colors';
import { useSettingsStore } from '@/src/store/settingsStore';
import { PartRule } from '@/src/types';

export default function SettingsScreen() {
  const { parts, loadSettings, updatePartConfig } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, []);

  const handleIncrement = (part: PartRule) => {
    updatePartConfig(part.key, { perCow: part.perCow + 1 });
  };

  const handleDecrement = (part: PartRule) => {
    if (part.perCow > 1) {
      updatePartConfig(part.key, { perCow: part.perCow - 1 });
    }
  };

  const handleToggleExclusive = (part: PartRule) => {
    updatePartConfig(part.key, { exclusive: !part.exclusive });
  };

  const renderPartItem = ({ item }: { item: PartRule }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.partIcon}>{item.icon}</Text>
          <Text style={styles.partLabel}>{item.label}</Text>
        </View>
        
        <View style={styles.controlsRow}>
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>العدد الأقصى لكل بقرة</Text>
            <View style={styles.counter}>
              <TouchableOpacity 
                style={styles.counterBtn} 
                onPress={() => handleIncrement(item)}
              >
                <Text style={styles.counterBtnText}>+</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{item.perCow}</Text>
              <TouchableOpacity 
                style={[styles.counterBtn, item.perCow <= 1 && styles.counterBtnDisabled]} 
                onPress={() => handleDecrement(item)}
                disabled={item.perCow <= 1}
              >
                <Text style={styles.counterBtnText}>-</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>جزء حصري لمشترك واحد؟</Text>
            <TouchableOpacity 
              style={[styles.toggleBtn, item.exclusive && styles.toggleBtnActive]}
              onPress={() => handleToggleExclusive(item)}
            >
              <Text style={[styles.toggleBtnText, item.exclusive && styles.toggleBtnTextActive]}>
                {item.exclusive ? 'نعم (حصري)' : 'لا (مشترك)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ إعدادات التوزيع</Text>
        <Text style={styles.headerDesc}>تعديل الحد الأقصى لكل جزء من أجزاء البقرة وحصريته.</Text>
      </View>
      <FlatList
        data={parts}
        keyExtractor={item => item.key}
        renderItem={renderPartItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  headerDesc: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 12,
  },
  partIcon: {
    fontSize: 24,
    marginLeft: 12,
  },
  partLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  controlsRow: {
    gap: 16,
  },
  controlGroup: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  counter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  counterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceElevated,
  },
  counterBtnDisabled: {
    opacity: 0.5,
  },
  counterBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  counterValue: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'center',
    color: Colors.textPrimary,
  },
  toggleBtn: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primaryLight + '20',
    borderColor: Colors.primary,
  },
  toggleBtnText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: Colors.primary,
  },
});
