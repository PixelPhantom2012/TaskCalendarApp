import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  I18nManager,
} from 'react-native';
import { endOfDay, format, startOfDay } from 'date-fns';
import type { Task } from '@/lib/types';
import type { AppThemeColors } from '@/lib/theme';
import { formatLocalized } from '@/lib/i18n/dates';
import { parseLocalDateString } from '@/lib/recurrence';

export const TIMELINE_PX_PER_HOUR = 48;
const TOTAL_HOURS = 24;
export const TIMELINE_BODY_HEIGHT_PX = TOTAL_HOURS * TIMELINE_PX_PER_HOUR;
const TIME_RULER_W = 44;
const BLOCK_MIN_HEIGHT = 24;

type Props = {
  daysLogical: readonly string[];
  tasksByDay: Record<string, Task[]>;
  selectedDate: string;
  colors: AppThemeColors;
  isDarkMode: boolean;
  onPickDay: (dateStr: string) => void;
  onPressTask: (task: Task) => void;
};

export type TimelineViewHandle = {
  scrollToApproximatePresent: () => void;
};

type TimedGeom = {
  task: Task;
  topPx: number;
  heightPx: number;
};

type TimedPlacement = TimedGeom & {
  lane: number;
  laneCount: number;
};

function clampTimedGeom(dateStr: string, task: Task): TimedGeom | null {
  if (task.all_day) return null;
  const dayStartMs = startOfDay(parseLocalDateString(dateStr)).getTime();
  const dayEndMs = endOfDay(parseLocalDateString(dateStr)).getTime();
  const startMs = new Date(task.start_at).getTime();
  const endMs = new Date(task.end_at).getTime();
  const s = Math.max(startMs, dayStartMs);
  const e = Math.min(endMs, dayEndMs);
  if (!(e > s)) return null;

  const startMinFromMidnight = (s - dayStartMs) / 60000;
  const durMin = (e - s) / 60000;

  const topPx = (startMinFromMidnight / 60) * TIMELINE_PX_PER_HOUR;
  const heightPx = Math.max((durMin / 60) * TIMELINE_PX_PER_HOUR, BLOCK_MIN_HEIGHT);

  return { task, topPx, heightPx };
}

/** Assign side-by-side lanes for overlapping blocks (deterministic greedy). */
function placeTimedLanes(geoms: TimedGeom[]): TimedPlacement[] {
  if (!geoms.length) return [];

  const sorted = [...geoms].sort((a, b) => {
    const d = a.topPx - b.topPx;
    if (d !== 0) return d;
    const se = new Date(a.task.start_at).getTime() - new Date(b.task.start_at).getTime();
    if (se !== 0) return se;
    return a.task.id.localeCompare(b.task.id);
  });

  type ActiveLane = { bottom: number; lane: number };

  let active: ActiveLane[] = [];

  const draft: Array<TimedGeom & { lane: number }> = [];

  for (const g of sorted) {
    const bottom = g.topPx + g.heightPx;
    active = active.filter((row) => row.bottom > g.topPx);
    const used = new Set(active.map((row) => row.lane));
    let lane = 0;
    while (used.has(lane)) lane += 1;
    active.push({ bottom, lane });
    draft.push({ ...g, lane });
  }

  const maxLanes = draft.reduce((m, d) => Math.max(m, d.lane + 1), 1);
  const lc = Math.max(maxLanes, 1);

  return draft.map((d) => ({
    ...d,
    laneCount: lc,
  }));
}

function layoutTimedForColumn(dateStr: string, tasks: Task[]): TimedPlacement[] {
  const raw: TimedGeom[] = [];
  for (const t of tasks) {
    const g = clampTimedGeom(dateStr, t);
    if (g) raw.push(g);
  }
  return placeTimedLanes(raw);
}

function TimelineViewInner(
  { daysLogical, tasksByDay, selectedDate, colors, isDarkMode, onPickDay, onPressTask }: Props,
  ref: React.Ref<TimelineViewHandle>
) {
  const rtl = I18nManager.isRTL;
  /** Keep daysLogical Sun→Sat = tasksByDay keys; flip visuals with flexDirection only (double-reverse was swapping headers vs columns). */
  const dayFlexDir: 'row' | 'row-reverse' = rtl ? 'row-reverse' : 'row';

  const scrollRef = useRef<ScrollView>(null);
  const [timelineMinuteTick, setTimelineMinuteTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTimelineMinuteTick((x) => x + 1), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const nowLineYPx = useMemo(() => {
    const now = new Date();
    const m = now.getHours() * 60 + now.getMinutes();
    return (m / 60) * TIMELINE_PX_PER_HOUR;
  }, [timelineMinuteTick]);

  const scrollToApproximatePresent = useCallback(() => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const y = Math.max(0, (mins / 60) * TIMELINE_PX_PER_HOUR - 120);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y, animated: true }));
  }, []);

  useImperativeHandle(ref, () => ({ scrollToApproximatePresent }), [scrollToApproximatePresent]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const stripDayLabel = (dateStr: string) => ({
    dow: formatLocalized(parseLocalDateString(dateStr), 'EEE'),
    dom: parseLocalDateString(dateStr).getDate(),
  });

  const stylesLocal = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={stylesLocal.root}>
      <View style={stylesLocal.stripRow}>
        <View style={stylesLocal.alignRulerSpacer} />
        <View style={[stylesLocal.daysRow, { flexDirection: dayFlexDir }]}>
        {daysLogical.map((ds) => {
          const sel = ds === selectedDate;
          const { dow, dom } = stripDayLabel(ds);
          return (
            <TouchableOpacity
              key={ds}
              style={[stylesLocal.stripCell, sel && stylesLocal.stripCellSelected]}
              onPress={() => onPickDay(ds)}
              activeOpacity={0.76}
              accessibilityRole="button"
            >
              <Text style={[stylesLocal.stripDow, sel ? stylesLocal.stripDowSel : undefined]}>{dow}</Text>
              <Text style={[stylesLocal.stripDom, sel ? stylesLocal.stripDomSel : undefined]}>{dom}</Text>
            </TouchableOpacity>
          );
        })}
        </View>
      </View>

      <View style={stylesLocal.allDayOuter}>
        <View style={stylesLocal.allDayRuler} />
        <View style={[stylesLocal.daysRow, { flexDirection: dayFlexDir }]}>
        {daysLogical.map((ds) => {
          const list = tasksByDay[ds] ?? [];
          const allDay = list.filter((x) => x.all_day);
          return (
            <View key={`ad_${ds}`} style={stylesLocal.allDayCell}>
              {allDay.slice(0, 6).map((task) => (
                <TouchableOpacity
                  key={`${task.id}_${ds}_allday`}
                  onPress={() => onPressTask(task)}
                  style={[stylesLocal.allDayPill, { borderColor: task.color, backgroundColor: task.color + (isDarkMode ? '44' : '22') }]}
                >
                  <Text style={stylesLocal.allDayText} numberOfLines={1}>
                    {task.title}
                  </Text>
                </TouchableOpacity>
              ))}
              {allDay.length > 6 ? (
                <Text style={stylesLocal.allDayMore}>+{allDay.length - 6}</Text>
              ) : null}
            </View>
          );
        })}
        </View>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator style={stylesLocal.scrollOuter}>
        <View style={stylesLocal.gridRow}>
          <View style={stylesLocal.timeRuler}>
            {Array.from({ length: TOTAL_HOURS }).map((_, h) => (
              <View key={`h_${h}`} style={{ height: TIMELINE_PX_PER_HOUR }}>
                <Text style={stylesLocal.hourLbl}>{`${h}:00`}</Text>
              </View>
            ))}
          </View>

          <View style={[stylesLocal.columnsWrap, { flexDirection: dayFlexDir }]}>
            {daysLogical.map((ds) => {
              const placements = layoutTimedForColumn(ds, tasksByDay[ds] ?? []);
              const isTodayColumn = ds === todayStr;

              return (
                <View key={ds} style={stylesLocal.dayColumn}>
                  <View
                    style={{
                      height: TIMELINE_BODY_HEIGHT_PX,
                      borderRightWidth: StyleSheet.hairlineWidth,
                      borderRightColor: colors.borderMuted,
                    }}
                  >
                    {Array.from({ length: TOTAL_HOURS }).map((_, h) => (
                      <View
                        key={`_${h}_${ds}`}
                        style={{
                          height: TIMELINE_PX_PER_HOUR,
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: colors.borderMuted,
                        }}
                      />
                    ))}
                    {placements.map(({ task, topPx, heightPx, lane, laneCount }) => (
                      <TouchableOpacity
                        key={`${task.id}_${ds}_${topPx}_${lane}`}
                        activeOpacity={0.88}
                        onPress={() => onPressTask(task)}
                        accessibilityRole="button"
                        accessibilityLabel={task.title}
                        style={{
                          position: 'absolute',
                          top: topPx,
                          left:
                            laneCount <= 1 ? '2%' : `${(lane / laneCount) * 100 + (2 / laneCount)}%`,
                          width: laneCount <= 1 ? '96%' : `${100 / laneCount - (4 / laneCount)}%`,
                          minHeight: heightPx,
                          height: heightPx,
                          paddingHorizontal: 4,
                          paddingVertical: 2,
                          borderRadius: 6,
                          borderWidth: 2,
                          borderColor: task.color,
                          backgroundColor: isDarkMode ? colors.surfaceMuted : `${task.color}26`,
                        }}
                      >
                        <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '600' }} numberOfLines={2}>
                          {task.title}
                        </Text>
                      </TouchableOpacity>
                    ))}

                    {isTodayColumn ? (
                      <View
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: nowLineYPx,
                          flexDirection: 'row',
                          alignItems: 'center',
                          zIndex: 50,
                        }}
                      >
                        <View style={[stylesLocal.nowDot, stylesLocal.nowDotAtRuler]} />
                        <View style={{ flex: 1, height: 2, backgroundColor: colors.textPrimary }} />
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default forwardRef(TimelineViewInner);

function createStyles(c: AppThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    stripRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderMuted,
    },
    alignRulerSpacer: {
      width: TIME_RULER_W,
    },
    daysRow: {
      flex: 1,
      flexDirection: 'row',
      minWidth: 0,
    },
    stripCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 6,
    },
    stripCellSelected: {
      marginHorizontal: 4,
      borderRadius: 999,
      backgroundColor: c.accent + '33',
    },
    stripDow: { fontSize: 11, color: c.textSecondary, fontWeight: '600' },
    stripDowSel: { color: c.calendar.today },
    stripDom: { fontSize: 18, fontWeight: '700', color: c.textPrimary, marginTop: 2 },
    stripDomSel: { color: c.calendar.today },
    allDayOuter: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderMuted,
      minHeight: 36,
    },
    allDayRuler: { width: TIME_RULER_W },
    allDayCell: {
      flex: 1,
      paddingHorizontal: 2,
      paddingVertical: 4,
    },
    allDayPill: {
      borderRadius: 4,
      borderWidth: 1,
      paddingHorizontal: 4,
      paddingVertical: 3,
      marginBottom: 2,
    },
    allDayText: {
      fontSize: 11,
      color: c.textPrimary,
      fontWeight: '600',
    },
    allDayMore: {
      fontSize: 11,
      color: c.textSecondary,
    },
    scrollOuter: { flex: 1 },
    gridRow: { flexDirection: 'row', minHeight: TIMELINE_BODY_HEIGHT_PX },
    timeRuler: {
      width: TIME_RULER_W,
      paddingEnd: 4,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: c.borderMuted,
    },
    hourLbl: {
      fontSize: 10,
      color: c.textSecondary,
      marginTop: -6,
      textAlign: 'right',
    },
    columnsWrap: {
      flex: 1,
      flexDirection: 'row',
    },
    dayColumn: {
      flex: 1,
    },
    nowDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.textPrimary,
      zIndex: 51,
    },
    /** Edge toward the clock column (physical left). */
    nowDotAtRuler: { marginLeft: -4, marginRight: 0 },
  });
}
