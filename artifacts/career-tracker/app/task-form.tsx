import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryBadge } from '@/components/CategoryBadge';
import { useColors } from '@/hooks/useColors';
import { useAppStore } from '@/store/useAppStore';
import type { TaskCategory } from '@/types';

const CATEGORIES: TaskCategory[] = [
  'LeetCode',
  'Projects',
  'System Design',
  'Applications',
  'Learning',
  'Networking',
];

const DURATIONS = [15, 25, 30, 45, 60, 90, 120];

export default function TaskFormScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; category?: string }>();
  const tasks = useAppStore((s) => s.tasks);
  const addTask = useAppStore((s) => s.addTask);
  const updateTask = useAppStore((s) => s.updateTask);

  const editingTask = params.id ? tasks.find((t) => t.id === params.id) : null;

  const [title, setTitle] = useState(editingTask?.title ?? '');
  const [description, setDescription] = useState(editingTask?.description ?? '');
  const [category, setCategory] = useState<TaskCategory>(
    editingTask?.category ?? ((params.category as TaskCategory) || 'LeetCode')
  );
  const [duration, setDuration] = useState(editingTask?.estimatedDuration ?? 25);

  const isValid = title.trim().length > 0;

  const handleSave = () => {
    if (!isValid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (editingTask) {
      updateTask(editingTask.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        estimatedDuration: duration,
      });
    } else {
      addTask({
        title: title.trim(),
        description: description.trim(),
        category,
        estimatedDuration: duration,
      });
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? insets.top + 67 : insets.top + 20,
            paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 40),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="x" size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {editingTask ? 'Edit Task' : 'New Task'}
          </Text>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: isValid ? colors.primary : colors.border }]}
            onPress={handleSave}
            disabled={!isValid}
          >
            <Text style={[styles.saveBtnText, { color: isValid ? '#fff' : colors.mutedForeground }]}>
              {editingTask ? 'Save' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Title *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.foreground,
                borderColor: title.trim() ? colors.primary : colors.border,
              },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Solve 2 LeetCode mediums"
            placeholderTextColor={colors.mutedForeground}
            maxLength={100}
            autoFocus
            returnKeyType="next"
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Notes</Text>
          <TextInput
            style={[
              styles.input,
              styles.textarea,
              { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add details, links, or context..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            maxLength={500}
            textAlignVertical="top"
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <Pressable
                  key={cat}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor: active ? `${colors.primary}22` : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCategory(cat);
                  }}
                >
                  <CategoryBadge category={cat} small />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Duration */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Estimated Duration · {duration}m
          </Text>
          <View style={styles.durationRow}>
            {DURATIONS.map((d) => {
              const active = duration === d;
              return (
                <Pressable
                  key={d}
                  style={[
                    styles.durationChip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setDuration(d);
                  }}
                >
                  <Text
                    style={[
                      styles.durationText,
                      { color: active ? '#fff' : colors.mutedForeground },
                    ]}
                  >
                    {d}m
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20 },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  field: { gap: 10 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  textarea: { height: 100, paddingTop: 14 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 4,
  },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  durationText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
