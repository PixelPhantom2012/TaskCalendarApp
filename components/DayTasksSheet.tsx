import { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Task } from '@/lib/types';
import EventCard from '@/components/EventCard';
import { t } from '@/lib/i18n';
import { formatLocalized } from '@/lib/i18n/dates';
import { useAppTheme } from '@/lib/theme';
import type { AppThemeColors } from '@/lib/theme';

type Props = {
  visible: boolean;
  /** yyyy-MM-dd */
  dateString: string | null;
  tasks: Task[];
  onClose: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
};

function createStyles(c: AppThemeColors, sheetMaxHeight: number) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      maxHeight: sheetMaxHeight,
      backgroundColor: c.modalSheet,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 12,
    },
    handleRow: {
      alignItems: 'center',
      paddingTop: 10,
      paddingBottom: 4,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.borderMuted,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: c.textPrimary,
      flex: 1,
      marginEnd: 12,
    },
    closeBtn: {
      padding: 8,
      marginTop: -4,
      marginEnd: -8,
    },
    list: {
      paddingHorizontal: 16,
    },
    empty: {
      alignItems: 'center',
      paddingVertical: 28,
      paddingHorizontal: 24,
    },
    emptyText: {
      fontSize: 15,
      fontWeight: '600',
      color: c.textSecondary,
      textAlign: 'center',
    },
    emptySub: {
      fontSize: 13,
      color: c.textTertiary,
      marginTop: 6,
      textAlign: 'center',
    },
  });
}

export default function DayTasksSheet({
  visible,
  dateString,
  tasks,
  onClose,
  onEditTask,
  onDeleteTask,
}: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const sheetMaxHeight = Math.min(winH * 0.72, winH - insets.top - 24);
  const styles = useMemo(() => createStyles(colors, sheetMaxHeight), [colors, sheetMaxHeight]);

  const title = dateString
    ? formatLocalized(new Date(`${dateString}T12:00:00`), 'EEEE, d MMMM yyyy')
    : '';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {dateString ? title : ''}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12} accessibilityRole="button">
              <Ionicons name="close" size={26} color={colors.icon} />
            </Pressable>
          </View>

          {tasks.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyText}>{t('home.daySheetEmptyTitle')}</Text>
              <Text style={styles.emptySub}>{t('home.daySheetEmptySub')}</Text>
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight: sheetMaxHeight - 120 }}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {tasks.map((task) => (
                <EventCard
                  key={`${task.id}:${dateString}`}
                  task={task}
                  onPress={() => onEditTask(task)}
                  onDelete={() => onDeleteTask(task)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
