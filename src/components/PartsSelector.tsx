import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { PartKey } from '../types';
import { PARTS, PARTS_MAP } from '../constants/parts';
import { Colors } from '../constants/colors';

interface PartsSelectorProps {
  selectedParts: PartKey[];
  onTogglePart: (partKey: PartKey) => void;
  label?: string;
}

export function PartsSelector({ selectedParts, onTogglePart, label }: PartsSelectorProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.grid}>
        {PARTS.map(part => {
          const isSelected = selectedParts.includes(part.key);
          return (
            <TouchableOpacity
              key={part.key}
              style={[
                styles.partItem,
                isSelected && styles.partItemSelected,
                part.exclusive && styles.partItemExclusive,
              ]}
              onPress={() => onTogglePart(part.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.partIcon}>{part.icon}</Text>
              <Text style={[styles.partLabel, isSelected && styles.partLabelSelected]}>
                {part.label}
              </Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
              {part.exclusive && (
                <View style={styles.exclusiveBadge}>
                  <Text style={styles.exclusiveText}>حصري</Text>
                </View>
              )}
              <Text style={styles.perCow}>
                {part.perCow}/{part.perCow > 1 ? 'بقرة' : 'بقرة'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.hint}>
        تم اختيار {selectedParts.length} من {PARTS.length} جزء
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'right',
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  partItem: {
    width: '31%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    position: 'relative',
  },
  partItemSelected: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  partItemExclusive: {
    borderStyle: 'dashed',
  },
  partIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  partLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  partLabelSelected: {
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  exclusiveBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.warningBg,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  exclusiveText: {
    fontSize: 8,
    color: Colors.warning,
    fontWeight: '700',
  },
  perCow: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  hint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
});
