import { useMemo } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/lib/theme';
import type { AppThemeColors } from '@/lib/theme';
import { t } from '@/lib/i18n';

interface Props {
  visible: boolean;
  taskTitle: string;
  onClose: () => void;
  onDeleteOccurrence: () => void;
  onDeleteSeries: () => void;
}

function createStyles(c: AppThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      backgroundColor: c.modalSheet,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
      paddingHorizontal: 20,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.borderMuted,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 20,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: `${c.danger}18`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: c.textPrimary,
      letterSpacing: -0.2,
    },
    subtitle: {
      fontSize: 13,
      color: c.textSecondary,
      marginBottom: 20,
      lineHeight: 18,
    },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      paddingVertical: 15,
      paddingHorizontal: 18,
      gap: 12,
      marginBottom: 10,
    },
    btnOccurrence: {
      backgroundColor: `${c.accent}15`,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${c.accent}40`,
    },
    btnSeries: {
      backgroundColor: `${c.danger}12`,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${c.danger}35`,
    },
    btnText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
    },
    btnTextOccurrence: {
      color: c.accent,
    },
    btnTextSeries: {
      color: c.danger,
    },
    btnSub: {
      fontSize: 12,
      marginTop: 1,
    },
    btnSubOccurrence: {
      color: `${c.accent}99`,
    },
    btnSubSeries: {
      color: `${c.danger}99`,
    },
    cancelBtn: {
      height: 50,
      borderRadius: 14,
      backgroundColor: c.inputBg,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2,
    },
    cancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textSecondary,
    },
  });
}

export default function RecurringDeleteSheet({
  visible,
  taskTitle,
  onClose,
  onDeleteOccurrence,
  onDeleteSeries,
}: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.titleRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="repeat" size={18} color={colors.danger} />
            </View>
            <Text style={styles.title}>{t('home.deleteRecurringTitle')}</Text>
          </View>

          <Text style={styles.subtitle}>
            {t('home.deleteRecurringSubtitle', { title: taskTitle })}
          </Text>

          {/* This day only */}
          <TouchableOpacity
            style={[styles.btn, styles.btnOccurrence]}
            activeOpacity={0.75}
            onPress={() => { onDeleteOccurrence(); onClose(); }}
          >
            <Ionicons name="today-outline" size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.btnText, styles.btnTextOccurrence]}>
                {t('home.deleteOccurrenceOnly')}
              </Text>
              <Text style={[styles.btnSub, styles.btnSubOccurrence]}>
                {t('home.deleteOccurrenceOnlySub')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={`${colors.accent}80`} />
          </TouchableOpacity>

          {/* Entire series */}
          <TouchableOpacity
            style={[styles.btn, styles.btnSeries]}
            activeOpacity={0.75}
            onPress={() => { onDeleteSeries(); onClose(); }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.btnText, styles.btnTextSeries]}>
                {t('home.deleteEntireSeries')}
              </Text>
              <Text style={[styles.btnSub, styles.btnSubSeries]}>
                {t('home.deleteEntireSeriesSub')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={`${colors.danger}80`} />
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
