import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useTaskStore } from '@/lib/store';
import {
  cancelAllNotifications,
  isNotificationsDisabledInCurrentRuntime,
  requestNotificationPermissions,
  rescheduleAllNotificationsForTasks,
} from '@/lib/notifications';
import {
  getNotificationsEnabled as loadNotificationsPref,
  setNotificationsEnabled as saveNotificationsPref,
} from '@/lib/notificationPrefs';
import { t } from '@/lib/i18n';
import { getAppLocale, setAppLocale } from '@/lib/i18n/locale';
import { useAppTheme } from '@/lib/theme';
import type { AppThemeColors } from '@/lib/theme';
import type { ThemeMode } from '@/lib/theme';
import OptionsSheet from '@/components/OptionsSheet';
import ConfirmSheet from '@/components/ConfirmSheet';

function createSettingsStyles(c: AppThemeColors, isDark: boolean) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderMuted,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    iconBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '400',
      color: c.textPrimary,
    },
    content: {
      paddingBottom: 40,
    },
    sectionHeader: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 12,
    },
    sectionHeaderText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.accent,
      letterSpacing: 0.1,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    rowIconContainer: {
      width: 24,
      alignItems: 'center',
      marginRight: 20,
    },
    circleIcon: {
      width: 16,
      height: 16,
      borderRadius: 8,
    },
    rowContent: {
      flex: 1,
    },
    rowLabel: {
      fontSize: 16,
      color: c.textPrimary,
      fontWeight: '400',
    },
    rowLabelBold: {
      fontWeight: '500',
    },
    rowValue: {
      fontSize: 14,
      color: c.textSecondary,
      marginTop: 2,
    },
    dangerText: {
      color: c.danger,
    },
    accountHeader: {
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    accountEmail: {
      fontSize: 16,
      color: c.textPrimary,
      fontWeight: '400',
    },
    accountSubtitle: {
      fontSize: 14,
      color: c.textSecondary,
      marginTop: 2,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.borderMuted,
      marginVertical: 8,
    },
    signOutOverlay: {
      flex: 1,
      backgroundColor: c.overlayLight,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    signOutCard: {
      backgroundColor: c.modalSheet,
      borderRadius: 16,
      paddingVertical: 28,
      paddingHorizontal: 36,
      alignItems: 'center',
      gap: 16,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
    signOutText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textPrimary,
    },
    expoGoBanner: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: c.bannerWarningBg,
      padding: 16,
      alignItems: 'flex-start',
    },
    expoGoBannerText: {
      flex: 1,
      fontSize: 13,
      color: c.bannerWarningText,
      lineHeight: 19,
    },
  });
}

interface SettingRowProps {
  styles: ReturnType<typeof createSettingsStyles>;
  colors: AppThemeColors;
  label: string;
  value?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  isCircleIcon?: boolean;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
}

function SettingRow({
  styles,
  colors,
  label,
  value,
  icon,
  iconColor,
  isCircleIcon,
  onPress,
  right,
  danger,
}: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {(icon || isCircleIcon) && (
        <View style={styles.rowIconContainer}>
          {isCircleIcon ? (
            <View style={[styles.circleIcon, { backgroundColor: iconColor || colors.accent }]} />
          ) : icon ? (
            <Ionicons name={icon} size={24} color={iconColor || colors.iconMuted} />
          ) : null}
        </View>
      )}
      {!icon && !isCircleIcon && <View style={styles.rowIconContainer} />}
      
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      </View>
      
      {right ?? null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, setUser } = useTaskStore();
  const { colors, mode, setMode, resolvedScheme } = useAppTheme();
  const isDark = resolvedScheme === 'dark';
  const styles = useMemo(() => createSettingsStyles(colors, isDark), [colors, isDark]);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [showSignOutSheet, setShowSignOutSheet] = useState(false);
  const [showLangSheet, setShowLangSheet] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);

  useEffect(() => {
    void loadNotificationsPref().then(setNotificationsEnabled);
  }, []);

  const onNotificationsToggle = (value: boolean) => {
    void (async () => {
      setNotificationsEnabled(value);
      await saveNotificationsPref(value);
      if (isNotificationsDisabledInCurrentRuntime) return;
      if (!value) {
        await cancelAllNotifications();
        return;
      }
      await requestNotificationPermissions();
      await rescheduleAllNotificationsForTasks(useTaskStore.getState().tasks);
    })();
  };

  const doSignOut = () => {
    void (async () => {
      setSigningOut(true);
      try {
        await cancelAllNotifications();
        await supabase.auth.signOut();
        setUser(null);
        useTaskStore.setState({ tasks: [] });
        router.replace('/(auth)/login');
      } catch {
        setSigningOut(false);
        Alert.alert(t('settings.signOutFailed'), t('settings.signOutFailedMsg'));
      }
    })();
  };

  const langOptions = [
    { value: 'he', label: t('settings.langHebrew'), glyphText: 'IL' },
    { value: 'en', label: t('settings.langEnglish'), glyphText: 'US' },
  ];

  const themeOptions = [
    { value: 'light', label: t('settings.themeLight'), icon: 'sunny-outline' as const },
    { value: 'dark', label: t('settings.themeDark'), icon: 'moon-outline' as const },
    { value: 'system', label: t('settings.themeSystem'), icon: 'phone-portrait-outline' as const },
  ];

  const themeDisplay =
    mode === 'light'
      ? t('settings.themeLight')
      : mode === 'dark'
        ? t('settings.themeDark')
        : t('settings.themeSystem');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.icon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* General Settings */}
        <SettingRow
          styles={styles}
          colors={colors}
          label="General"
        />
        
        <SettingRow
          styles={styles}
          colors={colors}
          label={t('settings.language')}
          value={getAppLocale() === 'he' ? t('settings.langHebrew') : t('settings.langEnglish')}
          onPress={() => setShowLangSheet(true)}
        />
        
        <SettingRow
          styles={styles}
          colors={colors}
          label={t('settings.appearance')}
          value={themeDisplay}
          onPress={() => setShowThemeSheet(true)}
        />

        {isNotificationsDisabledInCurrentRuntime && (
          <View style={styles.expoGoBanner}>
            <Ionicons name="information-circle-outline" size={20} color={colors.bannerWarningText} />
            <Text style={styles.expoGoBannerText}>{t('settings.expoGoBanner')}</Text>
          </View>
        )}
        <SettingRow
          styles={styles}
          colors={colors}
          label={t('settings.enableNotifications')}
          right={
            <Switch
              value={notificationsEnabled}
              onValueChange={onNotificationsToggle}
              disabled={isNotificationsDisabledInCurrentRuntime}
              trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
              thumbColor={colors.switchThumb}
            />
          }
        />

        <SettingRow
          styles={styles}
          colors={colors}
          label="Manage accounts"
          onPress={() => setShowSignOutSheet(true)}
        />

        <View style={styles.divider} />

        {/* Account Section */}
        {user?.email && (
          <>
            <View style={styles.accountHeader}>
              <Text style={styles.accountEmail}>{user.email}</Text>
              <Text style={styles.accountSubtitle}>Task Calendar Account</Text>
            </View>

            <SettingRow
              styles={styles}
              colors={colors}
              isCircleIcon
              iconColor="#4285F4"
              label="My calendar"
            />
            
            <SettingRow
              styles={styles}
              colors={colors}
              isCircleIcon
              iconColor="#8AB4F8"
              label="Tasks"
            />
            
            <View style={styles.divider} />
          </>
        )}

        {/* More Section */}
        <View style={styles.accountHeader}>
          <Text style={styles.accountSubtitle}>More</Text>
        </View>

        <SettingRow
          styles={styles}
          colors={colors}
          isCircleIcon
          iconColor="#81C995"
          label="Birthdays"
        />
        
        <SettingRow
          styles={styles}
          colors={colors}
          isCircleIcon
          iconColor="#FDE293"
          label="Holidays"
        />

      </ScrollView>

      {/* Modals and Sheets */}
      <OptionsSheet
        visible={showLangSheet}
        title={t('settings.language')}
        options={langOptions}
        selected={getAppLocale()}
        onSelect={(val) => {
          setShowLangSheet(false);
          if (val === 'he' || val === 'en') {
            void setAppLocale(val);
          }
        }}
        onClose={() => setShowLangSheet(false)}
      />

      <OptionsSheet
        visible={showThemeSheet}
        title={t('settings.appearance')}
        options={themeOptions as any}
        selected={mode}
        onSelect={(val) => {
          setShowThemeSheet(false);
          void setMode(val as ThemeMode);
        }}
        onClose={() => setShowThemeSheet(false)}
      />

      <ConfirmSheet
        visible={showSignOutSheet}
        title={t('settings.signOut')}
        message={t('settings.signOutConfirm')}
        confirmLabel={t('settings.signOut')}
        confirmDestructive
        onConfirm={() => {
          setShowSignOutSheet(false);
          doSignOut();
        }}
        onClose={() => setShowSignOutSheet(false)}
      />

      {signingOut && (
        <Modal transparent animationType="fade">
          <View style={styles.signOutOverlay}>
            <View style={styles.signOutCard}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.signOutText}>{t('settings.signingOut')}</Text>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
