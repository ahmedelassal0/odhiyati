import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DistributionResult } from '../types';
import { PARTS_MAP } from '../constants/parts';
import { Colors } from '../constants/colors';

interface DistributionResultCardProps {
  result: DistributionResult;
  onExportCard?: () => void;
}

export function DistributionResultCard({ result, onExportCard }: DistributionResultCardProps) {
  const receivedParts = result.parts.filter(p => p.received);
  const missedParts = result.parts.filter(p => !p.received);

  const receivedPartsByCow = receivedParts.reduce((acc, part) => {
    let sourceCow = result.cowName;
    let displayNote = part.note;
    
    if (part.note && part.note.startsWith('من ')) {
      sourceCow = part.note.replace('من ', '');
      displayNote = undefined; // Don't show the note since it's now in the group header
    }
    
    if (!acc[sourceCow]) {
      acc[sourceCow] = [];
    }
    acc[sourceCow].push({ ...part, note: displayNote });
    return acc;
  }, {} as Record<string, typeof receivedParts>);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{result.customerName.charAt(0)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.customerName}>{result.customerName}</Text>
          <Text style={styles.cowName}>🐄 البقرة المخصصة: {result.cowName}</Text>
        </View>
        <View style={styles.headerActions}>
          {onExportCard && (
            <TouchableOpacity style={styles.exportBtn} onPress={onExportCard}>
              <Text style={styles.exportBtnText}>📄</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Received Parts Grouped By Cow */}
      {Object.entries(receivedPartsByCow).map(([cowName, parts]) => (
        <View key={cowName} style={styles.section}>
          <Text style={styles.sectionTitle}>
            ✅ استلم من: {cowName}
          </Text>
          <View style={styles.partsList}>
            {parts.map((part, index) => (
              <View key={index} style={styles.partRow}>
                <Text style={styles.partIcon}>
                  {PARTS_MAP[part.partKey]?.icon || ''}
                </Text>
                <Text style={styles.partLabel}>{part.label}</Text>
                <View style={styles.partValue}>
                  {part.weight ? (
                    <Text style={styles.weightText}>{part.weight} كجم</Text>
                  ) : (
                    <Text style={styles.yesText}>✓</Text>
                  )}
                </View>
                {part.note && (
                  <Text style={styles.partNote}>{part.note}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Missed Parts */}
      {missedParts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitleMissed}>❌ غير متاح</Text>
          <View style={styles.partsList}>
            {missedParts.map((part, index) => (
              <View key={index} style={[styles.partRow, styles.partRowMissed]}>
                <Text style={styles.partIcon}>
                  {PARTS_MAP[part.partKey]?.icon || ''}
                </Text>
                <Text style={[styles.partLabel, styles.partLabelMissed]}>
                  {part.label}
                </Text>
                {part.note && (
                  <Text style={styles.partNoteMissed}>{part.note}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {receivedParts.length} من {result.parts.length} جزء مستلم
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 14,
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  exportBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportBtnText: {
    fontSize: 18,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
    textAlign: 'right',
    marginBottom: 8,
  },
  sectionTitleMissed: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
    textAlign: 'right',
    marginBottom: 8,
  },
  partsList: {
    gap: 4,
  },
  partRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.successBg,
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  partRowMissed: {
    backgroundColor: Colors.errorBg,
  },
  partIcon: {
    fontSize: 16,
  },
  partLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  partLabelMissed: {
    color: Colors.textMuted,
  },
  partValue: {
    paddingHorizontal: 8,
  },
  weightText: {
    fontSize: 13,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  yesText: {
    fontSize: 16,
    color: Colors.success,
    fontWeight: '700',
  },
  partNote: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  partNoteMissed: {
    fontSize: 11,
    color: Colors.error,
    fontStyle: 'italic',
  },
  summary: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
