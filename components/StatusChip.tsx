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
        return { backgroundColor: '#10B981', textColor: '#FFFFFF' };
      case 'down':
      case 'failed':
        return { backgroundColor: '#EF4444', textColor: '#FFFFFF' };
      case 'running':
        return { backgroundColor: '#3B82F6', textColor: '#FFFFFF' };
      case 'queued':
        return { backgroundColor: '#F59E0B', textColor: '#FFFFFF' };
      case 'cancelled':
        return { backgroundColor: '#6B7280', textColor: '#FFFFFF' };
      default:
        return { backgroundColor: '#E5E7EB', textColor: '#374151' };
    }
  };

  const { backgroundColor, textColor } = getStatusColors();
  const isSmall = size === 'small';

  return (
    <View style={[
      styles.chip,
      { backgroundColor },
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  chipSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  chipMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  chipTextSmall: {
    fontSize: 10,
  },
  chipTextMedium: {
    fontSize: 12,
  },
});