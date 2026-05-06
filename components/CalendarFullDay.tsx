import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTasksForDay } from '@/lib/TasksByDateContext';
import { useAppTheme } from '@/lib/theme';
import type { AppThemeColors } from '@/lib/theme';
import { t } from '@/lib/i18n';

const MAX_CHIPS = 3;

type DayState = 'selected' | 'disabled' | 'inactive' | 'today' | '';

type DayDate = {
  year: number;
  month: number;
  day: number;
  dateString: string;
  timestamp: number;
};

type Marking = {
  selected?: boolean;
  selectedColor?: string;
  disabled?: boolean;
  disableTouchEvent?: boolean;
  inactive?: boolean;
  today?: boolean;
  activeOpacity?: number;
};

type Props = {
  state?: DayState;
  marking?: Marking;
  date?: DayDate;
  onPress?: (d: DayDate) => void;
  onLongPress?: (d: DayDate) => void;
  disableAllTouchEventsForDisabledDays?: boolean;
  disableAllTouchEventsForInactiveDays?: boolean;
  children?: React.ReactNode;
  testID?: string;
  accessibilityLabel?: string;
};

function createStyles(c: AppThemeColors) {
  return StyleSheet.create({
    outer: {
      flex: 1,
      alignSelf: 'stretch',
      borderEndWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderMuted,
    },
    pressable: {
      flex: 1,
      paddingHorizontal: 3,
      paddingBottom: 4,
    },
    dayRow: {
      alignItems: 'center',
      paddingTop: 2,
      marginBottom: 3,
      minHeight: 30,
      justifyContent: 'center',
    },
    todayFill: {
      minWidth: 30,
      height: 30,
      borderRadius: 15,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.calendar.selectedBg,
    },
    selectedRing: {
      minWidth: 30,
      height: 30,
      borderRadius: 15,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.accent,
    },
    dayNum: {
      fontSize: 14,
      fontWeight: '400',
      includeFontPadding: false,
    },
    /** Google month-view event strip */
    chips: { gap: 2, width: '100%', paddingHorizontal: 0 },
    chip: {
      borderRadius: 2,
      paddingVertical: 2,
      paddingHorizontal: 6,
      overflow: 'hidden',
    },
    chipText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '500',
      lineHeight: 14,
    },
    moreText: {
      fontSize: 11,
      fontWeight: '500',
      marginTop: 1,
      lineHeight: 14,
    },
  });
}

export default function CalendarFullDay({
  state,
  marking,
  date,
  onPress,
  onLongPress,
  disableAllTouchEventsForDisabledDays,
  disableAllTouchEventsForInactiveDays,
  children,
  testID,
  accessibilityLabel,
}: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const _marking = marking ?? {};
  const isSelected = Boolean(_marking.selected) || state === 'selected';
  const isDisabled =
    typeof _marking.disabled !== 'undefined' ? _marking.disabled : state === 'disabled';
  const isInactive =
    typeof _marking.inactive !== 'undefined' ? _marking.inactive : state === 'inactive';
  const isToday =
    typeof _marking.today !== 'undefined' ? _marking.today : state === 'today';

  const disableTouch =
    typeof _marking.disableTouchEvent === 'boolean'
      ? _marking.disableTouchEvent
      : (disableAllTouchEventsForDisabledDays && isDisabled) ||
        (disableAllTouchEventsForInactiveDays && isInactive);

  const dateString = date?.dateString ?? '';
  const tasks = useTasksForDay(dateString);
  const visible = tasks.slice(0, MAX_CHIPS);
  const extra = tasks.length - visible.length;

  const dayNum =
    typeof children === 'string' || typeof children === 'number' ? String(children) : '';

  const baseColor = isDisabled
    ? colors.calendar.dayDisabled
    : isInactive
      ? colors.textTertiary
      : colors.calendar.day;

  const numberColor =
    isToday && !isSelected
      ? colors.calendar.selectedText
      : isToday && isSelected
        ? colors.calendar.selectedText
        : isSelected && !isToday
          ? colors.accent
          : baseColor;

  const dayGlyph = (
    <Text allowFontScaling={false} style={[styles.dayNum, { color: numberColor }]}>
      {dayNum}
    </Text>
  );

  const dayMarkup =
    isToday ? (
      <View
        style={[
          styles.todayFill,
          isSelected ? { borderWidth: 2, borderColor: colors.accentMuted } : null,
        ]}
      >
        {dayGlyph}
      </View>
    ) : isSelected ? (
      <View style={styles.selectedRing}>{dayGlyph}</View>
    ) : (
      dayGlyph
    );

  const content = (
    <>
      <View style={styles.dayRow}>{dayMarkup}</View>
      <View style={styles.chips}>
        {visible.map((task) => {
          const prefix = task.kind === 'birthday' ? '🎂 ' : task.kind === 'event' ? '📅 ' : '';
          return (
            <View key={task.id} style={[styles.chip, { backgroundColor: task.color }]}>
              <Text allowFontScaling={false} style={styles.chipText} numberOfLines={1}>
                {prefix}{task.title}
              </Text>
            </View>
          );
        })}
        {extra > 0 && (
          <Text
            allowFontScaling={false}
            style={[styles.moreText, { color: colors.textTertiary }]}
          >
            {t('home.moreTasksPill', { count: extra })}
          </Text>
        )}
      </View>
    </>
  );

  if (!date) {
    return (
      <View style={styles.outer}>
        <View style={styles.pressable}>{content}</View>
      </View>
    );
  }

  return (
    <View style={styles.outer}>
      <Pressable
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={isDisabled ? undefined : 'button'}
        disabled={Boolean(disableTouch)}
        onPress={disableTouch ? undefined : () => onPress?.(date)}
        onLongPress={disableTouch ? undefined : () => onLongPress?.(date)}
        style={({ pressed }) => [styles.pressable, { opacity: pressed ? 0.82 : 1 }]}
      >
        {content}
      </Pressable>
    </View>
  );
}
