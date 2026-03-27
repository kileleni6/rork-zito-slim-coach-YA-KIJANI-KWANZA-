import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { ZitoProvider, useZito } from '@/providers/ZitoProvider';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { profile, isLoading: profileLoading } = useZito();
  const { colors, isDark } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !profileLoading) {
      SplashScreen.hideAsync();
      if (!isAuthenticated) {
        router.replace('/auth' as never);
      } else if (!profile.onboardingComplete) {
        router.replace('/onboarding' as never);
      } else {
        router.replace('/(tabs)' as never);
      }
    }
  }, [authLoading, profileLoading, isAuthenticated, profile.onboardingComplete]);

  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="plate" options={{ title: 'Plate Visualization' }} />
      <Stack.Screen name="pace" options={{ title: 'Eating Pace' }} />
      <Stack.Screen name="window" options={{ title: 'Eating Window' }} />
      <Stack.Screen name="achievements" options={{ title: 'Achievements' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <ThemeProvider>
          <AuthProvider>
            <ZitoProvider>
              <RootLayoutNav />
            </ZitoProvider>
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
