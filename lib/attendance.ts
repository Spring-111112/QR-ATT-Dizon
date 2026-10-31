import { supabase } from './supabase';
import { parseQRPayload } from './qr';
import { getEventByCode } from './events';

export type TeacherEventAttendance = {
  eventId: string;
  eventCode: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  attendeeCount: number;
  attendees: {
    studentId: string;
    studentName: string | null;
    scannedAt: string;
  }[];
};

export async function getTeacherEventAttendance(
  teacherId: string
): Promise<TeacherEventAttendance[]> {
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, event_code, title, start_time, end_time')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  if (eventError) {
    console.error('[getTeacherEventAttendance] Event error:', eventError.message);
    return [];
  }

  if (!events || events.length === 0) {
    return [];
  }

  const eventIds = events.map((event) => event.id);

  const { data: attendance, error: attError } = await supabase
    .from('attendance')
    .select(`
      student_id,
      scanned_at,
      event_id,
      profiles!attendance_student_id_fkey (
        full_name,
        email
      )
    `)
    .in('event_id', eventIds)
    .order('scanned_at', { ascending: false });

  if (attError) {
    console.error(
      '[getTeacherEventAttendance] Attendance error:',
      attError.message
    );
    return [];
  }

  if (!attendance) {
    return [];
  }

  return events.map((event) => {
    const rows = attendance.filter(
      (row) => row.event_id === event.id
    );

    return {
      eventId: event.id,
      eventCode: event.event_code,
      title: event.title,
      startTime: event.start_time,
      endTime: event.end_time,
      attendeeCount: rows.length,
      attendees: rows.map((row: any) => ({
        studentId: row.student_id,
        studentName: row.profiles?.full_name ?? null,
        scannedAt: row.scanned_at,
      })),
    };
  });
}

export async function getTeacherEventSummary(
  teacherId: string
): Promise<
  {
    eventId: string;
    eventCode: string;
    title: string;
    attendeeCount: number;
  }[]
> {
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, event_code, title')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  if (eventError) {
    console.error('[getTeacherEventSummary] Event error:', eventError.message);
    return [];
  }

  if (!events || events.length === 0) {
    return [];
  }

  const eventIds = events.map((event) => event.id);

  const { data: attRows, error: attError } = await supabase
    .from('attendance')
    .select('event_id')
    .in('event_id', eventIds);

  if (attError) {
    console.error(
      '[getTeacherEventSummary] Attendance error:',
      attError.message
    );
    return [];
  }

  const counts: Record<string, number> = {};

  (attRows ?? []).forEach((row) => {
    counts[row.event_id] = (counts[row.event_id] ?? 0) + 1;
  });

  return events.map((event) => ({
    eventId: event.id,
    eventCode: event.event_code,
    title: event.title,
    attendeeCount: counts[event.id] ?? 0,
  }));
}

export type AttendanceRecord = {
  id: string;
  eventId: string;
  eventTitle: string;
  scannedAt: string;
};

export type RegisterResult = {
  success: boolean;
  message: string;
  eventTitle?: string;
};

export async function registerAttendance(
  rawPayload: string,
  studentId: string
): Promise<RegisterResult> {
  try {
    const parsed = parseQRPayload(rawPayload);

    if (!parsed.ok) {
      return {
        success: false,
        message: parsed.message,
      };
    }

    const payload = parsed.payload;
    const now = Date.now();

    const start = payload.start
      ? new Date(payload.start).getTime()
      : null;

    const end = payload.end
      ? new Date(payload.end).getTime()
      : null;

    if (start !== null && !Number.isFinite(start)) {
      return {
        success: false,
        message: 'Invalid event start time.',
      };
    }

    if (end !== null && !Number.isFinite(end)) {
      return {
        success: false,
        message: 'Invalid event end time.',
      };
    }

    if (start !== null && now < start) {
      return {
        success: false,
        message: 'Event has not started yet.',
      };
    }

    if (end !== null && now > end) {
      return {
        success: false,
        message: 'Event has already ended.',
      };
    }

    // Only use an event that already exists.
    // Teachers should create events before students scan.
    const event = await getEventByCode(payload.event);

    if (!event) {
      return {
        success: false,
        message: 'Event not found. Please ask your teacher to check the QR code.',
      };
    }

    // Check if the student has already registered.
    const { data: existingAttendance, error: checkError } =
      await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', studentId)
        .eq('event_id', event.id)
        .maybeSingle();

    if (checkError) {
      console.error(
        '[registerAttendance] Check error:',
        checkError.message
      );

      return {
        success: false,
        message: checkError.message,
        eventTitle: event.title,
      };
    }

    if (existingAttendance) {
      return {
        success: false,
        message: 'Already registered for this event.',
        eventTitle: event.title,
      };
    }

    const { error: attError } = await supabase
      .from('attendance')
      .insert([
        {
          student_id: studentId,
          event_id: event.id,
        },
      ]);

    if (attError) {
      console.error(
        '[registerAttendance] Insert error:',
        attError.message,
        attError.code
      );

      if (attError.code === '23505') {
        return {
          success: false,
          message: 'Already registered for this event.',
          eventTitle: event.title,
        };
      }

      return {
        success: false,
        message: attError.message,
        eventTitle: event.title,
      };
    }

    return {
      success: true,
      message: 'Attendance recorded!',
      eventTitle: event.title,
    };
  } catch (error) {
    console.error('[registerAttendance] Unexpected error:', error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Unable to record attendance. Please try again.',
    };
  }
}

export async function getAttendanceHistory(
  studentId: string
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, scanned_at, events ( event_code, title )')
    .eq('student_id', studentId)
    .order('scanned_at', { ascending: false });

  if (error) {
    console.error('[getAttendanceHistory] Error:', error.message);
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    eventId: row.events?.event_code ?? '',
    eventTitle: row.events?.title ?? '',
    scannedAt: row.scanned_at,
  }));
}