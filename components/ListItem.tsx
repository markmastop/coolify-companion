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
  rightButtons?: Array<{ icon: React.ReactNode; onPress: () => void }>;
  showStatus?: boolean;
  showUpdated?: boolean;
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
  rightButtons = [],
  showStatus = true,
  showUpdated = true,
}: ListItemProps) {
  // Enforce a 3-row layout to align with left icons and right buttons
  const maxLines = 3;
  const usedHeaderLines = 1 + (subtitle ? 1 : 0);
  const availableMeta = Math.max(0, maxLines - usedHeaderLines);
  const metaToShow = (meta || []).filter(Boolean).slice(0, availableMeta);
  const totalLines = 1 + (subtitle ? 1 : 0) + metaToShow.length;
  const placeholders = Math.max(0, maxLines - totalLines);

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
        {metaToShow.map((node, idx) => (
          <View key={idx} style={styles.metaLine}>{node}</View>
        ))}
        {Array.from({ length: placeholders }).map((_, i) => (
          <View key={`ph-${i}`} style={styles.placeholderLine}>
            <Text style={styles.placeholderText} numberOfLines={1}> </Text>
          </View>
        ))}
      </View>
      <View style={styles.right}>
        {showStatus ? (
          <StatusChip status={status} size="small" />
        ) : null}
        {showUpdated && updatedAt ? (
          <Text style={styles.updatedAt} numberOfLines={1}>{updatedAt}</Text>
        ) : null}
        {rightButtons && rightButtons.length > 0 ? (
          <View style={styles.buttonsCol}>
            {rightButtons.map((btn, idx) => (
              <TouchableOpacity key={idx} style={styles.smallBtn} onPress={btn.onPress}>
                {btn.icon}
              </TouchableOpacity>
            ))}
          </View>
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
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconCol: {
    width: 28,
    marginRight: 12,
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    gap: 0,
  },
  iconWrap: {
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  left: {
    flex: 1,
    paddingRight: 12,
  },
  right: {
    alignItems: 'flex-end',
    gap: 0,
    alignSelf: 'stretch',
  },
  buttonsCol: {
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
  },
  smallBtn: {
    width: 28,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 0,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 0,
    lineHeight: 24,
  },
  metaLine: {
    marginBottom: 0,
    minHeight: 24,
    justifyContent: 'center',
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
  placeholderLine: {
    minHeight: 24,
    justifyContent: 'center',
  },
  placeholderText: {
    lineHeight: 24,
  },
});
