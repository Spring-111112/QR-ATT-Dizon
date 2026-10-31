import {
  Redirect,
  Stack,
  useSegments,
} from 'expo-router';

import {
  ActivityIndicator,
  BackHandler,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import { COLORS } from '@/constants/colors';

import { useAuth } from '@/lib/auth';

import { getProfile } from '@/lib/profiles';

import { useEffect, useState } from 'react';

type Role =
  | 'student'
  | 'teacher'
  | 'admin';

export default function RootLayout() {
  const {
    session,
    loading: authLoading,
  } = useAuth();

  const segments = useSegments();

  const [role, setRole] =
    useState<Role | null>(null);

  const [roleLoading, setRoleLoading] =
    useState(false);

  /*
   * Load the user's role whenever
   * the authenticated user changes.
   */
  useEffect(() => {
    let mounted = true;

    const loadRole = async () => {
      if (!session?.user?.id) {
        if (mounted) {
          setRole(null);
          setRoleLoading(false);
        }

        return;
      }

      setRoleLoading(true);

      const profile = await getProfile(
        session.user.id
      );

      if (mounted) {
        setRole(profile?.role ?? null);
        setRoleLoading(false);
      }
    };

    loadRole();

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  /*
   * ADMIN ANDROID BACK BUTTON
   *
   * If the logged-in account is ADMIN,
   * completely disable the physical
   * Android Back button.
   *
   * Student and Teacher accounts are
   * NOT affected.
   */
  useEffect(() => {
    if (
      Platform.OS !== 'android' ||
      role !== 'admin' ||
      !session
    ) {
      return undefined;
    }

    const handleBackPress = () => {
      /*
       * Returning TRUE means:
       *
       * "Android Back button was handled."
       *
       * Therefore Expo Router will NOT
       * navigate to Home or another page.
       */
      return true;
    };

    const subscription =
      BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress
      );

    return () => {
      subscription.remove();
    };
  }, [
    role,
    session,
  ]);

  /*
   * Wait for authentication first.
   */
  if (authLoading) {
    return (
      <View
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      </View>
    );
  }

  const path = segments?.[0];

  const inAuthGroup =
    path === 'login' ||
    path === 'register';

  /*
   * No session:
   * only Login/Register are allowed.
   */
  if (!session && !inAuthGroup) {
    return (
      <Redirect href="/login" />
    );
  }

  /*
   * If there is a session, wait until
   * the user's role is loaded before
   * deciding where to redirect.
   */
  if (
    session &&
    inAuthGroup &&
    roleLoading
  ) {
    return (
      <View
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      </View>
    );
  }

  /*
   * User is logged in and currently
   * inside Login/Register.
   *
   * Send each role to the correct
   * starting screen.
   */
  if (session && inAuthGroup) {
    if (role === 'admin') {
      return (
        <Redirect href="/admin" />
      );
    }

    return (
      <Redirect href="/(tabs)" />
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="login"
      />

      <Stack.Screen
        name="register"
      />

      <Stack.Screen
        name="(tabs)"
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.background,
  },
});