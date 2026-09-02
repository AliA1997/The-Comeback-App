import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/shared/theme/useColors';
import type { List } from '../types';

interface Props {
  list: List;
  onPress: (list: List) => void;
  onEdit?: (list: List) => void;
}

/**
 * Memoized on the list reference, matching the TaskCard template. `onEdit`
 * identity is ignored for the same reason: callers pass inline arrows.
 */
function ListCardImpl({ list, onPress, onEdit }: Props) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${list.name}, ${list.taskCount} tasks`}
      onPress={() => onPress(list)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: `${colors.primary}1F` }]}>
        <Feather name="list" size={18} color={colors.primary} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {list.name}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {list.taskCount === 0
            ? 'No tasks yet'
            : `${list.taskCount} ${list.taskCount === 1 ? 'task' : 'tasks'}`}
        </Text>
      </View>

      {onEdit ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Rename ${list.name}`}
          hitSlop={12}
          onPress={() => onEdit(list)}
          style={styles.editBtn}
        >
          <Feather name="edit-2" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      ) : null}

      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

export const ListCard = React.memo(ListCardImpl, (prev, next) => prev.list === next.list);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    minHeight: 72,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  editBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
