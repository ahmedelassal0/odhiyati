import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Cow } from '../types';
import { Badge } from './ui/Badge';
import { Colors } from '../constants/colors';

interface CowCardProps {
  cow: Cow;
  subscriberCount?: number;
  onPress?: () => void;
  onDelete?: () => void;
}

export function CowCard({ cow, subscriberCount = 0, onPress, onDelete }: CowCardProps) {
  const progress = cow.totalShares > 0 ? (cow.takenShares / cow.totalShares) : 0;
  const remaining = cow.totalShares - cow.takenShares;
  const isComplete = cow.status === 'complete';

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
});
