import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/lib/i18n/dates';
import type { Task, CalendarItemKind } from '@/lib/types';
import { t } from '@/lib/i18n';
import { useAppTheme } from '@/lib/theme';
import type { AppThemeColors } from '@/lib/theme';

interface Props {
  task: Task;
  onPress: () => void;
  onDelete: () => void;
}

function kindIconName(kind: CalendarItemKind): string {
  if (kind === 'birthday') return 'gift-outline';
  if (kind === 'event') return 'calendar-outline';
  return 'checkmark-circle-outline';
}

function createStyles(c: AppThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: c.surfaceElevated,
      borderRadius: 16,
      marginBottom: 10,
      overflow: 'hidden',
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    colorBar: {
      width: 5,
    },
    content: {
      flex: 1,
      padding: 14,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginEnd: 8,
      gap: 6,
    },
    title: {
      fontSize: 15,
      fontWeight: '600',
      color: c.textPrimary,
      flex: 1,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      color: c.textSecondary,
    },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: c.textTertiary,
      marginHorizontal: 2,
    },
    ageBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
      marginStart: 4,
    },
    ageBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#fff',
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
    },
    tag: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    tagText: {
      fontSize: 11,
      fontWeight: '600',
    },
  });
}

export default function EventCard({ task, onPress, onDelete }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const startTime = format(
    new Date(task.start_at),
    task.all_day ? 'd MMM' : 'HH:mm',
    { locale: getDateFnsLocale() }
  );
  const endTime = task.all_day ? null : format(new Date(task.end_at), 'HH:mm', { locale: getDateFnsLocale() });

  // Birthday: compute current age if birth_year is known
  const age = useMemo(() => {
    if (task.kind !== 'birthday' || task.birth_year == null) return null;
    const occurrenceYear = new Date(task.start_at).getFullYear();
    return occurrenceYear - task.birth_year;
  }, [task.kind, task.birth_year, task.start_at]);

  const icon = kindIconName(task.kind);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.colorBar, { backgroundColor: task.color }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            <Ionicons name={icon as any} size={16} color={task.color} />
            <Text style={styles.title} numberOfLines={1}>
              {task.title}
            </Text>
          </View>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}>
            {task.all_day ? t('eventCard.allDay') : `${startTime} – ${endTime}`}
          </Text>

          {age != null && (
            <View style={[styles.ageBadge, { backgroundColor: task.color }]}>
              <Text style={styles.ageBadgeText}>{age}</Text>
            </View>
          )}

          {task.location ? (
            <>
              <View style={styles.dot} />
              <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {task.location}
              </Text>
            </>
          ) : null}
        </View>

        {task.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {task.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: `${task.color}20` }]}>
                <Text style={[styles.tagText, { color: task.color }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
