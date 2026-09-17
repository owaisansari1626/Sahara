# Sahara (सहारा) — Frontend Client

> **A Privacy-Preserving, Trust-Driven Mental Health Access System for Indian College Students.**

Sahara is designed specifically for college students navigating academic pressure, placement anxiety, burnout, loneliness, and emotional distress. It bridges the gap between isolation and empathetic human connection through a privacy-first, zero-barrier approach.

---

## 🌟 Core Architecture: 3-Layer Support Model

1. **Layer 1: AI Companion & Active Listener (`/chat`)**
   - Immediate, 24/7 empathetic listener with domain tag detection (`academic_stress`, `burnout`, `loneliness`, `anxiety`, `severe_distress`, `general_support`).
   - Contextual peer redirection bridge card offering 1-click transition to matched human peers.
   - Prominent sticky crisis support banner triggered automatically during severe distress detection.

2. **Layer 2: Saathi Peer Support (`/saathi-match`, `/saathi-chat`)**
   - Zero-browsing, bias-free dual assignment matching with Primary and Secondary peer specialists.
   - Real-time polled peer chat room (2.5s interval) with real-time focus toggle (`POST /api/saathi/switch`) between peer aliases.
   - Zero PII exposure with shielded peer aliases.

3. **Layer 3: Developer / Founding Team Inbox Portal (`/dev-inbox`)**
   - Dedicated portal for the founding developer team (Zakwan, Saifullah, Riyaz, Samiiksha).
   - Real-time view of active student threads and direct empathetic response capability via `POST /api/saathi/chat/{chat_id}/message`.

---

## 🛡️ Privacy & Security Guarantees

- **Zero-Identity Entry**: No signup or login required to access support.
- **Anonymous Session Architecture**: Generates and persists a client-side UUID (`sess-<uuid>`) in localStorage.
- **Decoupled Professional Appointments**: Offline appointment booking (`POST /api/appointments`) stores contact details independently without tying them to student chat sessions.
- **Role-Gated Impact Dashboard**: Gated with `X-Admin-Key` header authentication to display anonymized college-wide wellness telemetry.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/codeorbit-tech/Sahara_frontend.git
cd Sahara_frontend

# Install dependencies
npm install
```

### Environment Configuration
Create a `.env` file in the root directory (or copy from `.env.example`):
```env
VITE_API_BASE_URL=https://sahara-h63t.onrender.com
```

### Development Server
```bash
npm run dev
```
The application will be running at `http://localhost:3000`.

### Production Build
```bash
npm run build
npm run preview
```

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite + TypeScript
- **Styling**: TailwindCSS v4 with custom dark/sage aesthetic design tokens
- **Icons & Motion**: Lucide React, Motion
- **Visualizations**: Recharts for anonymized wellness metrics
- **Backend API**: FastAPI live at `https://sahara-h63t.onrender.com`

---

## 👥 Authors & Founding Team

Developed with ❤️ for Indian college students by:
- **Zakwan** (Backend & Infrastructure)
- **Saifullah** (AI & Core Systems)
- **Riyaz** (Product & Workflow Design)
- **Samiiksha** (Full-Stack & Frontend Engineering)
