import { useMemo, useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useTaskStore } from '@/lib/store';
import { isNotificationsDisabledInCurrentRuntime } from '@/lib/notifications';
import { t } from '@/lib/i18n';
import { getAppLocale, setAppLocale } from '@/lib/i18n/locale';
import { useAppTheme } from '@/lib/theme';
import type { AppThemeColors } from '@/lib/theme';
import type { ThemeMode } from '@/lib/theme';
import OptionsSheet from '@/components/OptionsSheet';
import ConfirmSheet from '@/components/ConfirmSheet';

function createSettingsStyles(c: AppThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: c.surfaceElevated,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.inputBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: c.textPrimary,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
    },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceElevated,
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
      gap: 16,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: c.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 22,
      fontWeight: '700',
      color: c.onAccent,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 18,
      fontWeight: '700',
      color: c.textPrimary,
    },
    profileEmail: {
      fontSize: 13,
      color: c.textSecondary,
      marginTop: 2,
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textSecondary,
      letterSpacing: 1,
      marginBottom: 8,
      marginLeft: 4,
    },
    expoGoBanner: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: c.bannerWarningBg,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.bannerWarningBorder,
      alignItems: 'flex-start',
    },
    expoGoBannerText: {
      flex: 1,
      fontSize: 13,
      color: c.bannerWarningText,
      lineHeight: 19,
    },
    card: {
      backgroundColor: c.surfaceElevated,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 20,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rowLabel: {
      flex: 1,
      fontSize: 15,
      color: c.textPrimary,
      fontWeight: '500',
    },
    dangerText: {
      color: c.danger,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    rowValue: {
      fontSize: 14,
      color: c.textSecondary,
    },
    separator: {
      height: 1,
      backgroundColor: c.divider,
      marginLeft: 64,
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
  });
}

interface SettingRowProps {
  styles: ReturnType<typeof createSettingsStyles>;
  colors: AppThemeColors;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
}

function SettingRow({
  styles,
  colors,
  icon,
  iconColor = colors.accent,
  label,
  value,
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
      <View style={[styles.rowIcon, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {right ?? null}
        {onPress && !right ? (
          <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, setUser } = useTaskStore();
  const { colors, mode, setMode } = useAppTheme();
  const styles = useMemo(() => createSettingsStyles(colors), [colors]);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [showSignOutSheet, setShowSignOutSheet] = useState(false);
  const [showLangSheet, setShowLangSheet] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);

  const doSignOut = () => {
    void (async () => {
      setSigningOut(true);
      try {
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

  const displayName = user?.full_name ?? user?.email?.split('@')[0] ?? t('settings.userFallback');
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>{t('settings.sectionAccount')}</Text>
        <View style={styles.card}>
          <SettingRow
            styles={styles}
            colors={colors}
            icon="person-outline"
            label={t('settings.fullName')}
            value={user?.full_name ?? '—'}
          />
          <View style={styles.separator} />
          <SettingRow
            styles={styles}
            colors={colors}
            icon="mail-outline"
            label={t('settings.email')}
            value={user?.email ?? '—'}
          />
        </View>

        <Text style={styles.sectionHeader}>{t('settings.sectionNotifications')}</Text>
        {isNotificationsDisabledInCurrentRuntime ? (
          <View style={styles.expoGoBanner}>
            <Ionicons name="information-circle-outline" size={20} color={colors.bannerWarningText} />
            <Text style={styles.expoGoBannerText}>{t('settings.expoGoBanner')}</Text>
          </View>
        ) : null}
        <View style={styles.card}>
          <SettingRow
            styles={styles}
            colors={colors}
            icon="notifications-outline"
            label={t('settings.enableNotifications')}
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                disabled={isNotificationsDisabledInCurrentRuntime}
                trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
                thumbColor={colors.switchThumb}
              />
            }
          />
        </View>

        <Text style={styles.sectionHeader}>{t('settings.sectionApp')}</Text>
        <View style={styles.card}>
          <SettingRow
            styles={styles}
            colors={colors}
            icon="language-outline"
            label={t('settings.language')}
            value={getAppLocale() === 'he' ? t('settings.langHebrew') : t('settings.langEnglish')}
            onPress={() => setShowLangSheet(true)}
          />
          <View style={styles.separator} />
          <SettingRow
            styles={styles}
            colors={colors}
            icon="moon-outline"
            label={t('settings.appearance')}
            value={themeDisplay}
            onPress={() => setShowThemeSheet(true)}
          />
          <View style={styles.separator} />
          <SettingRow
            styles={styles}
            colors={colors}
            icon="information-circle-outline"
            label={t('settings.version')}
            value="1.0.0"
          />
          <View style={styles.separator} />
          <SettingRow
            styles={styles}
            colors={colors}
            icon="shield-checkmark-outline"
            iconColor={colors.success}
            label={t('settings.privacy')}
            onPress={() => {}}
          />
        </View>

        <View style={styles.card}>
          <SettingRow
            styles={styles}
            colors={colors}
            icon="log-out-outline"
            iconColor={colors.danger}
            label={t('settings.signOut')}
            onPress={signingOut ? undefined : () => setShowSignOutSheet(true)}
            danger
            right={
              signingOut ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : undefined
            }
          />
        </View>
      </ScrollView>

      {/* Sign-out spinner overlay */}
      <Modal visible={signingOut} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.signOutOverlay}>
          <View style={styles.signOutCard}>
            <ActivityIndicator size="large" color={colors.activityIndicator} />
            <Text style={styles.signOutText}>{t('settings.signingOut')}</Text>
          </View>
        </View>
      </Modal>

      {/* Sign out confirmation */}
      <ConfirmSheet
        visible={showSignOutSheet}
        icon="log-out-outline"
        title={t('settings.signOutConfirm')}
        message={t('settings.signOutMsg')}
        confirmLabel={t('settings.signOut')}
        onConfirm={doSignOut}
        onClose={() => setShowSignOutSheet(false)}
      />

      {/* Language picker */}
      <OptionsSheet
        visible={showLangSheet}
        title={t('settings.language')}
        options={langOptions}
        selected={getAppLocale()}
        onSelect={(v) => void setAppLocale(v as 'he' | 'en')}
        onClose={() => setShowLangSheet(false)}
      />

      {/* Theme/appearance picker */}
      <OptionsSheet
        visible={showThemeSheet}
        title={t('settings.appearance')}
        options={themeOptions}
        selected={mode}
        onSelect={(v) => void setMode(v as ThemeMode)}
        onClose={() => setShowThemeSheet(false)}
      />
    </SafeAreaView>
  );
}
