import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useTaskStore } from '@/lib/store';
import type { Task } from '@/lib/types';
import EventCard from '@/components/EventCard';
import RecurringDeleteSheet from '@/components/RecurringDeleteSheet';
import { t } from '@/lib/i18n';
import { formatLocalized } from '@/lib/i18n/dates';
import { useAppTheme } from '@/lib/theme';
import type { AppThemeColors } from '@/lib/theme';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return t('home.greetingMorning');
  if (hour < 18) return t('home.greetingAfternoon');
  return t('home.greetingEvening');
}

function createHomeStyles(c: AppThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.bg,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.surfaceElevated,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    greeting: {
      fontSize: 16,
      color: c.textSecondary,
      marginTop: 8,
    },
    name: {
      fontSize: 28,
      fontWeight: '700',
      color: c.textPrimary,
      letterSpacing: -0.5,
      marginBottom: 20,
    },
    calendarCard: {
      backgroundColor: c.surfaceElevated,
      borderRadius: 20,
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginBottom: 16,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    calendarInner: {
      overflow: 'hidden',
      paddingVertical: 4,
    },
    eventsHeader: {
      marginBottom: 12,
    },
    eventsTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.textPrimary,
    },
    eventsDate: {
      fontSize: 13,
      color: c.textSecondary,
      marginTop: 2,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textSecondary,
      marginTop: 12,
    },
    emptySubtext: {
      fontSize: 13,
      color: c.textTertiary,
      marginTop: 4,
    },
    tasksList: {
      gap: 2,
    },
    fab: {
      position: 'absolute',
      end: 24,
      bottom: 32,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: c.accent,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: c.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
  });
}

export default function HomeScreen() {
  const { colors, resolvedScheme } = useAppTheme();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);

  const [recurringDeleteTask, setRecurringDeleteTask] = useState<Task | null>(null);

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: 'transparent' as const,
      calendarBackground: 'transparent' as const,
      textSectionTitleColor: colors.calendar.section,
      selectedDayBackgroundColor: colors.accent,
      selectedDayTextColor: colors.calendar.selectedText,
      todayTextColor: colors.calendar.today,
      dayTextColor: colors.calendar.day,
      textDisabledColor: colors.calendar.dayDisabled,
      textInactiveColor: colors.textTertiary,
      dotColor: colors.accent,
      selectedDotColor: colors.calendar.selectedText,
      arrowColor: colors.calendar.arrow,
      monthTextColor: colors.calendar.month,
      textDayFontWeight: '500' as const,
      textMonthFontWeight: '700' as const,
      textDayHeaderFontWeight: '600' as const,
      textDayFontSize: 18,
      textMonthFontSize: 21,
      textDayHeaderFontSize: 14,
      weekVerticalMargin: 10,
      arrowHeight: 30,
      arrowWidth: 30,
      // Only override base/today/selected here — a `text` key would replace the library's
      // full `text` style and drop font/color. Alignment tweaks go in `textDayStyle`.
      'stylesheet.day.basic': {
        base: {
          width: 40,
          // Tall cell + flex-start + text marginTop left empty space below the dots, so the
          // selected fill looked shifted down; center the number+dot stack vertically.
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        },
        selected: {
          borderRadius: 20,
        },
        today: {
          borderRadius: 20,
        },
      },
      textDayStyle: {
        color: colors.calendar.day,
        textAlign: 'center' as const,
        // Library default pushes the glyph down; keep the stack centered in `base`.
        marginTop: 0,
        ...(Platform.OS === 'android' ? { includeFontPadding: false as const } : {}),
      },
    }),
    [colors]
  );

  const router = useRouter();
  const {
    user,
    selectedDate,
    calendarMonthKey,
    loading,
    setSelectedDate,
    setCalendarMonthKey,
    fetchTasks,
    deleteTask,
    deleteTaskOccurrence,
    getTasksForDate,
    getMarkedDates,
  } = useTaskStore();

  const tasksForDay = getTasksForDate(selectedDate);
  const markedDates = getMarkedDates();
  const displayDate = formatLocalized(new Date(`${selectedDate}T12:00:00`), 'EEEE, d MMMM yyyy');
  const firstName =
    user?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? t('common.there');

  const handleDeleteTask = useCallback(
    (task: Task) => {
      if (task.repeat !== 'none') {
        setRecurringDeleteTask(task);
        return;
      }
      Alert.alert(t('home.deleteTask'), t('home.deleteConfirm', { title: task.title }), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => void deleteTask(task.id) },
      ]);
    },
    [deleteTask, t]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchTasks} tintColor={colors.refreshTint} />
        }
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(app)/settings')}>
            <Ionicons name="menu" size={24} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(app)/search')}>
            <Ionicons name="search-outline" size={22} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.name}>{firstName}</Text>

        <View style={styles.calendarCard}>
          <Calendar
            key={resolvedScheme}
            firstDay={0}
            current={`${calendarMonthKey}-01`}
            onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
            onMonthChange={(month: { dateString: string }) => {
              setCalendarMonthKey(month.dateString.slice(0, 7));
            }}
            markedDates={markedDates}
            markingType="multi-dot"
            style={styles.calendarInner}
            theme={calendarTheme}
          />
        </View>

        <View style={styles.eventsHeader}>
          <Text style={styles.eventsTitle}>{t('home.events')}</Text>
          <Text style={styles.eventsDate}>{displayDate}</Text>
        </View>

        {tasksForDay.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>{t('home.emptyTitle')}</Text>
            <Text style={styles.emptySubtext}>{t('home.emptySub')}</Text>
          </View>
        ) : (
          <View style={styles.tasksList}>
            {tasksForDay.map((task) => (
              <EventCard
                key={`${task.id}:${selectedDate}`}
                task={task}
                onPress={() => router.push({ pathname: '/(app)/create', params: { taskId: task.id } })}
                onDelete={() => handleDeleteTask(task)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/create')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.onAccent} />
      </TouchableOpacity>

      <RecurringDeleteSheet
        visible={recurringDeleteTask !== null}
        taskTitle={recurringDeleteTask?.title ?? ''}
        onClose={() => setRecurringDeleteTask(null)}
        onDeleteOccurrence={() => {
          if (recurringDeleteTask) void deleteTaskOccurrence(recurringDeleteTask.id, selectedDate);
        }}
        onDeleteSeries={() => {
          if (recurringDeleteTask) void deleteTask(recurringDeleteTask.id);
        }}
      />
    </SafeAreaView>
  );
}
