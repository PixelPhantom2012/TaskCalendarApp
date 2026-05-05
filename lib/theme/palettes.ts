/**
 * Semantic colors for light/dark UI. Use via `useAppTheme().colors`.
 */
export interface AppThemeColors {
  bg: string;
  bgCanvas: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  placeholder: string;
  border: string;
  borderMuted: string;
  icon: string;
  iconMuted: string;
  accent: string;
  accentMuted: string;
  danger: string;
  success: string;
  chevron: string;
  switchTrackOff: string;
  switchTrackOn: string;
  switchThumb: string;
  shadow: string;
  overlay: string;
  overlayLight: string;
  modalSheet: string;
  inputBg: string;
  divider: string;
  refreshTint: string;
  /** expo-status-bar: use `light` on dark backgrounds, `dark` on light */
  statusBarStyle: 'light' | 'dark';
  calendar: {
    section: string;
    day: string;
    dayDisabled: string;
    today: string;
    selectedBg: string;
    selectedText: string;
    dot: string;
    arrow: string;
    month: string;
  };
  /** Ionicons primary actions on tinted surfaces */
  onAccent: string;
  authLogoBg: string;
  bannerWarningBg: string;
  bannerWarningBorder: string;
  bannerWarningText: string;
  activityIndicator: string;
}

export const lightColors: AppThemeColors = {
  bg: '#F8F9FD',
  bgCanvas: '#E8ECF6',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F3F6FC',
  textPrimary: '#1A1A2E',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',
  placeholder: '#C7C7CC',
  border: '#F0F0F5',
  borderMuted: '#E5E7EB',
  icon: '#1A1A2E',
  iconMuted: '#8E8E93',
  accent: '#1A73E8',
  accentMuted: '#4285F4',
  danger: '#FF6B6B',
  success: '#34D399',
  chevron: '#C7C7CC',
  switchTrackOff: '#E5E7EB',
  switchTrackOn: '#1A73E8',
  switchThumb: '#FFFFFF',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.4)',
  overlayLight: 'rgba(0,0,0,0.35)',
  modalSheet: '#FFFFFF',
  inputBg: '#F8F9FD',
  divider: '#F8F9FD',
  refreshTint: '#1A73E8',
  statusBarStyle: 'dark',
  calendar: {
    section: '#5F6368',
    day: '#202124',
    dayDisabled: '#BDC1C6',
    today: '#1A73E8',
    selectedBg: '#1A73E8',
    selectedText: '#FFFFFF',
    dot: '#1A73E8',
    arrow: '#444746',
    month: '#202124',
  },
  onAccent: '#FFFFFF',
  authLogoBg: '#EEF2FF',
  bannerWarningBg: '#FFF8E8',
  bannerWarningBorder: '#FFE5B8',
  bannerWarningText: '#664400',
  activityIndicator: '#1A73E8',
};

export const darkColors: AppThemeColors = {
  /** Google Calendar–style dark surfaces (approx. Material surfaces) */
  bg: '#202124',
  bgCanvas: '#202124',
  surface: '#202124',
  surfaceElevated: '#303034',
  surfaceMuted: '#292a2d',
  textPrimary: '#E8EAED',
  textSecondary: '#9AA0A6',
  textTertiary: '#80868B',
  placeholder: '#9AA0A6',
  border: '#3c4043',
  borderMuted: 'rgba(60,64,67,0.55)',
  icon: '#E8EAED',
  iconMuted: '#9AA0A6',
  /** Material dark-style primary — Calendar FAB / today / accents */
  accent: '#8AB4F8',
  accentMuted: '#AECBFA',
  danger: '#F28B82',
  success: '#81C995',
  chevron: '#9AA0A6',
  switchTrackOff: '#555',
  switchTrackOn: '#8AB4F8',
  switchThumb: '#E8EAED',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.6)',
  overlayLight: 'rgba(0,0,0,0.45)',
  modalSheet: '#303034',
  inputBg: '#303034',
  divider: '#3c4043',
  refreshTint: '#8AB4F8',
  statusBarStyle: 'light',
  calendar: {
    section: '#9AA0A6',
    day: '#E8EAED',
    dayDisabled: '#5f6368',
    today: '#8AB4F8',
    selectedBg: '#8AB4F8',
    selectedText: '#202124',
    dot: '#8AB4F8',
    arrow: '#8AB4F8',
    month: '#E8EAED',
  },
  onAccent: '#202124',
  authLogoBg: '#303034',
  bannerWarningBg: '#3f3526',
  bannerWarningBorder: '#6f5520',
  bannerWarningText: '#fce8ae',
  activityIndicator: '#8AB4F8',
};
