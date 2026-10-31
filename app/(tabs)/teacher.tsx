import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import {
  createEvent,
  getEventsByTeacher,
  type CloudEvent,
} from '@/lib/events';
import { getProfile } from '@/lib/profiles';
import { buildQRPayload } from '@/lib/qr';

type Role = 'student' | 'teacher' | 'admin';

function toLocalISO(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}

function formatDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');

  const month = date.toLocaleString('en-US', {
    month: 'short',
  });

  return `${month} ${pad(date.getDate())}, ${date.getFullYear()} at ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function formatEventDate(value: string | null) {
  if (!value) return 'Not set';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return formatDateTime(date);
}

const QUICK_END_OPTIONS = [
  { label: '+30 min', ms: 30 * 60 * 1000 },
  { label: '+1 hour', ms: 60 * 60 * 1000 },
  { label: '+2 hours', ms: 2 * 60 * 60 * 1000 },
];

type EditTarget = 'start' | 'end';

export default function TeacherScreen() {
  const { user } = useAuth();

  const [role, setRole] = useState<Role | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [eventId, setEventId] = useState('');

  const [startDate, setStartDate] = useState(() => new Date());

  const [endDate, setEndDate] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000)
  );

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editingPart, setEditingPart] = useState<'date' | 'time'>('date');

  const [payload, setPayload] = useState<string | null>(null);
  const [qrEvent, setQrEvent] = useState<CloudEvent | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [events, setEvents] = useState<CloudEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const isAndroid = Platform.OS === 'android';

  /*
   * LOAD ROLE
   */
  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (!user) {
        setRoleLoading(false);

        return () => {
          active = false;
        };
      }

      setRoleLoading(true);

      getProfile(user.id)
        .then((profile) => {
          if (!active) return;

          setRole(profile?.role ?? 'student');
        })
        .catch(() => {
          if (!active) return;
          setRole('student');
        })
        .finally(() => {
          if (active) setRoleLoading(false);
        });

      return () => {
        active = false;
      };
    }, [user])
  );

  /*
   * LOAD EVENTS
   * Newest event is always first.
   */
  const loadMyEvents = useCallback(async () => {
    if (!user?.id) {
      setEvents([]);
      return;
    }

    setEventsLoading(true);

    try {
      const data = await getEventsByTeacher(user.id);

      const sortedEvents = [...data].sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );

      setEvents(sortedEvents);
    } catch (error) {
      console.error('Failed to load teacher events:', error);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (role === 'teacher' || role === 'admin') {
        loadMyEvents();
      }
    }, [role, loadMyEvents])
  );

  /*
   * DATE/TIME PICKER
   */
  const openPicker = (target: EditTarget) => {
    setMessage(null);
    setEditTarget(target);
    setEditingPart('date');
  };

  const onPickerChange = (
    event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (!editTarget) return;

    if (event.type === 'dismissed' || !selected) {
      setEditTarget(null);
      setEditingPart('date');
      return;
    }

    const current = editTarget === 'start' ? startDate : endDate;
    const next = new Date(current);

    next.setFullYear(
      selected.getFullYear(),
      selected.getMonth(),
      selected.getDate()
    );

    next.setHours(
      selected.getHours(),
      selected.getMinutes(),
      0,
      0
    );

    if (editTarget === 'start') {
      setStartDate(next);
    } else {
      setEndDate(next);
    }

    if (isAndroid && editingPart === 'date') {
      setEditingPart('time');
    } else {
      setEditTarget(null);
      setEditingPart('date');
    }
  };

  /*
   * QUICK END TIME
   */
  const handleQuickEnd = (ms: number) => {
    setMessage(null);
    setEndDate(new Date(startDate.getTime() + ms));
  };

  /*
   * CREATE EVENT
   */
  const handleCreateEvent = async () => {
    const event = {
      eventId: eventId.trim().toUpperCase(),
      title: title.trim(),
      start: toLocalISO(startDate),
      end: toLocalISO(endDate),
    };

    if (!event.eventId || !event.title) {
      setMessage('Event title and code are required.');
      return;
    }

    if (endDate.getTime() <= startDate.getTime()) {
      setMessage('End time must be after start time.');
      return;
    }

    setMessage(null);

    const result = await createEvent(event);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage('Event saved successfully.');

    const createdEvent: CloudEvent = {
      id: event.eventId,
      event_code: event.eventId,
      title: event.title,
      start_time: event.start,
      end_time: event.end,
      created_by: user?.id ?? null,
      created_at: new Date().toISOString(),
    };

    setQrEvent(createdEvent);
    setPayload(buildQRPayload(event));

    setTitle('');
    setEventId('');

    await loadMyEvents();
  };

  /*
   * SHOW QR
   * Used by Recent Events.
   */
  const handleShowQR = (event: CloudEvent) => {
    const qrPayload = {
      eventId: event.event_code,
      title: event.title,
      start: event.start_time ?? '',
      end: event.end_time ?? '',
    };

    setQrEvent(event);
    setPayload(buildQRPayload(qrPayload));
    setMessage(null);
  };

  /*
   * CLOSE QR MODAL
   */
  const handleCloseQR = () => {
    setPayload(null);
    setQrEvent(null);
  };

  /*
   * LOADING
   */
  if (roleLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingTitle}>
          Checking your account...
        </Text>
      </View>
    );
  }

  /*
   * ROLE PROTECTION
   */
  if (role !== 'teacher' && role !== 'admin') {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={52}
          color={COLORS.primary}
        />

        <Text style={styles.lockTitle}>Staff Only</Text>

        <Text style={styles.lockSubtitle}>
          Only teacher and administrator accounts can create events.
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER — BACK BUTTON REMOVED */}
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="clipboard-outline"
              size={28}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.title}>Teacher Dashboard</Text>

            <Text style={styles.subtitle}>
              Create and manage your school events and attendance QR codes.
            </Text>
          </View>
        </View>

        {/* CREATE EVENT */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Create Event</Text>

          <Ionicons
            name="add-circle-outline"
            size={22}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.label}>Event Title</Text>

        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Founders Day Assembly"
          placeholderTextColor={COLORS.textSecondary}
        />

        <Text style={styles.label}>Event Code</Text>

        <TextInput
          style={styles.input}
          value={eventId}
          onChangeText={setEventId}
          placeholder="e.g. EVT-2026-0002"
          placeholderTextColor={COLORS.textSecondary}
          autoCapitalize="characters"
          autoCorrect={false}
          spellCheck={false}
        />

        <Text style={styles.label}>Starts</Text>

        <PickerField
          value={formatDateTime(startDate)}
          icon="sunny-outline"
          onPress={() => openPicker('start')}
        />

        <Text style={styles.label}>Ends</Text>

        <PickerField
          value={formatDateTime(endDate)}
          icon="moon-outline"
          onPress={() => openPicker('end')}
        />

        <View style={styles.chipRow}>
          {QUICK_END_OPTIONS.map((option) => (
            <Pressable
              key={option.label}
              style={styles.chip}
              onPress={() => handleQuickEnd(option.ms)}
            >
              <Text style={styles.chipText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.hint}>
          Tap a chip to set the end time from start.
        </Text>

        {message && (
          <Text style={styles.message}>{message}</Text>
        )}

        <View style={styles.createButton}>
          <AppButton
            theme="primary"
            title="Create Event"
            icon="add-circle-outline"
            onPress={handleCreateEvent}
          />
        </View>

        {/* DATE/TIME PICKER */}
        {editTarget && (
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={editTarget === 'start' ? startDate : endDate}
              mode={isAndroid ? editingPart : 'datetime'}
              display={isAndroid ? 'default' : 'spinner'}
              onChange={onPickerChange}
            />
          </View>
        )}

        {/* RECENT EVENTS */}
        <View style={styles.eventsHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recent Events</Text>

            <Text style={styles.sectionHint}>
              Your latest created events
            </Text>
          </View>

          <Pressable
            style={styles.viewAllButton}
            onPress={() => router.push('/teacher-events')}
          >
            <Text style={styles.viewAllText}>View All</Text>

            <Ionicons
              name="chevron-forward"
              size={17}
              color={COLORS.primary}
            />
          </Pressable>
        </View>

        {eventsLoading ? (
          <View style={styles.eventsState}>
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
            />

            <Text style={styles.stateText}>
              Loading events...
            </Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="calendar-outline"
              size={30}
              color={COLORS.primary}
            />

            <Text style={styles.emptyTitle}>No events yet</Text>

            <Text style={styles.emptyText}>
              Create your first school event using the form above.
            </Text>
          </View>
        ) : (
          <View style={styles.eventList}>
            {events.slice(0, 3).map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={22}
                    color={COLORS.primary}
                  />
                </View>

                <View style={styles.eventMain}>
                  <Text
                    style={styles.eventTitle}
                    numberOfLines={1}
                  >
                    {event.title}
                  </Text>

                  <Text style={styles.eventCode}>
                    {event.event_code}
                  </Text>

                  <Text style={styles.eventDate}>
                    {formatEventDate(event.start_time)}
                  </Text>
                </View>

                <Pressable
                  style={styles.qrButton}
                  onPress={() => handleShowQR(event)}
                >
                  <Ionicons
                    name="qr-code-outline"
                    size={19}
                    color={COLORS.primary}
                  />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* QR MODAL */}
      <Modal
        visible={!!payload}
        transparent
        animationType="fade"
        onRequestClose={handleCloseQR}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* CLOSE BUTTON */}
            <Pressable
              style={styles.modalCloseIcon}
              onPress={handleCloseQR}
            >
              <Ionicons
                name="close"
                size={24}
                color={COLORS.textPrimary}
              />
            </Pressable>

            {/* HEADER */}
            <View style={styles.modalHeader}>
              <View style={styles.modalQrIcon}>
                <Ionicons
                  name="qr-code-outline"
                  size={26}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>
                  Event QR Code
                </Text>

                <Text style={styles.modalSubtitle}>
                  Students can scan this QR using the Scan tab.
                </Text>
              </View>
            </View>

            {/* EVENT INFO */}
            {qrEvent && (
              <View style={styles.qrEventInfo}>
                <Text
                  style={styles.qrEventTitle}
                  numberOfLines={2}
                >
                  {qrEvent.title}
                </Text>

                <Text style={styles.qrEventCode}>
                  {qrEvent.event_code}
                </Text>
              </View>
            )}

            {/* QR CODE */}
            <View style={styles.qrBox}>
              {payload && (
                <QRCode
                  value={payload}
                  size={230}
                />
              )}
            </View>

            <Text style={styles.scanInstruction}>
              Scan this code to record attendance for this event.
            </Text>

            {/* CLOSE */}
            <Pressable
              style={styles.closeButton}
              onPress={handleCloseQR}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

type PickerFieldProps = {
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function PickerField({
  value,
  icon,
  onPress,
}: PickerFieldProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.pickerField,
        pressed && styles.pickerFieldPressed,
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={20}
        color={COLORS.primary}
      />

      <Text style={styles.pickerValue}>{value}</Text>

      <Ionicons
        name="calendar-outline"
        size={18}
        color={COLORS.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },

  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 12,
  },

  lockTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
  },

  lockSubtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 21,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  sectionHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },

  pickerField: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  pickerFieldPressed: {
    backgroundColor: COLORS.surface,
  },

  pickerValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginHorizontal: 10,
  },

  chipRow: {
    flexDirection: 'row',
    marginTop: 8,
  },

  chip: {
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },

  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },

  createButton: {
    marginTop: 16,
  },

  pickerContainer: {
    marginTop: 12,
    alignItems: 'center',
  },

  message: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 12,
  },

  eventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 12,
  },

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 8,
  },

  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 2,
  },

  eventsState: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 24,
    alignItems: 'center',
  },

  stateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
  },

  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
  },

  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 5,
  },

  eventList: {
    gap: 10,
  },

  eventCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  eventIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  eventMain: {
    flex: 1,
  },

  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  eventCode: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },

  eventDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 3,
  },

  qrButton: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  /* QR MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },

  modalCloseIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 38,
    marginBottom: 16,
  },

  modalQrIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  modalHeaderText: {
    flex: 1,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginTop: 3,
  },

  qrEventInfo: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 16,
  },

  qrEventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  qrEventCode: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 3,
  },

  qrBox: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
  },

  scanInstruction: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 14,
  },

  closeButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});