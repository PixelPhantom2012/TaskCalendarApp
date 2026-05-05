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
  accent: '#4A6FE3',
  accentMuted: '#7C9AF2',
  danger: '#FF6B6B',
  success: '#34D399',
  chevron: '#C7C7CC',
  switchTrackOff: '#E5E7EB',
  switchTrackOn: '#4A6FE3',
  switchThumb: '#FFFFFF',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.4)',
  overlayLight: 'rgba(0,0,0,0.35)',
  modalSheet: '#FFFFFF',
  inputBg: '#F8F9FD',
  divider: '#F8F9FD',
  refreshTint: '#4A6FE3',
  statusBarStyle: 'dark',
  calendar: {
    section: '#8E8E93',
    day: '#1A1A2E',
    dayDisabled: '#C7C7CC',
    today: '#4A6FE3',
    selectedBg: '#4A6FE3',
    selectedText: '#FFFFFF',
    dot: '#4A6FE3',
    arrow: '#4A6FE3',
    month: '#1A1A2E',
  },
  onAccent: '#FFFFFF',
  authLogoBg: '#EEF2FF',
  bannerWarningBg: '#FFF8E8',
  bannerWarningBorder: '#FFE5B8',
  bannerWarningText: '#664400',
  activityIndicator: '#4A6FE3',
};

export const darkColors: AppThemeColors = {
  bg: '#121418',
  bgCanvas: '#16191f',
  surface: '#1e2229',
  surfaceElevated: '#252a33',
  surfaceMuted: '#1a1e26',
  textPrimary: '#E8EAED',
  textSecondary: '#9AA0A6',
  textTertiary: '#6B7280',
  placeholder: '#888888',
  border: '#2d333b',
  borderMuted: '#3d4450',
  icon: '#E8EAED',
  iconMuted: '#9AA0A6',
  accent: '#6B8AF7',
  accentMuted: '#8FA8F9',
  danger: '#FF8A8A',
  success: '#4ADE80',
  chevron: '#6B7280',
  switchTrackOff: '#3d4450',
  switchTrackOn: '#6B8AF7',
  switchThumb: '#FFFFFF',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.65)',
  overlayLight: 'rgba(0,0,0,0.5)',
  modalSheet: '#252a33',
  inputBg: '#1a1e26',
  divider: '#2d333b',
  refreshTint: '#6B8AF7',
  statusBarStyle: 'light',
  calendar: {
    section: '#9AA0A6',
    day: '#E8EAED',
    dayDisabled: '#5f6368',
    today: '#6B8AF7',
    selectedBg: '#6B8AF7',
    selectedText: '#FFFFFF',
    dot: '#6B8AF7',
    arrow: '#6B8AF7',
    month: '#E8EAED',
  },
  onAccent: '#FFFFFF',
  authLogoBg: '#2a3150',
  bannerWarningBg: '#2a2418',
  bannerWarningBorder: '#5c4d20',
  bannerWarningText: '#e8d4a8',
  activityIndicator: '#6B8AF7',
};
