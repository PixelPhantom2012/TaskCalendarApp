/**
 * Themed bottom-sheet confirmation dialog.
 * Replaces Alert.alert for sign-out and clear-notifications confirmations.
 */
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
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  message?: string;
  confirmLabel: string;
  confirmDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
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
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.borderMuted,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 22,
    },
    iconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: c.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.3,
      marginBottom: 8,
    },
    message: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    confirmBtn: {
      height: 52,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    confirmText: {
      fontSize: 16,
      fontWeight: '700',
    },
    cancelBtn: {
      height: 50,
      borderRadius: 14,
      backgroundColor: c.inputBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textSecondary,
    },
  });
}

export default function ConfirmSheet({
  visible,
  icon,
  iconColor,
  title,
  message,
  confirmLabel,
  confirmDestructive = true,
  onConfirm,
  onClose,
}: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const resolvedIconColor = iconColor ?? (confirmDestructive ? colors.danger : colors.accent);

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

          {icon ? (
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${resolvedIconColor}15` },
              ]}
            >
              <Ionicons name={icon} size={26} color={resolvedIconColor} />
            </View>
          ) : null}

          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              {
                backgroundColor: confirmDestructive
                  ? `${colors.danger}15`
                  : `${colors.accent}15`,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: confirmDestructive
                  ? `${colors.danger}40`
                  : `${colors.accent}40`,
              },
            ]}
            activeOpacity={0.75}
            onPress={() => { onConfirm(); onClose(); }}
          >
            <Text
              style={[
                styles.confirmText,
                { color: confirmDestructive ? colors.danger : colors.accent },
              ]}
            >
              {confirmLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
