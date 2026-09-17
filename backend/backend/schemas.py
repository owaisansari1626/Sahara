from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

# Session Schemas
class SessionInitResponse(BaseModel):
    session_id: str
    created_at: str

# Chat Schemas (Sahara AI Companion)
# Peer Supporter & Vibe Tag Schemas
class VibeTag(BaseModel):
    icon: str
    label: str
    tag_key: Optional[str] = None

class ColorScheme(BaseModel):
    bg: str
    border: str
    badgeBg: str
    text: str

class SaathiAssignment(BaseModel):
    chat_id: str
    saathi_id: str
    alias: str
    role: str  # PRIMARY | SECONDARY
    status: str  # ACTIVE | TRANSITIONING | CLOSED
    intro_message: str
    vibeTags: List[VibeTag]
    avatarSeed: str
    colorScheme: ColorScheme

class PeerRedirectInfo(BaseModel):
    shouldRedirect: bool = True
    matchedDomain: Optional[str] = None
    domainLabel: Optional[str] = None
    matchReason: Optional[str] = None
    action: str = "OFFER"  # OFFER | REDIRECT
    matchedSaathi: Optional[SaathiAssignment] = None
    secondarySaathi: Optional[SaathiAssignment] = None
    handoffText: Optional[str] = None

class PeerRedirectRequest(BaseModel):
    session_id: str
    preferred_tag: Optional[str] = None

# Chat Schemas (Sahara AI Companion)
class ChatMessageHistory(BaseModel):
    role: str
    parts: List[Dict[str, str]]

class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    userMessage: str
    currentSeverity: Optional[str] = "MODERATE"
    messages: Optional[List[ChatMessageHistory]] = None

class ChatResponse(BaseModel):
    session_id: str
    reply: str
    suggestedSeverity: str  # MILD | MODERATE | SEVERE
    inferredTags: List[str] = []
    source: str  # 'langchain-gemini' | 'rule-fallback'
    peerRedirect: Optional[PeerRedirectInfo] = None

# Check-in Schemas
class CheckInCreate(BaseModel):
    session_id: Optional[str] = None
    mood: str
    energy: int = 3
    stressor: Optional[str] = ""
    note: Optional[str] = ""

class CheckInResponse(BaseModel):
    id: str
    session_id: str
    mood: str
    energy: int
    stressor: str
    note: str
    timestamp: str

# Saathi Peer Schemas Continued
class SaathiProfileSchema(BaseModel):
    id: str
    alias: str  # Strictly student-facing alias, never real name
    year: str
    field: str
    collegeType: str
    vibeTags: List[VibeTag]
    bio: str
    availability: str
    languages: List[str]
    badges: List[str]
    avatarSeed: str
    colorScheme: ColorScheme

class SaathiAdminProfileSchema(SaathiProfileSchema):
    name: str  # Real name, strictly admin access only
    maxCapacity: int
    currentLoad: int

class SaathiMatchRequest(BaseModel):
    session_id: Optional[str] = None

class SaathiMatchResponse(BaseModel):
    session_id: str
    primary: SaathiAssignment
    secondary: SaathiAssignment

class SaathiSwitchRequest(BaseModel):
    session_id: str
    target_role: str  # PRIMARY | SECONDARY

class SaathiSwitchResponse(BaseModel):
    session_id: str
    active_chat_id: str
    active_role: str
    active_saathi_alias: str
    message: str

class SaathiTransitionRequest(BaseModel):
    saathi_chat_id: str
    notice_weeks: Optional[int] = 2
    consented_history_transfer: Optional[bool] = False

class SaathiTransitionResponse(BaseModel):
    saathi_chat_id: str
    status: str
    transition_notice_date: str
    consented_history_transfer: bool
    new_chat_id: Optional[str] = None
    new_saathi_alias: Optional[str] = None
    message: str

class SaathiReassignRequest(BaseModel):
    saathi_chat_id: str
    reason_flag: Optional[str] = "RECOGNITION_RISK"

class SaathiReassignResponse(BaseModel):
    saathi_chat_id: str
    reassigned: bool
    new_chat_id: str
    new_saathi_alias: str
    message: str

class SaathiChatStartRequest(BaseModel):
    session_id: Optional[str] = None
    saathi_id: str
    student_alias: Optional[str] = "Student"

class SaathiMessageCreate(BaseModel):
    saathi_chat_id: str
    sender: str  # 'student' | 'saathi'
    text: str

class SaathiMessageResponse(BaseModel):
    id: str
    saathi_chat_id: str
    sender: str
    text: str
    timestamp: str

# Saathi Developer Auth & Inbox Schemas
class SaathiLoginRequest(BaseModel):
    username: str
    password: str

class SaathiLoginResponse(BaseModel):
    token: str
    saathi_id: str
    name: str
    alias: str
    avatarSeed: str
    vibeTags: List[VibeTag]
    colorScheme: ColorScheme

class SaathiMeResponse(BaseModel):
    saathi_id: str
    name: str
    alias: str
    year: str
    field: str
    avatarSeed: str
    vibeTags: List[VibeTag]
    colorScheme: ColorScheme
    currentLoad: int
    maxCapacity: int

class DevSaathiChatSummary(BaseModel):
    chat_id: str
    session_id: str
    student_alias: str
    role: str
    status: str
    assigned_saathi_alias: Optional[str] = None
    assigned_saathi_name: Optional[str] = None
    matched_tags: List[str] = []
    last_message_text: Optional[str] = None
    last_message_sender: Optional[str] = None
    last_message_timestamp: Optional[str] = None
    total_messages: int = 0

class DevSaathiReplyRequest(BaseModel):
    text: str

# Counsellor Schemas
class CounsellorSchema(BaseModel):
    id: str
    name: str
    credentials: str
    title: str
    specializations: List[str]
    experience: str
    languages: List[str]
    fee: str
    modalities: List[str]
    nextSlot: str
    verified: bool
    avatarSeed: str

class AppointmentCreate(BaseModel):
    # Session ID is omitted to maintain complete isolation between clinical appointments & anonymous chat history
    counsellor_id: str
    counsellor_name: str
    student_name: str
    student_email: Optional[str] = ""
    modality: str
    selected_slot: str
    notes: Optional[str] = ""

class AppointmentResponse(BaseModel):
    id: str
    counsellor_id: str
    counsellor_name: str
    student_name: str
    modality: str
    selected_slot: str
    status: str
    created_at: str

# Resource Schemas
class CopingToolSchema(BaseModel):
    id: str
    title: str
    duration: str
    tag: str
    description: str
    category: str

class CrisisHelplineSchema(BaseModel):
    id: str
    name: str
    number: str
    description: str
    type: str

# Analytics Schemas
class CategoryBreakdown(BaseModel):
    category: str
    percentage: int
    color: str

class MonthlyTrend(BaseModel):
    month: str
    chats: int
    peerConnections: int
    professional: int

class CampusAnalyticsSchema(BaseModel):
    totalStudentsCovered: str
    pilotCampuses: str
    botReturnRate: str
    avgTimeToTouchpoint: str
    maleHelpSeekingRate: str
    saathiSessionsCompleted: int
    professionalEscalations: int
    crisisInterceptsHandled: int
    studentTrustScore: str
    breakdownByCategory: List[CategoryBreakdown]
    monthlyTrend: List[MonthlyTrend]
