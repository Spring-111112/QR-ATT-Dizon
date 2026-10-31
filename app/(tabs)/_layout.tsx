import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { getProfile } from '@/lib/profiles';

type Role = 'student' | 'teacher' | 'admin';

export default function TabLayout() {
  const { user } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let mounted = true;

    const loadRole = async () => {
      if (!user) {
        if (mounted) setRole(null);
        return;
      }

      try {
        const profile = await getProfile(user.id);

        if (mounted) {
          setRole(profile?.role ?? null);
        }
      } catch (error) {
        console.error('Failed to load user role:', error);

        if (mounted) {
          setRole(null);
        }
      }
    };

    loadRole();

    return () => {
      mounted = false;
    };
  }, [user]);

  const isTeacher = role === 'teacher';
  const isAdmin = role === 'admin';
  const isStudent = role === 'student';

  return (
    <Tabs
      screenOptions={{
        // Screens manage their own page titles.
        headerShown: false,

        // Tab bar colors
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,

        // Bottom navigation
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
          elevation: 0,
          shadowOpacity: 0,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },

        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          href: isAdmin ? null : '/',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          href: isAdmin ? null : '/scan',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'qr-code' : 'qr-code-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          href: isAdmin ? null : '/history',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'time' : 'time-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          href: isStudent ? '/events' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="teacher"
        options={{
          title: 'Teacher',
          href: isTeacher ? '/teacher' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'clipboard' : 'clipboard-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: isAdmin ? '/admin' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused
                  ? 'shield-checkmark'
                  : 'shield-checkmark-outline'
              }
              size={23}
              color={color}
            />
          ),
        }}
      />

      {/* Hidden routes */}
      <Tabs.Screen
        name="teacher-events"
        options={{ href: null, title: 'My Events' }}
      />

      <Tabs.Screen
        name="admin-users"
        options={{ href: null, title: 'Manage Users' }}
      />

      <Tabs.Screen
        name="admin-students"
        options={{ href: null, title: 'Students' }}
      />

      <Tabs.Screen
        name="admin-teachers"
        options={{ href: null, title: 'Teachers' }}
      />

      <Tabs.Screen
        name="admin-admins"
        options={{ href: null, title: 'Administrators' }}
      />

      <Tabs.Screen
        name="admin-events"
        options={{ href: null, title: 'Manage Events' }}
      />

      <Tabs.Screen
        name="admin-attendance"
        options={{ href: null, title: 'Attendance' }}
      />

      <Tabs.Screen
        name="admin-reports"
        options={{ href: null, title: 'Reports' }}
      />

      <Tabs.Screen
        name="admin-report-events"
        options={{ href: null, title: 'Attendance by Event' }}
      />
    </Tabs>
  );
}