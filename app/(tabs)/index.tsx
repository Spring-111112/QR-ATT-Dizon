
import { router } from 'expo-router';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import { COLORS } from '@/constants/colors';

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.background}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Header title="QRPass" />

          <View style={styles.brandBadge}>
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color={COLORS.accent}
            />
            <Text style={styles.brandText}>
              SCHOOL EVENT ATTENDANCE
            </Text>
          </View>
        </View>

        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>WELCOME BACK 👋</Text>

          <Text style={styles.mainTitle}>
            Your Campus,{'\n'}
            <Text style={styles.titleAccent}>
              Your Attendance.
            </Text>
          </Text>

          <Text style={styles.subtitle}>
            Keep track of school events and record your
            attendance with a simple QR scan.
          </Text>
        </View>

        <View style={styles.scanCard}>
          <View style={styles.scanCardTop}>
            <View style={styles.scanIconContainer}>
              <Ionicons
                name="qr-code"
                size={38}
                color={COLORS.accent}
              />
            </View>

            <View style={styles.availableBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.availableText}>
                READY TO SCAN
              </Text>
            </View>
          </View>

          <Text style={styles.scanTitle}>
            Mark Your Attendance
          </Text>

          <Text style={styles.scanDescription}>
            Scan your event's QR code to register your attendance
            quickly and securely.
          </Text>

          <View style={styles.scanButton}>
            <AppButton
              theme="primary"
              title="Scan QR Code"
              icon="qr-code-outline"
              onPress={() => router.push('/scan')}
            />
          </View>

          <View style={styles.scanFooter}>
            <Ionicons
              name="lock-closed-outline"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.scanFooterText}>
              Secure attendance registration
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <Text style={styles.sectionSubtitle}>
              Everything you need in one place.
            </Text>
          </View>

          <Ionicons
            name="apps-outline"
            size={22}
            color={COLORS.accent}
          />
        </View>

        <View style={styles.quickActions}>
          <View style={styles.actionCard}>
            <View style={styles.actionCardHeader}>
              <View style={styles.eventsIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={23}
                  color={COLORS.accent}
                />
              </View>

              <View style={styles.arrowIcon}>
                <Ionicons
                  name="arrow-forward-outline"
                  size={16}
                  color={COLORS.textSecondary}
                />
              </View>
            </View>

            <Text style={styles.actionTitle}>School Events</Text>
            <Text style={styles.actionDescription}>
              Browse available events and find the ones you need
              to attend.
            </Text>

            <AppButton
              title="View Events"
              icon="arrow-forward-outline"
              onPress={() => router.push('/events')}
            />
          </View>

          <View style={styles.actionCard}>
            <View style={styles.actionCardHeader}>
              <View style={styles.historyIcon}>
                <Ionicons
                  name="time-outline"
                  size={23}
                  color={COLORS.gold}
                />
              </View>

              <View style={styles.arrowIcon}>
                <Ionicons
                  name="arrow-forward-outline"
                  size={16}
                  color={COLORS.textSecondary}
                />
              </View>
            </View>

            <Text style={styles.actionTitle}>
              Attendance History
            </Text>
            <Text style={styles.actionDescription}>
              Review your previous attendance registrations
              and records.
            </Text>

            <AppButton
              title="View History"
              icon="arrow-forward-outline"
              onPress={() => router.push('/history')}
            />
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={23}
              color={COLORS.success}
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Your Attendance, Protected
            </Text>
            <Text style={styles.infoText}>
              Your attendance records are linked to your account
              and securely stored in the system.
            </Text>
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileIcon}>
            <Ionicons
              name="person-outline"
              size={22}
              color={COLORS.accent}
            />
          </View>

          <View style={styles.profileTextContainer}>
            <Text style={styles.profileTitle}>Your Profile</Text>
            <Text style={styles.profileDescription}>
              Manage your account information.
            </Text>
          </View>

          <View style={styles.profileButton}>
            <AppButton
              title="Open"
              icon="arrow-forward-outline"
              onPress={() => router.push('/profile')}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>
            QRPass • SCHOOL ATTENDANCE
          </Text>
          <Text style={styles.footerSubtext}>
            Simple. Secure. Organized.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 35,
  },
  headerContainer: {
    marginBottom: 30,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    marginTop: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  brandText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: COLORS.accent,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: COLORS.accent,
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  titleAccent: {
    color: COLORS.accent,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
    maxWidth: 340,
  },
  scanCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 19,
    marginBottom: 30,
  },
  scanCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  scanIconContainer: {
    width: 66,
    height: 66,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  availableText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: COLORS.textPrimary,
  },
  scanTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  scanDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 19,
  },
  scanButton: {
    marginBottom: 15,
  },
  scanFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  scanFooterText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  quickActions: {
    gap: 13,
    marginBottom: 23,
  },
  actionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 17,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  eventsIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  arrowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  actionDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    marginBottom: 15,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 18,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 30,
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  profileTextContainer: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  profileDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textSecondary,
  },
  profileButton: {
    minWidth: 82,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 5,
  },
  footerLine: {
    width: 42,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginBottom: 14,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});