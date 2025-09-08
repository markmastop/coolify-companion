import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { StatusChip } from '@/components/StatusChip';
import { NormalizedStatus } from '@/utils/status';

interface ListItemProps {
  title: string;
  subtitle?: string;
  meta?: React.ReactNode[];
  status: NormalizedStatus;
  updatedAt?: string;
  actions?: React.ReactNode;
  onPress?: () => void;
  containerStyle?: ViewStyle;
  leftIcons?: React.ReactNode[];
}

export function ListItem({
  title,
  subtitle,
  meta = [],
  status,
  updatedAt,
  actions,
  onPress,
  containerStyle,
  leftIcons = [],
}: ListItemProps) {
  const Content = (
    <View style={[styles.row, containerStyle]}> 
      {leftIcons && leftIcons.length > 0 ? (
        <View style={styles.iconCol}>
          {leftIcons.map((icon, idx) => (
            <View key={idx} style={styles.iconWrap}>{icon}</View>
          ))}
        </View>
      ) : null}
      <View style={styles.left}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        ) : null}
        {meta?.map((node, idx) => (
          <View key={idx} style={styles.metaLine}>{node}</View>
        ))}
      </View>
      <View style={styles.right}>
        <StatusChip status={status} size="small" />
        {updatedAt ? (
          <Text style={styles.updatedAt} numberOfLines={1}>{updatedAt}</Text>
        ) : null}
        {actions ? (
          <View style={styles.actions}>{actions}</View>
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {Content}
      </TouchableOpacity>
    );
  }
  return Content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconCol: {
    width: 28,
    marginRight: 12,
    alignItems: 'center',
  },
  iconWrap: {
    marginVertical: 2,
  },
  left: {
    flex: 1,
    paddingRight: 12,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  metaLine: {
    marginBottom: 2,
  },
  updatedAt: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  actions: {
    marginTop: 6,
    gap: 8,
  },
});
