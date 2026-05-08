import React, { useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '@/lib/store';
import { useAppTheme } from '@/lib/theme';
import type { AppThemeColors } from '@/lib/theme';
import { t } from '@/lib/i18n';
import type { CalendarViewMode } from '@/lib/calendarViewMode';

type Props = {
  visible: boolean;
  onClose: () => void;
  onRefresh: () => void;
  calendarViewMode: CalendarViewMode;
  onSelectViewMode: (mode: CalendarViewMode) => void;
};

function createStyles(c: AppThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: c.overlay,
      flexDirection: 'row',
    },
    drawer: {
      width: 300,
      backgroundColor: c.bg,
      height: '100%',
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderMuted,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitleWrap: {
      flex: 1,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '500',
      color: c.textPrimary,
    },
    settingsBtn: {
      padding: 4,
    },
    section: {
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderMuted,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    itemActive: {
      backgroundColor: c.accent + '1A',
      marginHorizontal: 8,
      borderRadius: 24,
    },
    icon: {
      width: 24,
      textAlign: 'center',
      marginRight: 16,
    },
    itemText: {
      fontSize: 16,
      color: c.textPrimary,
      fontWeight: '500',
    },
    itemTextActive: {
      color: c.accent,
      fontWeight: '600',
    },
    accountSection: {
      paddingVertical: 12,
    },
    accountHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    accountAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.surfaceElevated,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    accountEmail: {
      fontSize: 14,
      color: c.textPrimary,
      fontWeight: '500',
    },
    accountName: {
      fontSize: 12,
      color: c.textSecondary,
    },
    checkboxItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      paddingLeft: 64, // Indent to align with account text
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    checkboxLabel: {
      fontSize: 14,
      color: c.textPrimary,
      fontWeight: '400',
    },
  });
}

export default function DrawerMenu({
  visible,
  onClose,
  onRefresh,
  calendarViewMode,
  onSelectViewMode,
}: Props) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { user } = useTaskStore();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  function goToSettings() {
    onClose();
    router.push('/(app)/settings');
  }

  function pick(mode: CalendarViewMode) {
    onSelectViewMode(mode);
    onClose();
  }

  const monthLike = calendarViewMode === 'month';

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Drawer Content */}
        <View style={[styles.drawer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {t('auth.appName')}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={goToSettings}
                accessibilityRole="button"
                accessibilityLabel={t('settings.title')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.item, monthLike ? styles.itemActive : undefined]}
                onPress={() => pick('month')}
              >
                <Ionicons
                  name="list"
                  size={24}
                  color={monthLike ? colors.accent : colors.iconMuted}
                  style={styles.icon}
                />
                <Text style={[styles.itemText, monthLike ? styles.itemTextActive : undefined]}>
                  {t('drawer.schedule')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.item, calendarViewMode === 'day' ? styles.itemActive : undefined]}
                onPress={() => pick('day')}
              >
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color={calendarViewMode === 'day' ? colors.accent : colors.iconMuted}
                  style={styles.icon}
                />
                <Text
                  style={[
                    styles.itemText,
                    calendarViewMode === 'day' ? styles.itemTextActive : undefined,
                  ]}
                >
                  {t('drawer.day')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.item, calendarViewMode === 'threeDay' ? styles.itemActive : undefined]}
                onPress={() => pick('threeDay')}
              >
                <Ionicons
                  name="calendar-clear-outline"
                  size={24}
                  color={calendarViewMode === 'threeDay' ? colors.accent : colors.iconMuted}
                  style={styles.icon}
                />
                <Text
                  style={[
                    styles.itemText,
                    calendarViewMode === 'threeDay' ? styles.itemTextActive : undefined,
                  ]}
                >
                  {t('drawer.threeDays')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.item, calendarViewMode === 'week' ? styles.itemActive : undefined]}
                onPress={() => pick('week')}
              >
                <Ionicons
                  name="apps-outline"
                  size={24}
                  color={calendarViewMode === 'week' ? colors.accent : colors.iconMuted}
                  style={styles.icon}
                />
                <Text
                  style={[styles.itemText, calendarViewMode === 'week' ? styles.itemTextActive : undefined]}
                >
                  {t('drawer.week')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.item, monthLike ? styles.itemActive : undefined]}
                onPress={() => pick('month')}
              >
                <Ionicons
                  name="grid"
                  size={24}
                  color={monthLike ? colors.accent : colors.iconMuted}
                  style={styles.icon}
                />
                <Text style={[styles.itemText, monthLike ? styles.itemTextActive : undefined]}>
                  {t('drawer.month')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  onRefresh();
                  onClose();
                }}
              >
                <Ionicons name="refresh" size={24} color={colors.iconMuted} style={styles.icon} />
                <Text style={styles.itemText}>{t('drawer.refresh')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.accountSection}>
              <View style={styles.accountHeader}>
                {user?.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.accountAvatar} />
                ) : (
                  <View style={styles.accountAvatar}>
                    <Ionicons name="person" size={16} color={colors.iconMuted} />
                  </View>
                )}
                <View>
                  <Text style={styles.accountEmail}>{user?.email || 'User'}</Text>
                  <Text style={styles.accountName}>Google</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.checkboxItem} onPress={onClose}>
                <View style={[styles.checkbox, { backgroundColor: '#4285F4' }]}>
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                </View>
                <Text style={styles.checkboxLabel}>My calendar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.checkboxItem} onPress={onClose}>
                <View style={[styles.checkbox, { backgroundColor: '#8AB4F8' }]}>
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                </View>
                <Text style={styles.checkboxLabel}>Tasks</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
        
        {/* Click-away overlay */}
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </View>
    </Modal>
  );
}
