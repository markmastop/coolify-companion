import { View, Text, StyleSheet } from 'react-native';

interface StatCardProps {
  title: string;
  value: number;
  color: 'green' | 'red' | 'blue' | 'orange';
  icon: string;
  subtitle?: string;
}

export function StatCard({ title, value, color, icon, subtitle }: StatCardProps) {
  const getColors = () => {
    switch (color) {
      case 'green':
        return { background: '#DCFCE7', border: '#16A34A', text: '#15803D' };
      case 'red':
        return { background: '#FEE2E2', border: '#DC2626', text: '#DC2626' };
      case 'blue':
        return { background: '#DBEAFE', border: '#2563EB', text: '#1D4ED8' };
      case 'orange':
        return { background: '#FED7AA', border: '#EA580C', text: '#EA580C' };
      default:
        return { background: '#F3F4F6', border: '#6B7280', text: '#374151' };
    }
  };

  const colors = getColors();

  return (
    <View style={[
      styles.card,
      { 
        backgroundColor: colors.background,
        borderColor: colors.border,
      }
    ]}>
      <View style={styles.header}>
        <Text style={[styles.icon, { color: colors.text }]}>{icon}</Text>
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.text }]}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.8,
  },
});