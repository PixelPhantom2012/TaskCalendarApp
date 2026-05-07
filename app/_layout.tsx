import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Text, View } from 'react-native';
import { getSupabaseConfigError, supabase } from '@/lib/supabase';
import { useTaskStore } from '@/lib/store';
import { requestNotificationPermissions } from '@/lib/notifications';
import { initAppLocale } from '@/lib/i18n/locale';
import { ThemeProvider, useAppTheme } from '@/lib/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}

function RootLayoutInner() {
  const setUser = useTaskStore((s) => s.setUser);
  const [ready, setReady] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(() =>
    getSupabaseConfigError()
  );
  const { colors } = useAppTheme();

  useEffect(() => {
    const configError = getSupabaseConfigError();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          full_name: session.user.user_metadata?.full_name ?? null,
          avatar_url: session.user.user_metadata?.avatar_url ?? null,
        });
      } else {
        setUser(null);
      }
    });

    let cancelled = false;

    async function bootstrap() {
      try {
        if (configError) {
          return;
        }
        await initAppLocale();
        if (cancelled) return;
        requestNotificationPermissions();

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? '',
            full_name: session.user.user_metadata?.full_name ?? null,
            avatar_url: session.user.user_metadata?.avatar_url ?? null,
          });
        }
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : String(e);
          setBootstrapError(message);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
          await SplashScreen.hideAsync().catch(() => undefined);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [setUser]);

  if (!ready) {
    return null;
  }

  if (bootstrapError || getSupabaseConfigError()) {
    const message = bootstrapError ?? getSupabaseConfigError() ?? '';
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', backgroundColor: colors.bg }}>
        <Text style={{ color: colors.textPrimary, marginBottom: 12, fontSize: 17, fontWeight: '700' }}>
          Configuration error
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>{message}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={colors.statusBarStyle} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
