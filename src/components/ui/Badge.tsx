import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface BadgeProps {
  text: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export function Badge({ text, variant = 'neutral', size = 'small', style }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], styles[`size_${size}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  
  // Variants
  success: {
    backgroundColor: Colors.successBg,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  warning: {
    backgroundColor: Colors.warningBg,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  error: {
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  info: {
    backgroundColor: Colors.infoBg,
    borderWidth: 1,
    borderColor: Colors.info,
  },
  neutral: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  
  // Sizes
  size_small: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  size_medium: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  
  // Text
  text: {
    fontWeight: '600',
  },
  text_success: { color: Colors.success },
  text_warning: { color: Colors.warning },
  text_error: { color: Colors.error },
  text_info: { color: Colors.info },
  text_neutral: { color: Colors.textSecondary },
  
  textSize_small: { fontSize: 11 },
  textSize_medium: { fontSize: 13 },
});
