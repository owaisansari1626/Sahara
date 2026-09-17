/**
 * Sahara v2 — Comprehensive API Endpoints Service
 * Full implementation matching FastAPI backend specification:
 * - Layer 1: Sahara AI Companion Chat (/api/chat, /api/chat/history, /api/chat/reset)
 * - Layer 2: Real Human Peer Saathi Chat (/api/saathi/chat/{id}, /api/saathi/match, /api/saathi/switch)
 * - Layer 3: Saathi Developer Portal (/api/saathi/auth/login, /api/saathi/inbox/chats, /api/saathi/inbox/chat/{id}/reply)
 * - Wellness & Telemetry: Check-ins, Coping Tools, Crisis Helplines, Appointments, Admin Analytics
 */

import { apiFetch, API_BASE_URL } from './client';
import {
  TriageSeverity,
  SaathiDualAssignment,
  AppointmentRecord,
  AggregateAnalytics,
  SaathiAdminRosterItem,
  CheckInRecord,
  CopingTool,
  CrisisHelpline,
  Counsellor,
  SaathiMessage,
  PeerRedirectInfo,
  DevSaathiProfile,
  DevInboxChatThread,
} from '../types';

export interface ChatRequestPayload {
  session_id: string;
  userMessage: string;
  currentSeverity?: TriageSeverity | null;
  messages?: { role: string; parts: Record<string, string>[] }[];
}

export interface ChatResponsePayload {
  session_id: string;
  reply: string;
  suggestedSeverity: TriageSeverity;
  inferredTags?: string[];
  source: string;
  peerRedirect?: PeerRedirectInfo | null;
}

export interface SaathiSwitchResponsePayload {
  session_id: string;
  active_chat_id: string;
  active_role: 'PRIMARY' | 'SECONDARY';
  active_saathi_alias: string;
  message: string;
}

export interface SaathiTransitionResponsePayload {
  saathi_chat_id: string;
  status: 'TRANSITIONING';
  transition_notice_date: string;
  consented_history_transfer: boolean;
  new_chat_id?: string;
  new_saathi_alias?: string;
  message?: string;
}

export interface SaathiReassignResponsePayload {
  saathi_chat_id: string;
  reassigned: boolean;
  new_chat_id: string;
  new_saathi_alias: string;
  message?: string;
}

export interface AppointmentBookingPayload {
  counsellor_id: string;
  counsellor_name: string;
  student_name: string;
  student_email?: string;
  modality: 'Video' | 'Voice' | 'Text' | string;
  selected_slot: string;
  notes?: string;
}

/* =========================================================================
   LAYER 1: SAHARA AI COMPANION BOT
   ========================================================================= */

/**
 * Sends student message to Sahara companion bot with silent triage & peer redirection
 */
export async function postChatMessage(payload: ChatRequestPayload): Promise<ChatResponsePayload> {
  return apiFetch<ChatResponsePayload>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetches companion chat message history for the given session UUID
 */
export async function fetchChatHistory(sessionId: string): Promise<any> {
  return apiFetch<any>(`/api/chat/history?sessionId=${encodeURIComponent(sessionId)}`, {
    method: 'GET',
  });
}

/**
 * Resets companion chat message history on backend
 */
export async function resetChatHistory(sessionId: string): Promise<any> {
  return apiFetch<any>(`/api/chat/reset?sessionId=${encodeURIComponent(sessionId)}`, {
    method: 'POST',
  });
}

/* =========================================================================
   LAYER 2: PEER (SAATHI) SYSTEM
   ========================================================================= */

/**
 * Intelligent Dual-Saathi matching (Primary + Secondary) with zero student browsing
 */
export async function matchSaathis(session_id: string): Promise<SaathiDualAssignment> {
  return apiFetch<SaathiDualAssignment>('/api/saathi/match', {
    method: 'POST',
    body: JSON.stringify({ session_id }),
  });
}

/**
 * Instant no-guilt focus switch between Primary and Secondary peer supporter
 */
export async function switchSaathiFocus(
  session_id: string,
  target_role: 'PRIMARY' | 'SECONDARY'
): Promise<SaathiSwitchResponsePayload> {
  return apiFetch<SaathiSwitchResponsePayload>('/api/saathi/switch', {
    method: 'POST',
    body: JSON.stringify({ session_id, target_role }),
  });
}

/**
 * Saathi transition with 2-week notice period & optional history transfer
 */
export async function requestSaathiTransition(
  saathi_chat_id: string,
  notice_weeks = 2,
  consented_history_transfer = true
): Promise<SaathiTransitionResponsePayload> {
  return apiFetch<SaathiTransitionResponsePayload>('/api/saathi/transition', {
    method: 'POST',
    body: JSON.stringify({
      saathi_chat_id,
      notice_weeks,
      consented_history_transfer,
    }),
  });
}

/**
 * Saathi silent escape hatch when targeting/recognition is suspected
 */
export async function requestSaathiReassignment(
  saathi_chat_id: string
): Promise<SaathiReassignResponsePayload> {
  return apiFetch<SaathiReassignResponsePayload>('/api/saathi/reassign-request', {
    method: 'POST',
    body: JSON.stringify({ saathi_chat_id, reason_flag: 'RECOGNITION_RISK' }),
  });
}

/**
 * Fetches message history for a specific Saathi peer chat thread
 */
export async function fetchSaathiChatMessages(chat_id: string): Promise<SaathiMessage[]> {
  try {
    const data = await apiFetch<any>(`/api/saathi/chat/${encodeURIComponent(chat_id)}`, {
      method: 'GET',
    });
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.messages)) return data.messages;
    return [];
  } catch (err) {
    console.warn(`Error fetching Saathi messages for ${chat_id}:`, err);
    return [];
  }
}

/**
 * Student or Saathi sends a message into the peer conversation thread
 */
export async function sendSaathiChatMessage(
  chat_id: string,
  sender: 'student' | 'saathi',
  text: string
): Promise<any> {
  return apiFetch<any>(`/api/saathi/chat/${encodeURIComponent(chat_id)}/message`, {
    method: 'POST',
    body: JSON.stringify({
      saathi_chat_id: chat_id,
      sender,
      text,
    }),
  });
}

/* =========================================================================
   LAYER 3: SAATHI DEVELOPER PORTAL & INBOX (/dev-inbox)
   ========================================================================= */

const DEV_SAATHI_ACCOUNTS: Record<string, DevSaathiProfile> = {
  zakwan: {
    id: 'saathi-zakwan',
    username: 'zakwan',
    name: 'Zakwan',
    alias: 'Zak_TechAnchor_23',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    vibeTags: [
      { icon: '💻', label: 'Engineering & coding stress', tag_key: 'academic_stress' },
      { icon: '📚', label: 'Exam sprint & panic', tag_key: 'exam_period' },
      { icon: '🌙', label: 'Late-night listener', tag_key: 'night_owl' },
    ],
    activeStatus: 'ONLINE',
  },
  saifullah: {
    id: 'saathi-saifullah',
    username: 'saifullah',
    name: 'Saifullah',
    alias: 'Saif_Pacer_22',
    department: 'Commerce & Economics',
    year: '2nd Year',
    vibeTags: [
      { icon: '🏏', label: 'Athletics & balance', tag_key: 'academic_stress' },
      { icon: '⚡', label: 'Overwhelmed with deadlines', tag_key: 'exam_period' },
      { icon: '🎧', label: 'Non-judgmental venting', tag_key: 'isolation' },
    ],
    activeStatus: 'ONLINE',
  },
  riyaz: {
    id: 'saathi-riyaz',
    username: 'riyaz',
    name: 'Riyaz',
    alias: 'Riyaz_QuietAnchor_22',
    department: 'Design & Visual Arts',
    year: '4th Year',
    vibeTags: [
      { icon: '🎨', label: 'Creative burnout', tag_key: 'isolation' },
      { icon: '🪴', label: 'Quiet presence', tag_key: 'family_stress' },
      { icon: '📖', label: 'Homesickness & transition', tag_key: 'isolation' },
    ],
    activeStatus: 'ONLINE',
  },
  samiiksha: {
    id: 'saathi-samiiksha',
    username: 'samiiksha',
    name: 'Samiiksha',
    alias: 'Sam_CalmListen_23',
    department: 'Biotechnology & Health Sciences',
    year: '3rd Year',
    vibeTags: [
      { icon: '🌿', label: 'Sleep & circadian reset', tag_key: 'sleep_issues' },
      { icon: '☕', label: 'Chai conversations', tag_key: 'academic_stress' },
      { icon: '🫂', label: 'Family pressure anchor', tag_key: 'family_stress' },
    ],
    activeStatus: 'ONLINE',
  },
};

/**
 * Developer Saathi Login (/api/saathi/auth/login)
 */
export async function saathiDevLogin(username: string, password?: string): Promise<{ token: string; profile: DevSaathiProfile }> {
  try {
    const res = await apiFetch<any>('/api/saathi/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password: password || 'sahara2026' }),
    });
    const token = res.token || res.access_token || `dev-token-${username}`;
    const profile = res.profile || DEV_SAATHI_ACCOUNTS[username.toLowerCase()] || DEV_SAATHI_ACCOUNTS.zakwan;
    return { token, profile };
  } catch (err) {
    // Graceful offline dev account fallback for founding 4 devs
    const normUser = username.toLowerCase().trim();
    const profile = DEV_SAATHI_ACCOUNTS[normUser] || {
      id: `saathi-${normUser}`,
      username: normUser,
      name: username.charAt(0).toUpperCase() + username.slice(1),
      alias: `${username.charAt(0).toUpperCase() + username.slice(1)}_Anchor_23`,
      department: 'Campus Peer Supporter',
      year: '3rd Year',
      vibeTags: [{ icon: '🌿', label: 'Trained Peer Supporter' }],
      activeStatus: 'ONLINE',
    };
    return { token: `dev-token-${normUser}`, profile };
  }
}

/**
 * Fetches student threads for Saathi Inbox (/api/saathi/inbox/chats)
 */
export async function fetchSaathiInboxChats(
  token?: string, 
  scope: 'my' | 'all' = 'all'
): Promise<DevInboxChatThread[]> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const data = await apiFetch<any>(`/api/saathi/inbox/chats?scope=${scope}`, {
      method: 'GET',
      headers,
    });
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        chat_id: item.chat_id,
        session_id: item.session_id,
        matched_tags: item.matched_tags || [],
        last_message: item.last_message_text || item.last_message || 'New student connected',
        last_message_sender: item.last_message_sender || 'student',
        last_activity: item.last_message_timestamp || item.last_activity || 'Just now',
        unread_count: item.unread_count || 0,
        status: item.status || 'ACTIVE',
        student_alias: item.student_alias || 'Student',
        role: item.role || 'PRIMARY',
        assigned_saathi_alias: item.assigned_saathi_alias,
        assigned_saathi_name: item.assigned_saathi_name,
      }));
    }
    return [];
  } catch (err) {
    console.warn('Error fetching inbox threads:', err);
    return [];
  }
}

/**
 * Developer sends a human reply to an assigned student thread
 */
export async function sendSaathiInboxReply(
  chat_id: string,
  text: string,
  token?: string
): Promise<any> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return await apiFetch<any>(`/api/saathi/inbox/chat/${encodeURIComponent(chat_id)}/reply`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    // Fallback: send message directly via peer chat endpoint
    return await sendSaathiChatMessage(chat_id, 'saathi', text);
  }
}

/* =========================================================================
   DAILY CHECK-INS, COPING TOOLS & CRISIS HELPLINES
   ========================================================================= */

/**
 * Submit daily mood check-in (/api/checkins)
 */
export async function postCheckin(payload: {
  session_id: string;
  mood: string;
  energy?: number;
  stressor?: string;
  note?: string;
}): Promise<CheckInRecord> {
  return apiFetch<CheckInRecord>('/api/checkins', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch daily check-ins history for current session (/api/checkins?sessionId=...)
 */
export async function fetchCheckins(sessionId: string): Promise<CheckInRecord[]> {
  try {
    const data = await apiFetch<any>(`/api/checkins?sessionId=${encodeURIComponent(sessionId)}`, {
      method: 'GET',
    });
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}

/**
 * Fetch mental grounding exercises (/api/coping-tools)
 */
export async function fetchCopingTools(): Promise<CopingTool[]> {
  try {
    const data = await apiFetch<any>('/api/coping-tools', { method: 'GET' });
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}

/**
 * Fetch verified crisis helplines (/api/crisis-helplines)
 */
export async function fetchCrisisHelplines(): Promise<CrisisHelpline[]> {
  try {
    const data = await apiFetch<any>('/api/crisis-helplines', { method: 'GET' });
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}

/* =========================================================================
   CLINICAL APPOINTMENTS & ADMIN TELEMETRY
   ========================================================================= */

/**
 * Fetch verified clinical psychologists roster
 */
export async function fetchCounsellors(): Promise<Counsellor[]> {
  try {
    const data = await apiFetch<any>('/api/counsellors', { method: 'GET' });
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}

/**
 * Decoupled Clinical Psychologist Booking (Stored isolated with zero session_id)
 */
export async function bookAppointment(payload: AppointmentBookingPayload): Promise<AppointmentRecord> {
  return apiFetch<AppointmentRecord>('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Admin Analytics & Telemetry (Key-gated via X-Admin-Key)
 */
export async function fetchAdminAnalytics(adminKey: string): Promise<AggregateAnalytics> {
  try {
    return await apiFetch<AggregateAnalytics>('/api/analytics', {
      method: 'GET',
      adminKey,
    });
  } catch (e) {
    return await apiFetch<AggregateAnalytics>('/api/admin/analytics', {
      method: 'GET',
      adminKey,
    });
  }
}

/**
 * Admin Saathi Roster (Key-gated via X-Admin-Key)
 */
export async function fetchAdminSaathis(adminKey: string): Promise<SaathiAdminRosterItem[]> {
  try {
    return await apiFetch<SaathiAdminRosterItem[]>('/api/saathis', {
      method: 'GET',
      adminKey,
    });
  } catch (e) {
    return await apiFetch<SaathiAdminRosterItem[]>('/api/admin/saathis', {
      method: 'GET',
      adminKey,
    });
  }
}
