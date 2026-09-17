# Sahara v2 — Architecture & Frontend Integration Guide

> **Version:** 2.0.0 (Privacy-Hardened)  
> **Backend Stack:** FastAPI (Python 3.10+), SQLite, Google GenAI / Gemini, Pydantic v2  
> **Default Host:** `http://127.0.0.1:8000` (or configured via `.env`)  
> **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`

---

## 1. Architectural Foundations & Privacy Rules

The Sahara v2 backend is engineered to ensure **complete student anonymity and zero data correlation leaks**. The frontend client must adhere to the following architecture principles:

### A. Client Session UUID (No Shared Anonymous State)
* **Never use a hardcoded `"anon-session"` fallback.**
* On first app load, the frontend must check `localStorage.getItem("sahara_session_id")`.
* If absent, either generate a standard UUID v4 client-side (`crypto.randomUUID()`) or send `session_id: null` in the first `/api/chat` request and persist the `session_id` returned by the backend.
* Every subsequent request (`chat`, `checkins`, `saathi/match`, `saathi/switch`) must supply this `session_id`.

### B. Closed-Vocabulary Silent Tag Inference
* The AI companion automatically infers student distress tags during chat interactions.
* Tags are chosen strictly from a fixed 7-item vocabulary:
  `academic_stress`, `family_stress`, `relationship_stress`, `sleep_issues`, `isolation`, `night_owl`, `exam_period`.
* Tags are stored internally on the session and used for intelligent Saathi peer matching. They are **never** displayed raw to peer supporters.

### C. Saathi Alias Protection & Dual-Saathi Model
* Public directory browsing (`GET /api/saathis`) is **deprecated/disabled** for students.
* Peer pairing is initiated via server-side match: `POST /api/saathi/match`.
* The server automatically pairs the student with **two Saathis** (`PRIMARY` and `SECONDARY`).
* Student-facing responses only contain the Saathi's public **alias** (e.g. `NightOwl_Eng_23`, `Pacer_Comm_22`), **never real names**.
* Students can toggle between Primary and Secondary peer conversations at any time with **zero guilt** (`POST /api/saathi/switch`).

### D. Isolated Clinical Booking
* Booking a session with a licensed psychologist (`POST /api/appointments`) requires real student name and email.
* This data is stored in a completely decoupled appointments table that has **no foreign keys or joins** to chat messages or session UUIDs.

---

## 2. API Endpoints Specification

### 2.1 Health Check

```http
GET /api/health
```

#### Response (200 OK)
```json
{
  "status": "ok",
  "app": "Sahara Mental Health API",
  "version": "1.0.0",
  "model_layer": "LangChain + Gemini 2.0 Flash"
}
```

---

### 2.2 AI Companion Chat & Distress Triage

#### `POST /api/chat`
Sends a message to the empathetic Sahara companion and runs distress triage.

```http
POST /api/chat
Content-Type: application/json
```

#### Request Body
```json
{
  "session_id": "sess-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "userMessage": "Exams are starting next week and I'm feeling really stressed. I can't sleep.",
  "currentSeverity": "MODERATE",
  "messages": []
}
```

#### Response (200 OK)
```json
{
  "session_id": "sess-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "reply": "Exam pressure can create a vicious cycle where the more you worry, the harder it is to start. Take a slow breath — you don't need to master everything in one hour. Would you like to unpack the biggest blocker, or try a quick 3-minute mental reset?",
  "suggestedSeverity": "MILD",
  "inferredTags": [
    "academic_stress",
    "exam_period",
    "sleep_issues"
  ],
  "source": "langchain-gemini",
  "peerRedirect": {
    "shouldRedirect": true,
    "matchedDomain": "exam_period",
    "domainLabel": "Exam & Performance Pressure",
    "matchReason": "Specialized in coping with exam anxiety and study balance",
    "action": "OFFER",
    "matchedSaathi": {
      "chat_id": "schat-863e64c9",
      "saathi_id": "saathi-aadhya",
      "alias": "NightOwl_Eng_23",
      "role": "PRIMARY",
      "status": "ACTIVE",
      "intro_message": "Hey! I'm NightOwl_Eng_23. I know how overwhelming exam and test pressure can get. There is zero pressure here — take your time and vent whatever is on your mind.",
      "vibeTags": [
        { "icon": "🌙", "label": "Night owl", "tag_key": "night_owl" },
        { "icon": "💻", "label": "Engineering student", "tag_key": "academic_stress" },
        { "icon": "📚", "label": "Academic pressure", "tag_key": "exam_period" },
        { "icon": "☕", "label": "Filter coffee", "tag_key": "sleep_issues" }
      ],
      "avatarSeed": "Aadhya",
      "colorScheme": {
        "bg": "bg-[#EBF2EA]",
        "border": "border-[#9BAE91]",
        "badgeBg": "bg-[#DCE5D4]",
        "text": "text-[#173F2A]"
      }
    },
    "secondarySaathi": {
      "chat_id": "schat-f74b2190",
      "saathi_id": "saathi-arjun",
      "alias": "Pacer_Comm_22",
      "role": "SECONDARY",
      "status": "ACTIVE",
      "intro_message": "Hi there, I'm Pacer_Comm_22. I'm here as your secondary peer anchor whenever you'd like to talk.",
      "vibeTags": [
        { "icon": "⚡", "label": "Exam & performance pressure", "tag_key": "family_stress" },
        { "icon": "🎓", "label": "Same-year student", "tag_key": "academic_stress" }
      ],
      "avatarSeed": "Arjun",
      "colorScheme": {
        "bg": "bg-[#F4ECE1]",
        "border": "border-[#D8C7B0]",
        "badgeBg": "bg-[#EDE8DA]",
        "text": "text-[#173F2A]"
      }
    },
    "handoffText": "You don't have to carry this alone. I've matched you with NightOwl_Eng_23, who specializes in exam & performance pressure and is available to talk right now."
  }
}
```

> **Seamless Client Handoff**: When `peerRedirect.shouldRedirect` is true, the server has already provisioned the dual-Saathi peer session. The frontend can display an empathetic "Talk to [Alias]" card inside the chat stream. Tapping it immediately opens `/saathi/chat/{chat_id}` with zero latency and zero onboarding friction!

#### Severity Classifications
| Severity Level | System Meaning & Recommended UI Action |
| :--- | :--- |
| `MILD` | Normal student stress. Suggest gentle breathing exercises or daily check-in. |
| `MODERATE` | Elevated emotional load. Proactively surface option to connect with a peer **Saathi** via `peerRedirect`. |
| `SEVERE` | Crisis indicator (self-harm, hopeless thoughts). Highlight emergency 24/7 **Crisis Helplines** immediately at top of UI. Peer redirection is suppressed. |

---

#### `POST /api/chat/redirect-peer`
Explicit transition endpoint from Sahara Bot (Layer 1) to Peer Supporter (Layer 2).

```http
POST /api/chat/redirect-peer
Content-Type: application/json
```

```json
{
  "session_id": "sess-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "preferred_tag": "exam_period"
}
```

---

#### `GET /api/chat/history`
Fetches complete chat log for the session.

```http
GET /api/chat/history?sessionId=sess-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
```

---

#### `POST /api/chat/reset`
Clears chat companion logs for the active session.

```http
POST /api/chat/reset?sessionId=sess-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
```

---

### 2.3 Daily Mood Check-Ins

#### `POST /api/checkins`
Submits a daily emotional snapshot.

```http
POST /api/checkins
Content-Type: application/json
```

#### Request Body
```json
{
  "session_id": "sess-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "mood": "Anxious",
  "energy": 2,
  "stressor": "Midterm Exams & Sleep",
  "note": "Could not sleep past 3 AM thinking about assignment deadlines."
}
```

#### Response (200 OK)
```json
{
  "id": "chk-c0972527",
  "session_id": "sess-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "mood": "Anxious",
  "energy": 2,
  "stressor": "Midterm Exams & Sleep",
  "note": "Could not sleep past 3 AM thinking about assignment deadlines.",
  "timestamp": "Sep 08, 11:22 AM"
}
```

---

### 2.4 Dual-Saathi Peer Support System

#### `POST /api/saathi/match`
Performs server-side matching based on session inferred tags. Assigns **two Saathis** (`PRIMARY` and `SECONDARY`).

```http
POST /api/saathi/match
Content-Type: application/json
```

#### Request Body
```json
{
  "session_id": "sess-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

#### Response (200 OK)
```json
{
  "session_id": "sess-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "primary": {
    "chat_id": "schat-89496809",
    "saathi_id": "saathi-arjun",
    "alias": "Pacer_Comm_22",
    "role": "PRIMARY",
    "status": "ACTIVE",
    "intro_message": "Hey! I'm Pacer_Comm_22. I'm really glad you reached out today. There is zero pressure here — what's on your mind?",
    "vibeTags": [
      { "icon": "🏏", "label": "Sports & Fitness", "tag_key": "exam_period" },
      { "icon": "🎓", "label": "Same-year student", "tag_key": "academic_stress" },
      { "icon": "⚡", "label": "Exam & performance pressure", "tag_key": "family_stress" },
      { "icon": "🎧", "label": "Indie rock", "tag_key": "isolation" }
    ],
    "avatarSeed": "Arjun",
    "colorScheme": {
      "bg": "bg-[#F4ECE1]",
      "border": "border-[#D8C7B0]",
      "badgeBg": "bg-[#EDE8DA]",
      "text": "text-[#173F2A]"
    }
  },
  "secondary": {
    "chat_id": "schat-782cea20",
    "saathi_id": "saathi-rohan",
    "alias": "SeniorCode_IT_21",
    "role": "SECONDARY",
    "status": "ACTIVE",
    "intro_message": "Hi there, I'm SeniorCode_IT_21. I'm here as your secondary peer anchor whenever you'd like to talk or vent.",
    "vibeTags": [
      { "icon": "💻", "label": "Tech student", "tag_key": "academic_stress" },
      { "icon": "🌙", "label": "Late-night availability", "tag_key": "night_owl" },
      { "icon": "🎮", "label": "Gaming", "tag_key": "sleep_issues" },
      { "icon": "💼", "label": "Placement stress", "tag_key": "exam_period" }
    ],
    "avatarSeed": "Rohan",
    "colorScheme": {
      "bg": "bg-[#F2EBEF]",
      "border": "border-[#D4BDCB]",
      "badgeBg": "bg-[#E8DAE2]",
      "text": "text-[#173F2A]"
    }
  }
}
```

---

#### `POST /api/saathi/switch`
Allows student to switch active UI focus to the `SECONDARY` (or `PRIMARY`) Saathi with **zero guilt** and no notification sent to the other peer.

```http
POST /api/saathi/switch
Content-Type: application/json
```

#### Request Body
```json
{
  "session_id": "sess-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "target_role": "SECONDARY"
}
```

#### Response (200 OK)
```json
{
  "session_id": "sess-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "active_chat_id": "schat-782cea20",
  "active_role": "PRIMARY",
  "active_saathi_alias": "SeniorCode_IT_21",
  "message": "Active peer focus switched successfully with zero guilt."
}
```

---

#### `POST /api/saathi/transition`
Used when a Saathi steps back permanently (with 2-week notice period and optional history consent).

```http
POST /api/saathi/transition
Content-Type: application/json
```

#### Request Body
```json
{
  "saathi_chat_id": "schat-89496809",
  "notice_weeks": 2,
  "consented_history_transfer": true
}
```

#### Response (200 OK)
```json
{
  "saathi_chat_id": "schat-89496809",
  "status": "TRANSITIONING",
  "transition_notice_date": "2026-09-22",
  "consented_history_transfer": true,
  "new_chat_id": "schat-ce2443f4",
  "new_saathi_alias": "QuietAnchor_Des_22",
  "message": "Saathi transition initiated with notice period. Replacement assigned seamlessly."
}
```

---

#### `POST /api/saathi/reassign-request`
Saathi-side silent escape hatch when personal recognition or targeting risk is suspected.

```http
POST /api/saathi/reassign-request
Content-Type: application/json
```

#### Request Body
```json
{
  "saathi_chat_id": "schat-782cea20",
  "reason_flag": "RECOGNITION_RISK"
}
```

#### Response (200 OK)
```json
{
  "saathi_chat_id": "schat-782cea20",
  "reassigned": true,
  "new_chat_id": "schat-953e0361",
  "new_saathi_alias": "NightOwl_Eng_23",
  "message": "Reassignment completed silently. Student experience preserved."
}
```

---

#### `GET /api/saathi/chat/{chat_id}`
Fetches messages from a specific peer chat thread.

```http
GET /api/saathi/chat/schat-89496809
```

---

#### `POST /api/saathi/chat/{chat_id}/message`
Sends a message in a peer chat thread.

```http
POST /api/saathi/chat/schat-89496809/message
Content-Type: application/json
```

#### Request Body
```json
{
  "saathi_chat_id": "schat-89496809",
  "sender": "student",
  "text": "Can you give me tips on surviving 3rd year engineering?"
}
```

---

### 2.5 Saathi Developer Authentication & Peer Supporter Portal

The 4 core developers (**Zakwan, Saifullah, Riyaz, and Samiiksha**) act as the initial real-world Saathi peer supporters. Each developer has dedicated login credentials and an isolated inbox.

#### Developer Accounts & Vibe Specializations
| Username | Real Name | Student-Facing Alias | Primary Vibe Tags |
| :--- | :--- | :--- | :--- |
| `zakwan` | Zakwan | `Zak_TechAnchor_23` | `academic_stress`, `exam_period`, `night_owl` |
| `saifullah` | Saifullah | `Saif_Pacer_22` | `academic_stress`, `family_stress`, `exam_period` |
| `riyaz` | Riyaz | `Riyaz_NightOwl_22` | `sleep_issues`, `night_owl`, `isolation` |
| `samiiksha` | Samiiksha | `Sami_QuietAnchor_23` | `isolation`, `relationship_stress`, `family_stress` |

*Default temporary password for all 4 accounts: `SaharaPeer2025!`*

---

#### `POST /api/saathi/auth/login`
Authenticates a developer Saathi and returns a 7-day signed Bearer token.

```http
POST /api/saathi/auth/login
Content-Type: application/json
```

```json
{
  "username": "zakwan",
  "password": "SaharaPeer2025!"
}
```

#### Response (200 OK)
```json
{
  "token": "eyJzYWF0aGlfaWQiOiJzYWF0aGktemFrd2FuIn0.9fa8b1...",
  "saathi_id": "saathi-zakwan",
  "name": "Zakwan",
  "alias": "Zak_TechAnchor_23",
  "avatarSeed": "Zakwan",
  "vibeTags": [
    { "icon": "💻", "label": "Engineering & coding stress", "tag_key": "academic_stress" },
    { "icon": "📚", "label": "Exam sprint & panic", "tag_key": "exam_period" }
  ],
  "colorScheme": {
    "bg": "bg-[#EBF2EA]",
    "border": "border-[#9BAE91]",
    "badgeBg": "bg-[#DCE5D4]",
    "text": "text-[#173F2A]"
  }
}
```

---

#### `GET /api/saathi/inbox/chats`
Returns all active student conversations assigned to the authenticated Saathi.

```http
GET /api/saathi/inbox/chats
Authorization: Bearer <saathi_token>
```

---

#### `POST /api/saathi/inbox/chat/{chat_id}/reply`
Sends a human peer reply from the authenticated Saathi to the student.

```http
POST /api/saathi/inbox/chat/schat-89496809/reply
Authorization: Bearer <saathi_token>
Content-Type: application/json
```

```json
{
  "text": "Hey! Take a deep breath — I went through the exact same sprint burnout last semester. Let's tackle it step by step."
}
```

---

#### 📱 Interactive Web Inbox (`/dev-inbox` or `/saathi-portal`)
Developers can simply open **`http://127.0.0.1:8000/dev-inbox`** (or `https://<your-app-url>/dev-inbox`) on their phone or browser to log in, view live assigned students, and chat in real-time!

---

### 2.6 Licensed Counsellors & Decoupled Appointments

#### `GET /api/counsellors`
Retrieves list of certified clinical psychologists.

```http
GET /api/counsellors
```

#### `POST /api/appointments`
Books a professional session. PII is stored completely isolated from chat history.

```http
POST /api/appointments
Content-Type: application/json
```

#### Request Body
```json
{
  "counsellor_id": "counsellor-1",
  "counsellor_name": "Dr. Ananya Sen",
  "student_name": "Kavya S.",
  "student_email": "kavya@campus.edu",
  "modality": "Video",
  "selected_slot": "Tomorrow, 3:00 PM",
  "notes": "Discussing exam panic."
}
```

#### Response (200 OK)
```json
{
  "id": "apt-6bbb2c75",
  "counsellor_id": "counsellor-1",
  "counsellor_name": "Dr. Ananya Sen",
  "student_name": "Kavya S.",
  "modality": "Video",
  "selected_slot": "Tomorrow, 3:00 PM",
  "status": "CONFIRMED",
  "created_at": "Sep 08, 2026 11:22 AM"
}
```

---

### 2.6 Resources & Helplines

#### `GET /api/coping-tools`
Returns instant 3-5 minute grounding and breathing exercises.

#### `GET /api/crisis-helplines`
Returns free 24/7 tele-mental health helplines (Tele-MANAS `14416`, KIRAN `1800-599-0019`, Vandrevala `+91 9999 666 555`, AASRA `+91 98204 66726`).

---

### 2.7 Protected Admin Routes

All endpoints returning administrative rosters, aggregate analytics, or real names require the `X-Admin-Key` header:

```http
X-Admin-Key: sahara-admin-secret-2025
```

* `GET /api/analytics` $\rightarrow$ Campus aggregate analytics
* `GET /api/saathis` $\rightarrow$ Full Saathi administrative roster with real names and capacity load
* `GET /api/appointments` $\rightarrow$ Clinical booking records
