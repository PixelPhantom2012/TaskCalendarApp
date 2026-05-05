import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, addHours, startOfDay } from 'date-fns';
import { getDateFnsLocale } from '@/lib/i18n/dates';
import { useTaskStore } from '@/lib/store';
import type { RepeatOption, TaskColor, NewTask } from '@/lib/types';
import { t } from '@/lib/i18n';
import { useAppTheme } from '@/lib/theme';
import { createTaskMainStyles, createTaskModalStyles } from '@/lib/theme/createTaskStyles';

const COLORS: TaskColor[] = ['#4A6FE3', '#FF6B6B', '#F5A623', '#4ECDC4', '#A78BFA', '#34D399'];

/** Prefer 24h clock when system locale uses it (e.g. IL, EU) */
function usePreferred24Hour(): boolean {
  return useMemo(() => {
    try {
      const o = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions();
      return o.hourCycle === 'h23' || o.hourCycle === 'h24';
    } catch {
      return false;
    }
  }, []);
}

function mergeDatePart(base: Date, from: Date): Date {
  const n = new Date(base);
  n.setFullYear(from.getFullYear(), from.getMonth(), from.getDate());
  return n;
}

function mergeTimePart(base: Date, from: Date): Date {
  const n = new Date(base);
  n.setHours(from.getHours(), from.getMinutes(), 0, 0);
  return n;
}

function formatDateRow(d: Date) {
  return format(d, 'EEE, d MMM yyyy', { locale: getDateFnsLocale() });
}

function formatTimeRow(d: Date, use24: boolean) {
  return use24 ? format(d, 'HH:mm') : format(d, 'h:mm a', { locale: getDateFnsLocale() });
}

type PickerWhich =
  | 'start-date'
  | 'start-time'
  | 'end-date'
  | 'end-time'
  | 'allday-date';

interface PickerModalProps {
  visible: boolean;
  title: string;
  options: { value: string | number; label: string }[];
  selected: string | number;
  onSelect: (val: string | number) => void;
  onClose: () => void;
  modalStyles: ReturnType<typeof createTaskModalStyles>;
  colors: import('@/lib/theme/palettes').AppThemeColors;
}

function PickerModal({ visible, title, options, selected, onSelect, onClose, modalStyles, colors }: PickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>{title}</Text>
          <ScrollView>
            {options.map((opt) => (
              <TouchableOpacity
                key={String(opt.value)}
                style={modalStyles.option}
                onPress={() => {
                  onSelect(opt.value);
                  onClose();
                }}
              >
                <Text style={[modalStyles.optionText, selected === opt.value && modalStyles.selectedText]}>
                  {opt.label}
                </Text>
                {selected === opt.value && <Ionicons name="checkmark" size={20} color={colors.accent} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
            <Text style={modalStyles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function CreateTaskScreen() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const { tasks, addTask, updateTask, selectedDate } = useTaskStore();
  const is24Hour = usePreferred24Hour();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createTaskMainStyles(colors), [colors]);
  const modalStyles = useMemo(() => createTaskModalStyles(colors), [colors]);

  const REPEAT_OPTIONS = useMemo(
    () =>
      [
        { value: 'none' as RepeatOption, label: t('event.never') },
        { value: 'daily' as RepeatOption, label: t('event.daily') },
        { value: 'weekly' as RepeatOption, label: t('event.weekly') },
        { value: 'monthly' as RepeatOption, label: t('event.monthly') },
      ],
    []
  );

  const NOTIFY_OPTIONS = useMemo(
    () => [
      { value: 0, label: t('event.notifyAt') },
      { value: 5, label: t('event.notify5') },
      { value: 10, label: t('event.notify10') },
      { value: 15, label: t('event.notify15') },
      { value: 30, label: t('event.notify30') },
      { value: 60, label: t('event.notify60') },
      { value: 1440, label: t('event.notify1440') },
    ],
    []
  );

  const existingTask = taskId ? tasks.find((t) => t.id === taskId) : null;
  const isEdit = !!existingTask;

  const defaultStart = new Date(`${selectedDate}T09:00:00`);
  const defaultEnd = addHours(defaultStart, 1);

  const [title, setTitle] = useState(existingTask?.title ?? '');
  const [notes, setNotes] = useState(existingTask?.notes ?? '');
  const [allDay, setAllDay] = useState(existingTask?.all_day ?? false);
  const [startDate, setStartDate] = useState(existingTask ? new Date(existingTask.start_at) : defaultStart);
  const [endDate, setEndDate] = useState(existingTask ? new Date(existingTask.end_at) : defaultEnd);
  const [repeat, setRepeat] = useState<RepeatOption>(existingTask?.repeat ?? 'none');
  const [location, setLocation] = useState(existingTask?.location ?? '');
  const [color, setColor] = useState<TaskColor>(existingTask?.color ?? '#4A6FE3');
  const [notifyBefore, setNotifyBefore] = useState(existingTask?.notify_before_minutes ?? 10);
  const [saving, setSaving] = useState(false);

  const [repeatModal, setRepeatModal] = useState(false);
  const [notifyModal, setNotifyModal] = useState(false);

  /** Which native picker is open (Android: system dialog; iOS: sheet with spinner) */
  const [pickerTarget, setPickerTarget] = useState<PickerWhich | null>(null);
  /** iOS only — working value while spinner moves */
  const [iosDraft, setIosDraft] = useState(() => new Date());

  const baseForPicker = useCallback(() => {
    if (!pickerTarget) return new Date();
    if (pickerTarget === 'start-date' || pickerTarget === 'start-time') return new Date(startDate);
    if (pickerTarget === 'end-date' || pickerTarget === 'end-time') return new Date(endDate);
    return new Date(startDate);
  }, [pickerTarget, startDate, endDate]);

  useEffect(() => {
    if (!pickerTarget || Platform.OS !== 'ios') return;
    setIosDraft(baseForPicker());
  }, [pickerTarget, baseForPicker]);

  const closePicker = () => setPickerTarget(null);

  const applyAndroidChange = useCallback(
    (event: { type?: string }, date: Date | undefined) => {
      if (event.type === 'dismissed') {
        closePicker();
        return;
      }
      const shouldApply =
        date &&
        pickerTarget &&
        (event.type === 'set' || event.type === undefined);

      if (shouldApply && date && pickerTarget) {
        const d = date;
        switch (pickerTarget) {
          case 'start-date':
            setStartDate((prev) => {
              const next = mergeDatePart(prev, d);
              setEndDate((e) => (e.getTime() <= next.getTime() ? addHours(next, 1) : e));
              return next;
            });
            break;
          case 'start-time':
            setStartDate((prev) => {
              const next = mergeTimePart(prev, d);
              setEndDate((e) => (e.getTime() <= next.getTime() ? addHours(next, 1) : e));
              return next;
            });
            break;
          case 'end-date': {
            const next = mergeDatePart(endDate, d);
            if (next.getTime() <= startDate.getTime()) {
              Alert.alert(t('common.error'), t('event.invalidEnd'));
            } else {
              setEndDate(next);
            }
            break;
          }
          case 'end-time': {
            const next = mergeTimePart(endDate, d);
            if (next.getTime() <= startDate.getTime()) {
              Alert.alert(t('common.error'), t('event.invalidEnd'));
            } else {
              setEndDate(next);
            }
            break;
          }
          case 'allday-date': {
            const day = startOfDay(d);
            setStartDate(day);
            setEndDate(day);
            break;
          }
          default:
            break;
        }
      }
      closePicker();
    },
    [pickerTarget, startDate, endDate]
  );

  const applyStart = useCallback((next: Date) => {
    setStartDate(next);
    setEndDate((prev) => (prev.getTime() <= next.getTime() ? addHours(next, 1) : prev));
  }, []);

  const commitIosDraft = () => {
    if (!pickerTarget) return;
    const d = iosDraft;
    switch (pickerTarget) {
      case 'start-date':
        applyStart(mergeDatePart(startDate, d));
        break;
      case 'start-time':
        applyStart(mergeTimePart(startDate, d));
        break;
      case 'end-date': {
        const next = mergeDatePart(endDate, d);
        if (next.getTime() <= startDate.getTime()) {
          Alert.alert(t('common.error'), t('event.invalidEnd'));
          return;
        }
        setEndDate(next);
        break;
      }
      case 'end-time': {
        const next = mergeTimePart(endDate, d);
        if (next.getTime() <= startDate.getTime()) {
          Alert.alert(t('common.error'), t('event.invalidEnd'));
          return;
        }
        setEndDate(next);
        break;
      }
      case 'allday-date': {
        const day = startOfDay(d);
        setStartDate(day);
        setEndDate(day);
        break;
      }
      default:
        break;
    }
    closePicker();
  };

  const pickerTitleIos = useMemo(() => {
    if (!pickerTarget) return '';
    if (pickerTarget.includes('time')) return t('event.selectTime');
    return t('event.selectDate');
  }, [pickerTarget]);

  const androidPickerMode = pickerTarget?.includes('time') ? 'time' : 'date';

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('event.missingTitle'), t('event.missingTitleMsg'));
      return;
    }

    setSaving(true);
    const taskData: NewTask = {
      title: title.trim(),
      notes: notes.trim() || null,
      start_at: startDate.toISOString(),
      end_at: allDay ? startDate.toISOString() : endDate.toISOString(),
      all_day: allDay,
      repeat,
      location: location.trim() || null,
      color,
      tags: [],
      notify_before_minutes: notifyBefore,
      deleted_dates: isEdit && existingTask ? (existingTask.deleted_dates ?? []) : [],
    };

    if (isEdit && taskId) {
      await updateTask(taskId, taskData);
    } else {
      await addTask(taskData);
    }
    setSaving(false);
    router.back();
  };

  const repeatLabel = REPEAT_OPTIONS.find((r) => r.value === repeat)?.label ?? t('event.never');
  const notifyLabel = NOTIFY_OPTIONS.find((n) => n.value === notifyBefore)?.label ?? t('event.notify10');

  const iconMuted = colors.iconMuted;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header — calendar-style */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? t('event.edit') : t('event.new')}</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.savePill, saving && styles.savePillDisabled]}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.savePillText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.unifiedSheet}>
            {/* Title */}
            <View style={styles.sheetSection}>
              <Text style={styles.titleLabel}>{t('event.titleLabel')}</Text>
              <TextInput
                style={styles.titleHeroInput}
                placeholder={t('event.titlePlaceholder')}
                placeholderTextColor={colors.placeholder}
                value={title}
                onChangeText={setTitle}
                autoFocus={!isEdit}
              />
            </View>

            <View style={styles.sheetDivider} />

            {/* Schedule */}
            <View style={styles.sheetRow}>
              <Ionicons name="sunny-outline" size={22} color={iconMuted} />
              <Text style={styles.groupRowLabel}>{t('event.allDay')}</Text>
              <Switch
                value={allDay}
                onValueChange={(v) => {
                  if (v) {
                    const day = startOfDay(startDate);
                    setStartDate(day);
                    setEndDate(day);
                  } else {
                    setEndDate((prev) =>
                      prev.getTime() <= startDate.getTime() ? addHours(startDate, 1) : prev
                    );
                  }
                  setAllDay(v);
                }}
                trackColor={{ false: colors.switchTrackOff, true: colors.accentMuted }}
                thumbColor={colors.switchThumb}
              />
            </View>

            {!allDay && (
              <>
                <View style={styles.sheetDivider} />
                <View style={styles.splitBlock}>
                  <Text style={styles.splitSectionTitle}>{t('event.start')}</Text>
                  <View style={styles.splitRow}>
                    <TouchableOpacity
                      style={styles.splitLeft}
                      activeOpacity={0.55}
                      onPress={() => setPickerTarget('start-date')}
                    >
                      <Text style={styles.splitDateText}>{formatDateRow(startDate)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.splitRight}
                      activeOpacity={0.55}
                      onPress={() => setPickerTarget('start-time')}
                    >
                      <Text style={styles.splitTimeText}>{formatTimeRow(startDate, is24Hour)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.sheetDivider} />

                <View style={styles.splitBlock}>
                  <Text style={styles.splitSectionTitle}>{t('event.end')}</Text>
                  <View style={styles.splitRow}>
                    <TouchableOpacity
                      style={styles.splitLeft}
                      activeOpacity={0.55}
                      onPress={() => setPickerTarget('end-date')}
                    >
                      <Text style={styles.splitDateText}>{formatDateRow(endDate)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.splitRight}
                      activeOpacity={0.55}
                      onPress={() => setPickerTarget('end-time')}
                    >
                      <Text style={styles.splitTimeText}>{formatTimeRow(endDate, is24Hour)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {allDay && (
              <>
                <View style={styles.sheetDivider} />
                <TouchableOpacity
                  style={styles.sheetRow}
                  activeOpacity={0.55}
                  onPress={() => setPickerTarget('allday-date')}
                >
                  <Ionicons name="calendar-outline" size={22} color={iconMuted} />
                  <Text style={styles.groupRowLabel}>{t('event.date')}</Text>
                  <Text style={styles.groupRowValue} numberOfLines={1}>
                    {formatDateRow(startDate)}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
                </TouchableOpacity>
              </>
            )}

            <View style={styles.sheetDivider} />

            <TouchableOpacity
              style={styles.sheetRow}
              onPress={() => setRepeatModal(true)}
              activeOpacity={0.55}
            >
              <Ionicons name="repeat-outline" size={22} color={iconMuted} />
              <Text style={styles.groupRowLabelFlex}>{t('event.repeat')}</Text>
              <Text style={styles.groupRowValueMuted}>{repeatLabel}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
            </TouchableOpacity>

            <View style={styles.sheetDivider} />

            <View style={styles.sheetRow}>
              <Ionicons name="location-outline" size={22} color={iconMuted} />
              <TextInput
                style={styles.locationInput}
                placeholder={t('event.locationPlaceholder')}
                placeholderTextColor={colors.placeholder}
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.sheetDivider} />

            <View style={styles.colorSection}>
              <View style={styles.colorLabelRow}>
                <Ionicons name="color-palette-outline" size={22} color={iconMuted} />
                <Text style={styles.groupRowLabelFlex}>{t('event.color')}</Text>
              </View>
              <View style={styles.colorRow}>
                {COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]}
                    onPress={() => setColor(c)}
                    activeOpacity={0.7}
                  >
                    {color === c && <Ionicons name="checkmark" size={16} color={colors.onAccent} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.sheetDivider} />

            <TouchableOpacity
              style={styles.sheetRow}
              onPress={() => setNotifyModal(true)}
              activeOpacity={0.55}
            >
              <Ionicons name="notifications-outline" size={22} color={iconMuted} />
              <Text style={styles.groupRowLabelFlex}>{t('event.notify')}</Text>
              <Text style={styles.groupRowValueMuted} numberOfLines={1}>
                {notifyLabel}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
            </TouchableOpacity>

            <View style={styles.sheetDivider} />

            <View style={styles.notesSection}>
              <View style={styles.notesLabelRow}>
                <Ionicons name="document-text-outline" size={22} color={iconMuted} />
                <Text style={styles.groupRowLabelFlex}>{t('event.notes')}</Text>
              </View>
              <TextInput
                style={styles.notesInput}
                placeholder={t('event.notesPlaceholder')}
                placeholderTextColor={colors.placeholder}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PickerModal
        visible={repeatModal}
        title={t('event.repeatModal')}
        options={REPEAT_OPTIONS}
        selected={repeat}
        onSelect={(v) => setRepeat(v as RepeatOption)}
        onClose={() => setRepeatModal(false)}
        modalStyles={modalStyles}
        colors={colors}
      />

      <PickerModal
        visible={notifyModal}
        title={t('event.notifyModal')}
        options={NOTIFY_OPTIONS}
        selected={notifyBefore}
        onSelect={(v) => setNotifyBefore(v as number)}
        onClose={() => setNotifyModal(false)}
        modalStyles={modalStyles}
        colors={colors}
      />

      {/* Android: native Material date/time dialogs (clock for time) */}
      {Platform.OS === 'android' && pickerTarget && (
        <DateTimePicker
          value={baseForPicker()}
          mode={androidPickerMode}
          display="default"
          is24Hour={is24Hour}
          onChange={(e, date) => applyAndroidChange(e, date)}
        />
      )}

      {/* iOS: sheet with spinner + Done */}
      {Platform.OS === 'ios' && pickerTarget && (
        <Modal visible transparent animationType="fade">
          <View style={modalStyles.iosOverlay}>
            <TouchableOpacity style={modalStyles.iosBackdrop} activeOpacity={1} onPress={closePicker} />
            <View style={modalStyles.iosSheet}>
              <View style={modalStyles.iosToolbar}>
                <TouchableOpacity onPress={closePicker} hitSlop={12}>
                  <Text style={modalStyles.iosToolbarCancel}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <Text style={modalStyles.iosToolbarTitle}>{pickerTitleIos}</Text>
                <TouchableOpacity onPress={commitIosDraft} hitSlop={12}>
                  <Text style={modalStyles.iosToolbarDone}>{t('common.done')}</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={iosDraft}
                mode={pickerTarget.includes('time') ? 'time' : 'date'}
                display="spinner"
                is24Hour={is24Hour}
                onChange={(_, d) => {
                  if (d) setIosDraft(d);
                }}
                style={modalStyles.iosSpinner}
              />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === 'web' && pickerTarget && (
        <Modal visible transparent animationType="slide">
          <View style={modalStyles.overlay}>
            <View style={modalStyles.dateSheet}>
              <Text style={modalStyles.webOnly}>{t('event.webPickerHint')}</Text>
              <TouchableOpacity style={modalStyles.cancelBtn} onPress={closePicker}>
                <Text style={modalStyles.cancelText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
