import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTaskStore } from '@/lib/store';
import type { RepeatOption, Task } from '@/lib/types';
import { filterTasksByQuery } from '@/lib/searchTasks';
import { t } from '@/lib/i18n';
import { formatLocalized, getDateFnsLocale } from '@/lib/i18n/dates';
import { useAppTheme } from '@/lib/theme';
import type { AppThemeColors } from '@/lib/theme';

const DEBOUNCE_MS = 250;

function repeatLabel(repeat: RepeatOption): string {
  switch (repeat) {
    case 'daily':
      return t('event.daily');
    case 'weekly':
      return t('event.weekly');
    case 'monthly':
      return t('event.monthly');
    default:
      return t('event.never');
  }
}

function taskSubtitle(task: Task): string {
  const anchor = formatLocalized(new Date(task.start_at), 'd MMM yyyy');
  if (task.repeat !== 'none') {
    return `${repeatLabel(task.repeat)} · ${anchor}`;
  }
  if (task.all_day) {
    return task.location ? `${t('eventCard.allDay')} · ${task.location}` : t('eventCard.allDay');
  }
  const start = format(new Date(task.start_at), 'HH:mm', { locale: getDateFnsLocale() });
  const end = format(new Date(task.end_at), 'HH:mm', { locale: getDateFnsLocale() });
  const timePart = `${start} – ${end}`;
  return task.location ? `${timePart} · ${task.location}` : timePart;
}

function createStyles(c: AppThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      backgroundColor: c.surfaceElevated,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.inputBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inputWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.inputBg,
      borderRadius: 14,
      paddingHorizontal: 12,
      minHeight: 44,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderMuted,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: c.textPrimary,
      paddingVertical: Platform.OS === 'ios' ? 10 : 8,
      textAlign: 'auto',
    },
    clearBtn: {
      padding: 4,
    },
    emptyWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: c.textSecondary,
      textAlign: 'center',
    },
    emptySub: {
      fontSize: 14,
      color: c.textTertiary,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
    },
    row: {
      flexDirection: 'row',
      marginHorizontal: 20,
      marginBottom: 10,
      backgroundColor: c.surfaceElevated,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    colorBar: { width: 4 },
    rowContent: { flex: 1, paddingVertical: 12, paddingHorizontal: 14 },
    rowTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: c.textPrimary,
    },
    rowSub: {
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 4,
    },
  });
}

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tasks = useTaskStore((s) => s.tasks);
  const setSelectedDate = useTaskStore((s) => s.setSelectedDate);

  const [rawQuery, setRawQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(rawQuery), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [rawQuery]);

  const results = useMemo(
    () => filterTasksByQuery(tasks, debouncedQuery),
    [tasks, debouncedQuery]
  );

  const onPickTask = useCallback(
    (task: Task) => {
      Keyboard.dismiss();
      const dateKey = format(new Date(task.start_at), 'yyyy-MM-dd');
      setSelectedDate(dateKey);
      router.push({ pathname: '/(app)/create', params: { taskId: task.id } });
    },
    [router, setSelectedDate]
  );

  const showHint = debouncedQuery.trim().length === 0;
  const showNoResults = !showHint && results.length === 0;

  const renderItem = useCallback(
    ({ item }: { item: Task }) => (
      <TouchableOpacity
        style={styles.row}
        onPress={() => onPickTask(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.colorBar, { backgroundColor: item.color }]} />
        <View style={styles.rowContent}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.rowSub} numberOfLines={2}>
            {taskSubtitle(item)}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [onPickTask, styles]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.icon} />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={18} color={colors.textTertiary} style={{ marginEnd: 6 }} />
          <TextInput
            style={styles.input}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.placeholder}
            value={rawQuery}
            onChangeText={setRawQuery}
            autoCapitalize="sentences"
            autoCorrect
            returnKeyType="search"
            autoFocus
          />
          {rawQuery.length > 0 ? (
            <TouchableOpacity style={styles.clearBtn} onPress={() => setRawQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {showHint ? (
        <TouchableOpacity style={styles.emptyWrap} activeOpacity={1} onPress={Keyboard.dismiss}>
          <Ionicons name="search-outline" size={52} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>{t('search.typeToSearch')}</Text>
          <Text style={styles.emptySub}>{t('search.hint')}</Text>
        </TouchableOpacity>
      ) : showNoResults ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="file-tray-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>{t('search.noResults')}</Text>
          <Text style={styles.emptySub}>{t('search.tryDifferent')}</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
          onScrollBeginDrag={Keyboard.dismiss}
        />
      )}
    </SafeAreaView>
  );
}
