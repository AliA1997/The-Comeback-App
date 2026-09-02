import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreateListBody } from '@workspace/api-zod';
import { ApiError } from '@workspace/api-client-react';
import { useColors } from '@/shared/theme/useColors';
import { useCreateList, useList, useUpdateList } from '../hooks/useLists';
import { LIST_NAME_MAX_LENGTH } from '../types';

type ListFormValues = { name: string };

/**
 * Create / rename a list (AC-2).
 *
 * The schema comes from `@workspace/api-zod`, generated from the same
 * `openapi.yaml` the server validates against, so the two cannot drift
 * (§ 8.6). A duplicate name comes back as a 409 and is mapped onto the name
 * field rather than shown as a banner.
 */
export function ListFormScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const editing = useList(params.id);
  const createList = useCreateList();
  const updateList = useUpdateList();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ListFormValues>({
    resolver: zodResolver(CreateListBody.pick({ name: true })),
    defaultValues: { name: editing?.name ?? '' },
    mode: 'onSubmit',
  });

  const onSubmit = async (values: ListFormValues) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const data = { name: values.name.trim() };

    try {
      if (editing) {
        await updateList.mutateAsync({ listId: editing.id, data });
      } else {
        await createList.mutateAsync({ data });
      }
      router.back();
    } catch (err: unknown) {
      // Server 409/422 responses carry `fieldErrors` keyed by field name, so
      // they render inline beneath the input the user needs to change.
      const problem = err instanceof ApiError ? (err.data as { fieldErrors?: Record<string, string> } | null) : null;
      const message = problem?.fieldErrors?.['name'];
      setError('name', {
        message: message ?? "That didn't save. Tap Save to try again.",
      });
    }
  };

  const saving = isSubmitting || createList.isPending || updateList.isPending;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? insets.top + 67 : insets.top + 20,
            paddingBottom: insets.bottom + 24,
          },
        ]}
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
            {editing ? 'Rename list' : 'New list'}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={editing ? 'Save list' : 'Create list'}
            accessibilityState={{ disabled: saving }}
            style={[styles.saveBtn, { backgroundColor: saving ? colors.border : colors.primary }]}
            disabled={saving}
            onPress={handleSubmit(onSubmit)}
          >
            <Text
              style={[styles.saveBtnText, { color: saving ? colors.mutedForeground : '#fff' }]}
            >
              {editing ? 'Save' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>List name</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                accessibilityLabel="List name"
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.foreground,
                    borderColor: errors.name
                      ? colors.destructive
                      : value.trim()
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g. Applications — week of Sep 1"
                placeholderTextColor={colors.mutedForeground}
                maxLength={LIST_NAME_MAX_LENGTH}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
              />
            )}
          />
          {errors.name ? (
            <Text style={[styles.fieldError, { color: colors.destructive }]}>
              {errors.name.message}
            </Text>
          ) : (
            <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
              Up to {LIST_NAME_MAX_LENGTH} characters.
            </Text>
          )}
        </View>
      </View>
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
  field: { gap: 10 },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  fieldError: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  fieldHint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
