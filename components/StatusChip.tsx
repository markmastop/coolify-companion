import { View, Text, StyleSheet } from 'react-native';

interface StatusChipProps {
  status: 'up' | 'down' | 'running' | 'success' | 'failed' | 'queued' | 'cancelled';
  size?: 'small' | 'medium';
}

export function StatusChip({ status, size = 'medium' }: StatusChipProps) {
  const getStatusColors = () => {
    switch (status) {
      case 'up':
      case 'success':
        return { backgroundColor: '#10B981', textColor: '#FFFFFF', shadowColor: '#10B981' };
      case 'down':
      case 'failed':
        return { backgroundColor: '#EF4444', textColor: '#FFFFFF', shadowColor: '#EF4444' };
      case 'running':
        return { backgroundColor: '#6366F1', textColor: '#FFFFFF', shadowColor: '#6366F1' };
      case 'queued':
        return { backgroundColor: '#F59E0B', textColor: '#FFFFFF', shadowColor: '#F59E0B' };
      case 'cancelled':
        return { backgroundColor: '#6B7280', textColor: '#FFFFFF', shadowColor: '#6B7280' };
      default:
        return { backgroundColor: '#E5E7EB', textColor: '#374151', shadowColor: '#E5E7EB' };
    }
  };

  const { backgroundColor, textColor, shadowColor } = getStatusColors();
  const isSmall = size === 'small';

  return (
    <View style={[
      styles.chip,
      { 
        backgroundColor,
        shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      },
      isSmall ? styles.chipSmall : styles.chipMedium
    ]}>
      <Text style={[
        styles.chipText,
        { color: textColor },
        isSmall ? styles.chipTextSmall : styles.chipTextMedium
      ]}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  chipSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  chipTextSmall: {
    fontSize: 9,
    fontWeight: '700',
  },
  chipTextMedium: {
    fontSize: 11,
    fontWeight: '700',
  },
});