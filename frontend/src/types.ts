/**
 * Sahara v2 — TypeScript Domain Model & API Schema
 * Aligned with FastAPI + SQLite backend architecture contract & Live Endpoints
 */

export type Screen = 
  | 'landing'
  | 'checkin'
  | 'chat'
  | 'saathi_match'
  | 'saathi_chat'
  | 'dev_inbox'
  | 'appointments'
  | 'privacy'
  | 'dashboard'
  | 'admin';

export type TriageSeverity = 'MILD' | 'MODERATE' | 'SEVERE';

export type ControlledInferredTag =
  | 'ACADEMIC_STRESS'
  | 'EXAM_PERIOD'
  | 'SLEEP_ISSUES'
  | 'NIGHT_OWL'
  | 'FAMILY_STRESS'
  | 'RELATIONSHIP_STRESS'
  | 'ISOLATION';

export interface VibeTag {
  icon?: string;
  label: string;
  tag_key?: string;
}

export interface ColorScheme {
  bg: string;
  border: string;
  badgeBg?: string;
  text: string;
}

export interface SaathiPeerAssignment {
  chat_id: string;
  saathi_id: string;
  alias: string;
  role: 'PRIMARY' | 'SECONDARY' | string;
  status: 'ACTIVE' | 'TRANSITIONING' | 'REASSIGNED' | string;
  intro_message: string;
  vibeTags?: VibeTag[];
  avatarSeed?: string;
  colorScheme?: ColorScheme;
  transition_notice_date?: string;
}

export interface PeerRedirectInfo {
  shouldRedirect: boolean;
  matchedDomain?: string;
  domainLabel?: string;
  matchReason?: string;
  action?: 'OFFER' | 'DIRECT' | string;
  matchedSaathi?: SaathiPeerAssignment;
  secondarySaathi?: SaathiPeerAssignment;
  handoffText?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'student' | 'sahara' | 'system';
  text: string;
  timestamp: string;
  severity?: TriageSeverity;
  inferredTags?: string[];
  source?: string;
  peerRedirect?: PeerRedirectInfo | null;
}

export interface SaathiDualAssignment {
  session_id: string;
  primary: SaathiPeerAssignment;
  secondary: SaathiPeerAssignment;
}

export interface SaathiMessage {
  id: string;
  saathi_chat_id: string;
  sender: 'student' | 'saathi' | 'system';
  text: string;
  timestamp: string;
}

export interface CheckInRecord {
  id: string;
  session_id: string;
  mood: string;
  energy: number;
  stressor?: string;
  note?: string;
  timestamp: string;
}

export interface CopingTool {
  id: string;
  title: string;
  category: string;
  duration: string;
  tag: string;
  description: string;
  instructions?: string[];
}

export interface CrisisHelpline {
  name: string;
  number: string;
  description: string;
  type: string;
  languages?: string;
  phone_link?: string;
}

export interface Counsellor {
  id: string;
  name: string;
  credentials: string;
  title: string;
  specializations: string[];
  experience: string;
  languages: string[];
  fee: string;
  modalities: ('Video' | 'Voice' | 'Text')[];
  nextSlot: string;
  verified: boolean;
  avatarSeed: string;
}

export interface AppointmentRecord {
  id: string;
  counsellor_id: string;
  counsellor_name?: string;
  student_name: string;
  student_email?: string;
  modality: 'Video' | 'Voice' | 'Text' | string;
  selected_slot: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | string;
  created_at: string;
}

export interface SaathiAdminRosterItem {
  id: string;
  name: string; // Restricted to admin only (with X-Admin-Key)
  alias: string; // Public student-facing alias
  department?: string;
  year?: string;
  max_capacity?: number;
  maxCapacity?: number;
  current_load?: number;
  currentLoad?: number;
  status: 'ACTIVE' | 'ON_NOTICE' | 'UNAVAILABLE' | string;
  vibeTags?: VibeTag[];
  bio?: string;
}

export interface AggregateAnalytics {
  totalStudentsCovered: string | number;
  activeSessionsCount: number;
  botReturnRate: string;
  avgTimeToTouchpoint: string;
  maleHelpSeekingRate: string;
  saathiSessionsCompleted: number;
  professionalEscalations: number;
  crisisInterceptsHandled: number;
  studentTrustScore: string;
  breakdownByCategory: {
    category: string;
    percentage: number;
    count?: number;
    color: string;
  }[];
  tagFrequencies: {
    tag: string;
    count: number;
    label: string;
  }[];
  monthlyTrend: {
    month: string;
    chats: number;
    peerConnections: number;
    professional: number;
  }[];
  saathisRoster?: SaathiAdminRosterItem[];
}

export interface DevSaathiProfile {
  id: string;
  username: string;
  name: string;
  alias: string;
  department: string;
  year: string;
  vibeTags: VibeTag[];
  activeStatus: 'ONLINE' | 'AWAY' | 'BUSY';
}

export interface DevInboxChatThread {
  chat_id: string;
  session_id: string;
  matched_tags: string[];
  last_message: string;
  last_message_sender: 'student' | 'saathi' | 'system';
  last_activity: string;
  unread_count: number;
  status: 'ACTIVE' | 'TRANSITIONING' | 'RESOLVED';
  student_alias?: string;
  role?: string;
  assigned_saathi_alias?: string;
  assigned_saathi_name?: string;
}
