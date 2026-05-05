/**
 * Generic bottom-sheet picker — themed option list with a checkmark on the active item.
 * Replaces Alert.alert for Language & Appearance pickers.
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

export interface SheetOption {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Short script label in place of `icon` (e.g. ע for Hebrew, A for English). */
  glyphText?: string;
}

interface Props {
  visible: boolean;
  title: string;
  options: SheetOption[];
  selected: string;
  onSelect: (value: string) => void;
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
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.borderMuted,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 4,
    },
    titleRow: {
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: c.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.1,
    },
    optionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 15,
      gap: 14,
    },
    optionIconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionLabel: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      color: c.textPrimary,
    },
    optionLabelActive: {
      color: c.accent,
      fontWeight: '600',
    },
    optionGlyph: {
      fontSize: 16,
      fontWeight: '700',
    },
    optionGlyphActive: {
      color: c.accent,
    },
    optionGlyphInactive: {
      color: c.iconMuted,
    },
    check: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.divider,
      marginLeft: 62,
    },
    cancelBtn: {
      marginHorizontal: 20,
      marginTop: 12,
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

export default function OptionsSheet({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
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
            <Text style={styles.title}>{title}</Text>
          </View>

          {options.map((opt, idx) => {
            const isActive = opt.value === selected;
            return (
              <View key={opt.value}>
                <TouchableOpacity
                  style={styles.optionBtn}
                  activeOpacity={0.7}
                  onPress={() => { onSelect(opt.value); onClose(); }}
                >
                  {opt.glyphText || opt.icon ? (
                    <View
                      style={[
                        styles.optionIconCircle,
                        { backgroundColor: isActive ? `${colors.accent}18` : `${colors.iconMuted}12` },
                      ]}
                    >
                      {opt.glyphText ? (
                        <Text
                          style={[
                            styles.optionGlyph,
                            isActive ? styles.optionGlyphActive : styles.optionGlyphInactive,
                            opt.glyphText.length > 1 && { fontSize: 13, letterSpacing: -0.5 },
                          ]}
                        >
                          {opt.glyphText}
                        </Text>
                      ) : opt.icon ? (
                        <Ionicons
                          name={opt.icon}
                          size={18}
                          color={isActive ? colors.accent : colors.iconMuted}
                        />
                      ) : null}
                    </View>
                  ) : null}

                  <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                    {opt.label}
                  </Text>

                  <View
                    style={[
                      styles.check,
                      { backgroundColor: isActive ? `${colors.accent}18` : 'transparent' },
                    ]}
                  >
                    {isActive && (
                      <Ionicons name="checkmark" size={15} color={colors.accent} />
                    )}
                  </View>
                </TouchableOpacity>
                {idx < options.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
