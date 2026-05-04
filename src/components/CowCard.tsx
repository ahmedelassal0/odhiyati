import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Cow, PartKey, Customer } from '../types';
import { Badge } from './ui/Badge';
import { Colors } from '../constants/colors';
import { useCowStore } from '../store/cowStore';
import { PARTS, PARTS_MAP } from '../constants/parts';
import { useFocusEffect } from 'expo-router';

interface CowCardProps {
  cow: Cow;
  subscriberCount?: number;
  cowCustomers?: Customer[];
  onPress?: () => void;
  onDelete?: () => void;
}

export function CowCard({ cow, subscriberCount = 0, cowCustomers = [], onPress, onDelete }: CowCardProps) {
  const progress = cow.totalShares > 0 ? (cow.takenShares / cow.totalShares) : 0;
  const remaining = cow.totalShares - cow.takenShares;
  const isComplete = cow.status === 'complete';
  const { getCowPartData } = useCowStore();
  const [partData, setPartData] = React.useState<Record<string, { weight: number; readiness: string }> | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      getCowPartData(cow.id).then(setPartData).catch(console.error);
    }, [cow.id, getCowPartData])
  );

  const nonReadyParts = React.useMemo(() => {
    if (!partData) return [];
    const result = [];
    for (const [key, value] of Object.entries(partData)) {
      if (value.readiness === 'not_ready' || value.readiness === 'preparing') {
        result.push({ key, ...value });
      }
    }
    return result;
  }, [partData]);

  const [isExpanded, setIsExpanded] = React.useState(false);

  const sharingInfo = React.useMemo(() => {
    return PARTS.map(partRule => {
      const requestersInCow = cowCustomers.filter(c => c.requestedParts.includes(partRule.key));
      const totalRequestedShares = requestersInCow.reduce((sum, c) => sum + c.shares, 0);
      
      // If the part is shared (like meat/liver), it's divided by the total shares requesting it
      // capped at the cow's total capacity if necessary (though usually capacity is 7 shares)
      const divisor = partRule.perCow > 1 ? totalRequestedShares : 1;
      
      return {
        ...partRule,
        requesters: requestersInCow.length,
        totalShares: totalRequestedShares,
        divisor: divisor
      };
    });
  }, [cowCustomers]);

  return (
    <TouchableOpacity
      style={[styles.card, isComplete && styles.cardComplete]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, isComplete && styles.iconContainerComplete]}>
          <Text style={styles.icon}>🐄</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{cow.name}</Text>
          <Text style={styles.subtitle}>
            {subscriberCount} مشتركين
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Badge
            text={isComplete ? 'مكتمل' : 'متاح'}
            variant={isComplete ? 'success' : 'info'}
            size="small"
          />
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteBtnText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(progress * 100, 100)}%` },
              isComplete && styles.progressFillComplete,
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>
            {cow.takenShares} / {cow.totalShares} سهم
          </Text>
          <Text style={[styles.remainingText, remaining === 0 && styles.remainingZero]}>
            {remaining > 0 ? `${remaining} متبقي` : 'مكتمل ✓'}
          </Text>
        </View>
      </View>

      {/* Non-Ready Parts */}
      {nonReadyParts.length > 0 && (
        <View style={styles.partsContainer}>
          <Text style={styles.partsTitle}>الأجزاء غير الجاهزة:</Text>
          <View style={styles.partsList}>
            {nonReadyParts.map(part => {
              const rule = PARTS_MAP[part.key as PartKey];
              const isPreparing = part.readiness === 'preparing';
              return (
                <View key={part.key} style={[styles.partBadge, isPreparing ? styles.partBadgePreparing : styles.partBadgeNotReady]}>
                  <Text style={styles.partIcon}>{rule?.icon}</Text>
                  <Text style={[styles.partLabel, isPreparing ? styles.partLabelPreparing : styles.partLabelNotReady]}>
                    {rule?.label} {isPreparing ? '(بيجهز)' : '(غير جاهز)'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Sharing Details Collapsible */}
      <View style={styles.sharingSection}>
        <TouchableOpacity 
          style={styles.sharingToggle} 
          onPress={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          <Text style={styles.sharingToggleText}>
            {isExpanded ? 'إخفاء تفاصيل التقسيم ▲' : 'عرض تفاصيل التقسيم ▼'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sharingList}>
            {sharingInfo.map(item => (
              <View key={item.key} style={styles.sharingRow}>
                <Text style={styles.sharingRowLabel}>{item.icon} {item.label}</Text>
                <View style={styles.sharingRowValueContainer}>
                  <Text style={styles.sharingRowDemand}>مطلوب: {item.requesters}</Text>
                  <Badge 
                    text={`يُقسم على ${item.divisor}`}
                    variant={item.requesters > item.perCow ? 'error' : item.requesters > 0 ? 'success' : 'info'}
                    size="small"
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

    </TouchableOpacity>
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
  cardComplete: {
    borderColor: Colors.success,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  iconContainerComplete: {
    backgroundColor: Colors.successBg,
  },
  icon: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'right',
  },
  headerActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: 4,
  },
  progressFillComplete: {
    backgroundColor: Colors.success,
  },
  progressLabels: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  remainingText: {
    fontSize: 12,
    color: Colors.secondaryLight,
    fontWeight: '600',
  },
  remainingZero: {
    color: Colors.success,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 18,
  },
  partsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  partsTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    textAlign: 'right',
  },
  partsList: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  partBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  partBadgeNotReady: {
    backgroundColor: Colors.error + '10',
    borderColor: Colors.error + '30',
  },
  partBadgePreparing: {
    backgroundColor: Colors.warning + '10',
    borderColor: Colors.warning + '30',
  },
  partIcon: {
    fontSize: 12,
  },
  partLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  partLabelNotReady: {
    color: Colors.error,
  },
  partLabelPreparing: {
    color: Colors.warning,
  },
  
  // Sharing Section
  sharingSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: 8,
  },
  sharingToggle: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  sharingToggleText: {
    fontSize: 12,
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  sharingList: {
    marginTop: 8,
    gap: 6,
  },
  sharingRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.divider + '40',
  },
  sharingRowLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  sharingRowValueContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  sharingRowDemand: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
