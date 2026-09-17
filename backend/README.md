# Sahara (सहारा) — FastAPI Mental Health Backend

An empathetic, confidential mental health and peer support backend designed specifically for Indian college students.

Powered by **FastAPI**, **LangChain**, **Google Gemini (`gemini-2.0-flash`)**, and an embedded **SQLite** database.

---

## 🌟 Key Features & Architecture

1. **AI Model Layer (LangChain + Gemini)**:
   - Utilizes `ChatGoogleGenerativeAI` from `langchain-google-genai` as the primary AI layer.
   - Performs empathetic companion responses and automatic distress severity classification (`MILD`, `MODERATE`, `SEVERE`).
   - Includes a safe, zero-downtime contextual rule-based empathy fallback when `GEMINI_API_KEY` is not provided.

2. **Daily Mood Check-Ins**:
   - `POST /api/checkins` and `GET /api/checkins` for recording student mood, energy levels, and primary stressors.

3. **Saathi Peer Supporter Matching & Messaging**:
   - `GET /api/saathis`: Retrieve verified peer supporters filtered by vibe tags, languages, and availability.
   - `POST /api/saathi/chat/start`: Initialize a private peer chat.
   - `POST /api/saathi/chat/{chat_id}/message`: Send peer messages and receive contextual responses.

4. **Professional Clinical Counsellor Bookings**:
   - `GET /api/counsellors`: Browse clinical psychologists, trauma therapists, and stress consultants.
   - `POST /api/appointments`: Book subsidized or free counselling sessions.

5. **24/7 Crisis Helplines & Grounding Tools**:
   - `GET /api/crisis-helplines`: Access 24/7 verified government & NGO helplines (Tele-MANAS, KIRAN, AASRA, Vandrevala Foundation).
   - `GET /api/coping-tools`: Curated 4-7-8 breathing, 5-4-3-2-1 sensory grounding, and exam stress release tools.

6. **Campus Impact Analytics**:
   - `GET /api/analytics`: Aggregated, privacy-preserved metrics for campus wellness administrators.

---

## 🚀 Quick Start Guide

### 1. Setup Virtual Environment & Dependencies

```bash
# Create Python virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

To enable full LangChain Gemini capabilities, add your Gemini API key in `.env`:

```env
GEMINI_API_KEY=your_actual_gemini_api_key
PORT=8000
HOST=127.0.0.1
```

### 3. Launch the Server

Run using python:

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn backend.main:app --reload --port 8000
```

### 4. Interactive OpenAPI Docs

Once the server is running, open your browser and navigate to:
👉 **`http://127.0.0.1:8000/docs`** (Swagger UI)
👉 **`http://127.0.0.1:8000/redoc`** (ReDoc UI)

---

## 📂 Project Structure

```
Sahara/
├── backend/
│   ├── config.py             # Environment configuration (Pydantic settings)
│   ├── database.py           # SQLite connection and automatic table seeding
│   ├── schemas.py            # Pydantic data schemas
│   ├── services/
│   │   └── langchain_service.py # LangChain + Gemini AI model layer
│   └── routers/
│       ├── health.py         # /api/health
│       ├── chat.py           # /api/chat, /api/chat/history, /api/chat/reset
│       ├── checkins.py       # /api/checkins
│       ├── saathis.py        # /api/saathis, /api/saathi/chat/*
│       ├── counsellors.py    # /api/counsellors, /api/appointments
│       ├── resources.py      # /api/coping-tools, /api/crisis-helplines
│       └── analytics.py      # /api/analytics
├── main.py                   # Root server execution script
├── requirements.txt          # Python package requirements
├── .env.example              # Environment variables template
└── README.md                 # Documentation
```

---

## 🛡️ License & Mission

Sahara is designed as a student-first mental health initiative — *"A student should never have to admit they need help before they can receive support."*
