import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Warning } from '../types';
import { Colors } from '../constants/colors';

interface WarningBannerProps {
  warnings: Warning[];
}

export function WarningBanner({ warnings }: WarningBannerProps) {
  if (warnings.length === 0) return null;

  const getWarningStyle = (severity: Warning['severity']) => {
    switch (severity) {
      case 'high':
        return { bg: Colors.errorBg, border: Colors.error, icon: '🔴' };
      case 'medium':
        return { bg: Colors.warningBg, border: Colors.warning, icon: '🟡' };
      case 'low':
        return { bg: Colors.infoBg, border: Colors.info, icon: '🔵' };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>⚠️</Text>
        <Text style={styles.headerText}>
          تحذيرات التوزيع ({warnings.length})
        </Text>
      </View>
      {warnings.map((warning, index) => {
        const style = getWarningStyle(warning.severity);
        return (
          <View
            key={index}
            style={[
              styles.warningItem,
              { backgroundColor: style.bg, borderColor: style.border },
            ]}
          >
            <Text style={styles.warningIcon}>{style.icon}</Text>
            <Text style={styles.warningText}>{warning.message}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  headerIcon: {
    fontSize: 18,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.warning,
    textAlign: 'right',
  },
  warningItem: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    gap: 8,
  },
  warningIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'right',
    lineHeight: 20,
  },
});
