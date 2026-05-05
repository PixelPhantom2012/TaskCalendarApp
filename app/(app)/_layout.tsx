import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTaskStore } from '@/lib/store';

export default function AppLayout() {
  const router = useRouter();
  const fetchTasks = useTaskStore((s) => s.fetchTasks);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/(auth)/login');
      } else {
        fetchTasks();
      }
    });
  }, [router, fetchTasks]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="create"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="settings" />
      <Stack.Screen
        name="search"
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
