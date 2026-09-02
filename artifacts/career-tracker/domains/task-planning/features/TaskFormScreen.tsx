import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { ApiError } from '@workspace/api-client-react';
import { CreateTaskBody } from '@workspace/api-zod';
import { CategoryBadge } from '@/shared/ui/CategoryBadge';
import { ScorePill } from '@/shared/ui/ScorePill';
import { useColors } from '@/shared/theme/useColors';
import { taskTypeCategory } from '@/shared/types/task';
import { useLists } from '@/domains/lists/hooks/useLists';
import { useTask, useTaskTypes } from '../hooks/useTasks';
import { useCreateTask, useUpdateTask } from '../hooks/useTaskMutations';
import {
  DURATION_OPTIONS,
  PRIORITY_LABELS,
  PRIORITY_OPTIONS,
  type PriorityLevel,
} from '../types';

interface TaskFormValues {
  listId: string;
  taskTypeId: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  estimatedDurationMinutes: number;
}

/**
 * Create / edit a task (AC-3, AC-4).
 *
 * The score is never entered here — it is computed server-side from the task
 * type and priority (spec § 5.6.1). The preview pill shows what the server
 * will assign so "urgent doubles it" is visible before saving, not after.
 */
export function TaskFormScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; listId?: string; category?: string }>();

  const editing = useTask(params.id);
  const { lists } = useLists();
  const { taskTypes } = useTaskTypes();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const defaultTypeId = useMemo(() => {
    if (editing) return editing.taskTypeId;
    const byCategory = taskTypes.find((t) => t.label === params.category);
    return byCategory?.id ?? taskTypes[0]?.id ?? '';
  }, [editing, taskTypes, params.category]);

  const defaultListId = editing?.listId ?? params.listId ?? lists[0]?.id ?? '';

  const {
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(
      CreateTaskBody.pick({
        listId: true,
        taskTypeId: true,
        title: true,
        description: true,
        priority: true,
        estimatedDurationMinutes: true,
      }),
    ),
    defaultValues: {
      listId: defaultListId,
      taskTypeId: defaultTypeId,
      title: editing?.title ?? '',
      description: editing?.description ?? '',
      priority: editing?.priority ?? 'medium',
      estimatedDurationMinutes: editing?.estimatedDurationMinutes ?? 25,
    },
    mode: 'onSubmit',
  });

  // Lists and task types arrive asynchronously; seed the form once they land
  // rather than blocking the whole screen on them.
  useEffect(() => {
    if (!defaultListId || !defaultTypeId) return;
    reset(
      (current) => ({
        ...current,
        listId: current.listId || defaultListId,
        taskTypeId: current.taskTypeId || defaultTypeId,
      }),
      { keepDirtyValues: true },
    );
  }, [defaultListId, defaultTypeId, reset]);

  const selectedTypeId = watch('taskTypeId');
  const selectedPriority = watch('priority');
  const selectedListId = watch('listId');

  const previewScore = useMemo(() => {
    const type = taskTypes.find((t) => t.id === selectedTypeId);
    if (!type) return null;
    return selectedPriority === 'urgent' ? type.score * 2 : type.score;
  }, [taskTypes, selectedTypeId, selectedPriority]);

  const onSubmit = async (values: TaskFormValues) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const data = {
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
    };

    try {
      if (editing) {
        await updateTask.mutateAsync({ taskId: editing.id, data });
      } else {
        await createTask.mutateAsync({ data });
      }
      router.back();
    } catch (err: unknown) {
      const problem =
        err instanceof ApiError
          ? (err.data as { fieldErrors?: Record<string, string>; title?: string } | null)
          : null;

      const fieldErrors = problem?.fieldErrors;
      if (fieldErrors) {
        for (const [field, message] of Object.entries(fieldErrors)) {
          setError(field as keyof TaskFormValues, { message });
        }
        return;
      }

      setError('title', {
        message: problem?.title ?? "That didn't save. Tap Save to try again.",
      });
    }
  };

  const saving = isSubmitting || createTask.isPending || updateTask.isPending;
  const noLists = lists.length === 0;

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
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={12}
            onPress={() => router.back()}
          >
            <Feather name="x" size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {editing ? 'Edit task' : 'New task'}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={editing ? 'Save task' : 'Add task'}
            accessibilityState={{ disabled: saving || noLists }}
            style={[
              styles.saveBtn,
              { backgroundColor: saving || noLists ? colors.border : colors.primary },
            ]}
            disabled={saving || noLists}
            onPress={handleSubmit(onSubmit)}
          >
            <Text
              style={[
                styles.saveBtnText,
                { color: saving || noLists ? colors.mutedForeground : '#fff' },
              ]}
            >
              {editing ? 'Save' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>

        {noLists ? (
          <View style={[styles.notice, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="list" size={16} color={colors.primary} />
            <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
              Create a list first — tasks live inside one.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Create a list"
              onPress={() => router.replace('/list-form')}
            >
              <Text style={[styles.noticeAction, { color: colors.primary }]}>New list</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Title</Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                accessibilityLabel="Task title"
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.foreground,
                    borderColor: errors.title
                      ? colors.destructive
                      : value.trim()
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g. Solve 2 LeetCode mediums"
                placeholderTextColor={colors.mutedForeground}
                maxLength={100}
                autoFocus={!editing}
                returnKeyType="next"
              />
            )}
          />
          {errors.title ? (
            <Text style={[styles.fieldError, { color: colors.destructive }]}>
              {errors.title.message}
            </Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Notes</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                accessibilityLabel="Task notes"
                style={[
                  styles.input,
                  styles.textarea,
                  {
                    backgroundColor: colors.card,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Add details, links, or context..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                maxLength={500}
                textAlignVertical="top"
              />
            )}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>List</Text>
          <View style={styles.chipWrap}>
            {lists.map((list) => {
              const active = selectedListId === list.id;
              return (
                <Controller
                  key={list.id}
                  control={control}
                  name="listId"
                  render={({ field: { onChange } }) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={list.name}
                      accessibilityState={{ selected: active }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        onChange(list.id);
                      }}
                    >
                      <Text
                        style={[styles.chipText, { color: active ? '#fff' : colors.foreground }]}
                        numberOfLines={1}
                      >
                        {list.name}
                      </Text>
                    </Pressable>
                  )}
                />
              );
            })}
          </View>
          {errors.listId ? (
            <Text style={[styles.fieldError, { color: colors.destructive }]}>
              {errors.listId.message}
            </Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Task type</Text>
          <View style={styles.chipWrap}>
            {taskTypes.map((taskType) => {
              const active = selectedTypeId === taskType.id;
              return (
                <Controller
                  key={taskType.id}
                  control={control}
                  name="taskTypeId"
                  render={({ field: { onChange } }) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${taskType.label}, worth ${taskType.score} points`}
                      accessibilityState={{ selected: active }}
                      style={[
                        styles.typeOption,
                        {
                          backgroundColor: active ? `${colors.primary}22` : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        onChange(taskType.id);
                      }}
                    >
                      <CategoryBadge category={taskTypeCategory(taskType)} small />
                      <ScorePill score={taskType.score} small />
                    </Pressable>
                  )}
                />
              );
            })}
          </View>
          {errors.taskTypeId ? (
            <Text style={[styles.fieldError, { color: colors.destructive }]}>
              {errors.taskTypeId.message}
            </Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Priority</Text>
            {previewScore !== null ? (
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                  Worth
                </Text>
                <ScorePill score={previewScore} small />
              </View>
            ) : null}
          </View>
          <View style={styles.chipWrap}>
            {PRIORITY_OPTIONS.map((priority) => {
              const active = selectedPriority === priority;
              return (
                <Controller
                  key={priority}
                  control={control}
                  name="priority"
                  render={({ field: { onChange } }) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${PRIORITY_LABELS[priority]} priority`}
                      accessibilityState={{ selected: active }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        onChange(priority);
                      }}
                    >
                      <Text
                        style={[styles.chipText, { color: active ? '#fff' : colors.foreground }]}
                      >
                        {PRIORITY_LABELS[priority]}
                      </Text>
                    </Pressable>
                  )}
                />
              );
            })}
          </View>
          {selectedPriority === 'urgent' ? (
            <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
              Urgent tasks are worth double.
            </Text>
          ) : null}
        </View>

        <Controller
          control={control}
          name="estimatedDurationMinutes"
          render={({ field: { value, onChange } }) => (
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Estimated duration · {value}m
              </Text>
              <View style={styles.chipWrap}>
                {DURATION_OPTIONS.map((minutes) => {
                  const active = value === minutes;
                  return (
                    <Pressable
                      key={minutes}
                      accessibilityRole="button"
                      accessibilityLabel={`${minutes} minutes`}
                      accessibilityState={{ selected: active }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        onChange(minutes);
                      }}
                    >
                      <Text
                        style={[styles.chipText, { color: active ? '#fff' : colors.mutedForeground }]}
                      >
                        {minutes}m
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        />
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
  saveBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 22,
  },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  noticeText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  noticeAction: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  field: { gap: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldError: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  fieldHint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  input: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  textarea: { height: 100, paddingTop: 14 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    maxWidth: 220,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 22,
    borderWidth: 1.5,
  },
});
