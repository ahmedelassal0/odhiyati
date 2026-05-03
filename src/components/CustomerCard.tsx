import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Customer } from '../types';
import { Badge } from './ui/Badge';
import { Colors } from '../constants/colors';
import { PARTS_MAP } from '../constants/parts';

interface CustomerCardProps {
  customer: Customer;
  cowName?: string;
  onPress?: () => void;
  onDelete?: () => void;
}

export function CustomerCard({ customer, cowName, onPress, onDelete }: CustomerCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {customer.name.charAt(0)}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{customer.name}</Text>
          {customer.phone ? (
            <Text style={styles.phone}>📱 {customer.phone}</Text>
          ) : null}
        </View>
        <View style={styles.headerActions}>
          <Badge
            text={`${customer.shares} سهم`}
            variant="info"
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

      {/* Cow assignment */}
      {cowName && (
        <View style={styles.cowRow}>
          <Text style={styles.cowLabel}>🐄 البقرة:</Text>
          <Text style={styles.cowName}>{cowName}</Text>
        </View>
      )}

      {/* Requested parts */}
      {customer.requestedParts.length > 0 && (
        <View style={styles.partsRow}>
          {customer.requestedParts.slice(0, 5).map(partKey => {
            const part = PARTS_MAP[partKey];
            return (
              <View key={partKey} style={styles.partChip}>
                <Text style={styles.partChipText}>
                  {part?.icon} {part?.label}
                </Text>
              </View>
            );
          })}
          {customer.requestedParts.length > 5 && (
            <View style={[styles.partChip, styles.moreChip]}>
              <Text style={styles.partChipText}>
                +{customer.requestedParts.length - 5}
              </Text>
            </View>
          )}
        </View>
      )}

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
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
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
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  phone: {
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
  cowRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  cowLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginLeft: 6,
  },
  cowName: {
    fontSize: 13,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  partsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  partChip: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
  },
  moreChip: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.surfaceBorder,
  },
  partChipText: {
    fontSize: 12,
    color: Colors.primaryLight,
  },
  partChipText: {
    fontSize: 12,
    color: Colors.primaryLight,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 18,
  },
});
