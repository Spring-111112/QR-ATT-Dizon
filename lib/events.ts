import { supabase } from './supabase';

export type Event = {
  eventId: string;
  title: string;
  start: string;
  end: string;
};

export type CloudEvent = {
  id: string;
  event_code: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  created_by: string | null;
  created_at: string;
};

/**
 * Create or update an event using its event code.
 */
export async function createEvent(
  event: Event
): Promise<{ error: string | null }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error('[createEvent] Auth error:', userError.message);
    return { error: userError.message };
  }

  const { error } = await supabase.from('events').upsert(
    {
      event_code: event.eventId,
      title: event.title,
      start_time: event.start || null,
      end_time: event.end || null,
      created_by: user?.id ?? null,
    },
    {
      onConflict: 'event_code',
    }
  );

  if (error) {
    console.error('[createEvent] Supabase error:', error.message);
  }

  return { error: error?.message ?? null };
}

/**
 * Get events created by a specific teacher.
 */
export async function getEventsByTeacher(
  teacherId: string
): Promise<CloudEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getEventsByTeacher] Supabase error:', error.message);
    return [];
  }

  return (data ?? []) as CloudEvent[];
}

/**
 * Get one event using its event code.
 * Throws an error when Supabase returns a query error.
 */
export async function getEventByCode(
  code: string
): Promise<CloudEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_code', code)
    .maybeSingle();

  if (error) {
    console.error('[getEventByCode] Supabase error:', error.message);
    throw new Error(error.message);
  }

  return data as CloudEvent | null;
}

/**
 * Get all events.
 */
export async function getAllEvents(): Promise<CloudEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getAllEvents] Supabase error:', error.message);
    return [];
  }

  return (data ?? []) as CloudEvent[];
}

/**
 * Update an existing event using its database ID.
 */
export async function updateEvent(
  eventId: string,
  updates: {
    event_code?: string;
    title?: string;
    start_time?: string | null;
    end_time?: string | null;
  }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId);

  if (error) {
    console.error('[updateEvent] Supabase error:', error.message);
  }

  return { error: error?.message ?? null };
}

/**
 * Delete an event using its database ID.
 */
export async function deleteEvent(
  eventId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) {
    console.error('[deleteEvent] Supabase error:', error.message);
  }

  return { error: error?.message ?? null };
}
