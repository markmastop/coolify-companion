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
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  iconCol: {
    width: 32,
    marginRight: 16,
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  iconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(248, 250, 252, 0.5)',
  },
  left: {
    flex: 1,
    paddingRight: 16,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
    alignSelf: 'stretch',
  },
  buttonsCol: {
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: 4,
  },
  smallBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 0,
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.8)' : '#FFFFFF',
    backdropFilter: Platform.OS === 'web' ? 'blur(10px)' : undefined,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  metaLine: {
    marginBottom: 4,
  },
  updatedAt: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: {
    marginTop: 8,
    gap: 10,
  },
});
