import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { format, parse } from 'date-fns';
import { formatLocalized } from '@/lib/i18n/dates';
import {
  getTimelineDays,
  loadCalendarViewMode,
  toolbarTitleForTimeline,
} from '@/lib/calendarViewMode';
import { useTaskStore } from '@/lib/store';
import type { Task } from '@/lib/types';
import RecurringDeleteSheet from '@/components/RecurringDeleteSheet';
import CalendarFullDay from '@/components/CalendarFullDay';
import DayTasksSheet from '@/components/DayTasksSheet';
import DrawerMenu from '@/components/DrawerMenu';
import TimelineView, { type TimelineViewHandle } from '@/components/timeline/TimelineView';
import { t } from '@/lib/i18n';
import { useAppTheme } from '@/lib/theme';
import type { AppThemeColors } from '@/lib/theme';
import {
  eachDateStringInMonth,
  taskOccursOnVisibleDate,
  projectTaskToOccurrence,
} from '@/lib/recurrence';
import { TasksByDateContext } from '@/lib/TasksByDateContext';

function createStyles(c: AppThemeColors, bottomInset: number, isDark: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: 8,
      gap: 2,
    },
    monthTitle: {
      fontSize: 20,
      fontWeight: '500',
      color: c.textPrimary,
      marginLeft: 4,
    },
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    spacer: { flex: 1 },
    calendarWrap: { flex: 1 },
    fab: {
      position: 'absolute',
      end: 20,
      bottom: Math.max(bottomInset, 16) + 48,
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: c.accent,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.42 : 0.22,
      shadowRadius: 6,
      elevation: 6,
    },
  });
}

export default function HomeScreen() {
  const { colors, resolvedScheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const isDarkMode = resolvedScheme === 'dark';
  const styles = useMemo(() => createStyles(colors, insets.bottom, isDarkMode), [colors, insets.bottom, isDarkMode]);

  const [recurringDeleteTask, setRecurringDeleteTask] = useState<Task | null>(null);
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [calH, setCalH] = useState(0);

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: 'transparent' as const,
      calendarBackground: 'transparent' as const,
      textSectionTitleColor: colors.calendar.section,
      selectedDayBackgroundColor: 'transparent' as const,
      selectedDayTextColor: colors.calendar.day,
      todayTextColor: colors.calendar.today,
      dayTextColor: colors.calendar.day,
      textDisabledColor: colors.calendar.dayDisabled,
      textInactiveColor: colors.textTertiary,
      arrowColor: colors.calendar.arrow,
      monthTextColor: colors.calendar.month,
      textMonthFontWeight: '400' as const,
      textDayHeaderFontWeight: '500' as const,
      textMonthFontSize: isDarkMode ? 22 : 20,
      textDayHeaderFontSize: 11,
      arrowHeight: 28,
      arrowWidth: 28,
      'stylesheet.calendar.main': {
        monthView: { flex: 1, backgroundColor: 'transparent' },
        week: {
          flex: 1,
          flexDirection: 'row' as const,
          justifyContent: 'space-around' as const,
          marginVertical: 0,
        },
      },
      'stylesheet.calendar.header': {
        header: {
          flexDirection: 'row' as const,
          justifyContent: 'space-between' as const,
          paddingHorizontal: isDarkMode ? 4 : 14,
          marginTop: isDarkMode ? 4 : 18,
          paddingTop: 2,
          alignItems: 'center' as const,
        },
        monthText: {
          fontSize: isDarkMode ? 22 : 20,
          fontWeight: '400' as const,
          color: colors.calendar.month,
          marginVertical: 6,
          marginHorizontal: 4,
          letterSpacing: 0,
        },
        arrow: {
          paddingVertical: 8,
          paddingHorizontal: 8,
          minWidth: 48,
          minHeight: 48,
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
        },
        arrowImage: { tintColor: colors.calendar.arrow },
        dayHeader: {
          flex: 1,
          textAlign: 'center' as const,
          fontSize: 11,
          fontWeight: '500' as const,
          color: colors.calendar.section,
          marginTop: 8,
          marginBottom: 4,
        },
        week: {
          marginTop: 0,
          flexDirection: 'row' as const,
          justifyContent: 'space-around' as const,
        },
      },
      textDayStyle: {
        ...(Platform.OS === 'android' ? { includeFontPadding: false as const } : {}),
      },
    }),
    [colors, isDarkMode]
  );

  const router = useRouter();
  const {
    tasks,
    selectedDate,
    calendarMonthKey,
    calendarViewMode,
    loading,
    setSelectedDate,
    setCalendarMonthKey,
    setCalendarViewMode,
    fetchTasks,
    deleteTask,
    deleteTaskOccurrence,
    getTasksForDate,
    getMarkedDates,
  } = useTaskStore();

  const timelineRef = useRef<TimelineViewHandle>(null);

  useEffect(() => {
    void loadCalendarViewMode().then((mode) => {
      if (mode) setCalendarViewMode(mode);
    });
  }, [setCalendarViewMode]);

  useEffect(() => {
    if (calendarViewMode === 'month') return;
    const timer = setTimeout(() => timelineRef.current?.scrollToApproximatePresent(), 200);
    return () => clearTimeout(timer);
  }, [calendarViewMode]);

  // Compute tasks for every day in the current visible month.
  // Passed via Context → cells always update when tasks change, bypassing React.memo in the library.
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const dateStr of eachDateStringInMonth(calendarMonthKey)) {
      const dayTasks = tasks
        .filter((task) => taskOccursOnVisibleDate(task, dateStr))
        .map((task) => projectTaskToOccurrence(task, dateStr))
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
      if (dayTasks.length > 0) map[dateStr] = dayTasks;
    }
    return map;
  }, [tasks, calendarMonthKey]);

  const timelineDaysLogical = useMemo(() => {
    if (calendarViewMode === 'month') return [];
    return getTimelineDays(calendarViewMode, selectedDate);
  }, [calendarViewMode, selectedDate]);

  const timelineTasksByDay = useMemo(() => {
    const m: Record<string, Task[]> = {};
    for (const d of timelineDaysLogical) {
      m[d] = getTasksForDate(d);
    }
    return m;
  }, [timelineDaysLogical, getTasksForDate, tasks]);

  const markedDates = getMarkedDates();
  const sheetTasks = sheetDate ? getTasksForDate(sheetDate) : [];

  const handleDeleteTask = useCallback(
    (task: Task) => {
      if (task.repeat !== 'none') {
        setRecurringDeleteTask(task);
        return;
      }
      Alert.alert(t('home.deleteTask'), t('home.deleteConfirm', { title: task.title }), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => void deleteTask(task.id),
        },
      ]);
    },
    [deleteTask]
  );

  const goToToday = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayMonth = today.slice(0, 7);
    setSelectedDate(today);
    if (todayMonth !== calendarMonthKey) {
      setCalendarMonthKey(todayMonth);
    }
    if (calendarViewMode !== 'month') {
      requestAnimationFrame(() => timelineRef.current?.scrollToApproximatePresent());
    }
  }, [calendarMonthKey, calendarViewMode, setSelectedDate, setCalendarMonthKey]);

  const onDayPress = useCallback(
    (day: { dateString: string }) => {
      setSelectedDate(day.dateString);
      setSheetDate(day.dateString);
    },
    [setSelectedDate]
  );

  const displayMonthYear = useMemo(() => {
    try {
      const base = parse(`${calendarMonthKey}-01`, 'yyyy-MM-dd', new Date());
      return formatLocalized(base, 'MMMM yyyy');
    } catch {
      return calendarMonthKey;
    }
  }, [calendarMonthKey]);

  const toolbarMainTitle = useMemo(() => {
    if (calendarViewMode === 'month') return displayMonthYear;
    return toolbarTitleForTimeline(calendarViewMode, selectedDate, formatLocalized);
  }, [calendarViewMode, selectedDate, displayMonthYear]);

  const onTimelinePickDay = useCallback(
    (dateStr: string) => {
      setSelectedDate(dateStr);
      setCalendarMonthKey(dateStr.slice(0, 7));
    },
    [setSelectedDate, setCalendarMonthKey]
  );

  const onTimelineTaskPress = useCallback(
    (task: Task) => {
      router.push({ pathname: '/(app)/create', params: { taskId: task.id } });
    },
    [router]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* ── Toolbar ── */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setIsDrawerOpen(true)}
          accessibilityRole="button"
        >
          <Ionicons name="menu" size={22} color={colors.icon} />
        </TouchableOpacity>

        <Text style={styles.monthTitle}>{toolbarMainTitle}</Text>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => void fetchTasks()}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={t('home.refreshAria')}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.activityIndicator} />
          ) : (
            <Ionicons name="refresh-outline" size={20} color={colors.icon} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push('/(app)/search')}
          accessibilityRole="button"
        >
          <Ionicons name="search-outline" size={20} color={colors.icon} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={goToToday}
          accessibilityRole="button"
          accessibilityLabel={t('home.todayAria')}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.icon} />
        </TouchableOpacity>
      </View>

      {/* ── Month grid or timeline ── */}
      {calendarViewMode === 'month' ? (
      <TasksByDateContext.Provider value={tasksByDate}>
        <View
          style={styles.calendarWrap}
          onLayout={(e) => setCalH(e.nativeEvent.layout.height)}
        >
          {calH > 0 && (
            <Calendar
              key={resolvedScheme}
              firstDay={0}
              initialDate={`${calendarMonthKey}-01`}
              onDayPress={onDayPress}
              onMonthChange={(month: { dateString: string }) => {
                setCalendarMonthKey(month.dateString.slice(0, 7));
              }}
              markedDates={markedDates}
              markingType="custom"
              enableSwipeMonths
              showSixWeeks
              dayComponent={CalendarFullDay}
              style={{ height: calH }}
              theme={calendarTheme}
              hideArrows={true}
              renderHeader={() => <View />}
            />
          )}
        </View>
      </TasksByDateContext.Provider>
      ) : (
        <View style={styles.calendarWrap}>
          <TimelineView
            ref={timelineRef}
            daysLogical={timelineDaysLogical}
            tasksByDay={timelineTasksByDay}
            selectedDate={selectedDate}
            colors={colors}
            isDarkMode={isDarkMode}
            onPickDay={onTimelinePickDay}
            onPressTask={onTimelineTaskPress}
          />
        </View>
      )}

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/create')}
        activeOpacity={0.88}
        accessibilityRole="button"
      >
        <Ionicons name="add" size={28} color={colors.onAccent} />
      </TouchableOpacity>

      {/* ── Day sheet ── */}
      <DayTasksSheet
        visible={sheetDate !== null}
        dateString={sheetDate}
        tasks={sheetTasks}
        onClose={() => setSheetDate(null)}
        onEditTask={(task) =>
          router.push({ pathname: '/(app)/create', params: { taskId: task.id } })
        }
        onDeleteTask={handleDeleteTask}
      />

      {/* ── Recurring delete sheet ── */}
      <RecurringDeleteSheet
        visible={recurringDeleteTask !== null}
        taskTitle={recurringDeleteTask?.title ?? ''}
        onClose={() => setRecurringDeleteTask(null)}
        onDeleteOccurrence={() => {
          if (recurringDeleteTask) {
            const d = sheetDate ?? selectedDate;
            void deleteTaskOccurrence(recurringDeleteTask.id, d);
          }
        }}
        onDeleteSeries={() => {
          if (recurringDeleteTask) void deleteTask(recurringDeleteTask.id);
        }}
      />
      
      <DrawerMenu
        visible={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onRefresh={() => void fetchTasks()}
        calendarViewMode={calendarViewMode}
        onSelectViewMode={setCalendarViewMode}
      />
    </SafeAreaView>
  );
}
