import uuid
import json
import random
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Header, Query
from backend.config import settings
from backend.schemas import (
    SaathiProfileSchema,
    SaathiAdminProfileSchema,
    SaathiMatchRequest,
    SaathiMatchResponse,
    SaathiAssignment,
    SaathiSwitchRequest,
    SaathiSwitchResponse,
    SaathiTransitionRequest,
    SaathiTransitionResponse,
    SaathiReassignRequest,
    SaathiReassignResponse,
    SaathiMessageCreate,
    SaathiMessageResponse,
    VibeTag,
    ColorScheme
)
from backend.database import get_db_connection
from backend.services.matching_service import get_or_create_dual_saathi_match

router = APIRouter()

# ---------------------------------------------------------------------------
# Admin-Only Saathi Directory (Public browsing is deprecated to prevent de-anonymization)
# ---------------------------------------------------------------------------
@router.get("/api/saathis", response_model=List[SaathiAdminProfileSchema])
def get_saathis_admin(x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key")):
    """
    Admin-only endpoint to view full Saathi roster with real names and capacities.
    Public browsing is deprecated to prevent student profiling and identity de-anonymization.
    """
    if not x_admin_key or x_admin_key != settings.ADMIN_SECRET_KEY:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Public directory browsing is disabled for student privacy. Admin key required."
        )

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM saathis")
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        result.append(SaathiAdminProfileSchema(
            id=r["id"],
            name=r["name"],
            alias=r["alias"] or r["name"],
            year=r["year"],
            field=r["field"],
            collegeType=r["college_type"],
            vibeTags=json.loads(r["vibe_tags"] or "[]"),
            bio=r["bio"],
            availability=r["availability"],
            languages=json.loads(r["languages"] or "[]"),
            badges=json.loads(r["badges"] or "[]"),
            avatarSeed=r["avatar_seed"],
            colorScheme=json.loads(r["color_scheme"] or "{}"),
            maxCapacity=r["max_capacity"] or 5,
            currentLoad=r["current_load"] or 0
        ))
    return result


# ---------------------------------------------------------------------------
# POST /api/saathi/match — Server-side intelligent matching (Dual-Saathi Model)
# ---------------------------------------------------------------------------
@router.post("/api/saathi/match", response_model=SaathiMatchResponse)
def match_saathi(req: SaathiMatchRequest):
    """
    Server-side intelligent matching based on inferred session distress tags.
    Assigns two Saathis (PRIMARY and SECONDARY) with cap enforcement and random jitter
    to prevent deterministic reverse-engineering. Returns only aliases and intros.
    """
    session_id = req.session_id.strip() if (req.session_id and req.session_id.strip()) else f"sess-{uuid.uuid4()}"
    try:
        return get_or_create_dual_saathi_match(session_id=session_id)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


# ---------------------------------------------------------------------------
# POST /api/saathi/switch — Student-side no-guilt switching
# ---------------------------------------------------------------------------
@router.post("/api/saathi/switch", response_model=SaathiSwitchResponse)
def switch_saathi_role(req: SaathiSwitchRequest):
    """
    Student-controlled instant switch between PRIMARY and SECONDARY Saathi.
    Requires no explanation, sends no notification to deprioritized Saathi.
    """
    target_role = req.target_role.upper()
    if target_role not in ["PRIMARY", "SECONDARY"]:
        raise HTTPException(status_code=400, detail="target_role must be PRIMARY or SECONDARY")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT sc.id, sc.role, sc.saathi_id, s.alias
        FROM saathi_chats sc
        JOIN saathis s ON sc.saathi_id = s.id
        WHERE sc.session_id = ? AND sc.status = 'ACTIVE'
    """, (req.session_id,))
    active_chats = cursor.fetchall()

    if len(active_chats) < 2:
        conn.close()
        raise HTTPException(status_code=404, detail="Dual Saathi chats not found for this session.")

    # Swap roles between the active chats
    chat_a, chat_b = active_chats[0], active_chats[1]
    
    # Identify which chat will be the new active primary
    if target_role == chat_a["role"]:
        active_chat = chat_a
    else:
        # Flip roles in database
        new_role_a = "SECONDARY" if chat_a["role"] == "PRIMARY" else "PRIMARY"
        new_role_b = "SECONDARY" if chat_b["role"] == "PRIMARY" else "PRIMARY"

        cursor.execute("UPDATE saathi_chats SET role = ? WHERE id = ?", (new_role_a, chat_a["id"]))
        cursor.execute("UPDATE saathi_chats SET role = ? WHERE id = ?", (new_role_b, chat_b["id"]))
        conn.commit()

        active_chat = chat_a if new_role_a == "PRIMARY" else chat_b

    conn.close()

    return SaathiSwitchResponse(
        session_id=req.session_id,
        active_chat_id=active_chat["id"],
        active_role="PRIMARY",
        active_saathi_alias=active_chat["alias"],
        message="Active peer focus switched successfully with zero guilt."
    )


# ---------------------------------------------------------------------------
# POST /api/saathi/transition — Saathi stepping back with notice & consented history transfer
# ---------------------------------------------------------------------------
@router.post("/api/saathi/transition", response_model=SaathiTransitionResponse)
def transition_saathi(req: SaathiTransitionRequest):
    """
    Handles Saathi scheduled departure with 2-week notice period.
    Only transfers chat history to replacement Saathi if explicitly consented by student.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM saathi_chats WHERE id = ?
    """, (req.saathi_chat_id,))
    chat = cursor.fetchone()

    if not chat:
        conn.close()
        raise HTTPException(status_code=404, detail="Saathi chat not found.")

    notice_date = (datetime.now() + timedelta(weeks=req.notice_weeks or 2)).strftime("%Y-%m-%d")
    consented_transfer = 1 if req.consented_history_transfer else 0

    # Mark current chat as TRANSITIONING
    cursor.execute("""
        UPDATE saathi_chats 
        SET status = 'TRANSITIONING', transition_notice_date = ?, consented_history_transfer = ?
        WHERE id = ?
    """, (notice_date, consented_transfer, req.saathi_chat_id))

    # Decrement stepping-back Saathi load
    cursor.execute("UPDATE saathis SET current_load = MAX(0, current_load - 1) WHERE id = ?", (chat["saathi_id"],))

    # Find replacement Saathi
    cursor.execute("""
        SELECT * FROM saathis 
        WHERE id != ? AND current_load < max_capacity
        ORDER BY current_load ASC
        LIMIT 1
    """, (chat["saathi_id"],))
    new_saathi = cursor.fetchone()

    if not new_saathi:
        cursor.execute("""
            SELECT * FROM saathis 
            WHERE id != ?
            ORDER BY current_load ASC
            LIMIT 1
        """, (chat["saathi_id"],))
        new_saathi = cursor.fetchone()

    new_chat_id = None
    new_alias = None

    if new_saathi:
        new_chat_id = f"schat-{uuid.uuid4().hex[:8]}"
        new_alias = new_saathi["alias"]
        now_iso = datetime.now().isoformat()
        now_time = datetime.now().strftime("%I:%M %p")

        cursor.execute("""
            INSERT INTO saathi_chats (id, session_id, saathi_id, student_alias, role, status, consented_history_transfer, created_at)
            VALUES (?, ?, ?, ?, ?, 'ACTIVE', 0, ?)
        """, (new_chat_id, chat["session_id"], new_saathi["id"], chat["student_alias"], chat["role"], now_iso))

        cursor.execute("UPDATE saathis SET current_load = current_load + 1 WHERE id = ?", (new_saathi["id"],))

        # Copy history ONLY if student consented
        if req.consented_history_transfer:
            cursor.execute("""
                SELECT sender, text, timestamp FROM saathi_messages WHERE saathi_chat_id = ? ORDER BY created_at ASC
            """, (req.saathi_chat_id,))
            old_messages = cursor.fetchall()
            for m in old_messages:
                cursor.execute("""
                    INSERT INTO saathi_messages (id, saathi_chat_id, sender, text, timestamp)
                    VALUES (?, ?, ?, ?, ?)
                """, (f"smsg-{uuid.uuid4().hex[:8]}", new_chat_id, m["sender"], m["text"], m["timestamp"]))

        # Send greeting from new Saathi
        welcome_text = f"Hey! I'm {new_alias}. I'm stepping in to support you as your {chat['role'].lower()} peer anchor. Take all the time you need."
        cursor.execute("""
            INSERT INTO saathi_messages (id, saathi_chat_id, sender, text, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (f"smsg-{uuid.uuid4().hex[:8]}", new_chat_id, "saathi", welcome_text, now_time))

    conn.commit()
    conn.close()

    return SaathiTransitionResponse(
        saathi_chat_id=req.saathi_chat_id,
        status="TRANSITIONING",
        transition_notice_date=notice_date,
        consented_history_transfer=bool(req.consented_history_transfer),
        new_chat_id=new_chat_id,
        new_saathi_alias=new_alias,
        message="Saathi transition initiated with notice period. Replacement assigned seamlessly."
    )


# ---------------------------------------------------------------------------
# POST /api/saathi/reassign-request — Saathi-side silent escape hatch
# ---------------------------------------------------------------------------
@router.post("/api/saathi/reassign-request", response_model=SaathiReassignResponse)
def reassign_saathi(req: SaathiReassignRequest):
    """
    Saathi escape hatch when personal recognition or targeting is suspected.
    Silently reassigns to an alternative Saathi with zero explanation surfaced to student.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM saathi_chats WHERE id = ?", (req.saathi_chat_id,))
    chat = cursor.fetchone()

    if not chat:
        conn.close()
        raise HTTPException(status_code=404, detail="Saathi chat not found.")

    # Close current chat and decrement previous Saathi's load
    cursor.execute("UPDATE saathi_chats SET status = 'CLOSED' WHERE id = ?", (req.saathi_chat_id,))
    cursor.execute("UPDATE saathis SET current_load = MAX(0, current_load - 1) WHERE id = ?", (chat["saathi_id"],))

    # Pick a new replacement Saathi
    cursor.execute("""
        SELECT * FROM saathis 
        WHERE id != ? AND current_load < max_capacity
        ORDER BY current_load ASC
        LIMIT 1
    """, (chat["saathi_id"],))
    new_saathi = cursor.fetchone()

    if not new_saathi:
        # Fallback to any other Saathi
        cursor.execute("SELECT * FROM saathis WHERE id != ? ORDER BY current_load ASC LIMIT 1", (chat["saathi_id"],))
        new_saathi = cursor.fetchone()

    new_chat_id = f"schat-{uuid.uuid4().hex[:8]}"
    now_iso = datetime.now().isoformat()
    now_time = datetime.now().strftime("%I:%M %p")
    new_alias = new_saathi["alias"]

    cursor.execute("""
        INSERT INTO saathi_chats (id, session_id, saathi_id, student_alias, role, status, consented_history_transfer, created_at)
        VALUES (?, ?, ?, ?, ?, 'ACTIVE', 0, ?)
    """, (new_chat_id, chat["session_id"], new_saathi["id"], chat["student_alias"], chat["role"], now_iso))

    cursor.execute("UPDATE saathis SET current_load = current_load + 1 WHERE id = ?", (new_saathi["id"],))

    # Routine neutral introduction (student experiences it as routine server reassignment)
    greeting = f"Hello! I'm {new_alias}. I'll be continuing our support connection here. Feel free to share whatever is on your mind."
    cursor.execute("""
        INSERT INTO saathi_messages (id, saathi_chat_id, sender, text, timestamp)
        VALUES (?, ?, ?, ?, ?)
    """, (f"smsg-{uuid.uuid4().hex[:8]}", new_chat_id, "saathi", greeting, now_time))

    conn.commit()
    conn.close()

    return SaathiReassignResponse(
        saathi_chat_id=req.saathi_chat_id,
        reassigned=True,
        new_chat_id=new_chat_id,
        new_saathi_alias=new_alias,
        message="Reassignment completed silently. Student experience preserved."
    )


# ---------------------------------------------------------------------------
# Chat Messaging Endpoints
# ---------------------------------------------------------------------------
@router.get("/api/saathi/chat/{chat_id}")
def get_saathi_messages(chat_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, saathi_chat_id, sender, text, timestamp
        FROM saathi_messages
        WHERE saathi_chat_id = ?
        ORDER BY created_at ASC
    """, (chat_id,))
    rows = cursor.fetchall()
    conn.close()
    
    messages = []
    for r in rows:
        messages.append({
            "id": r["id"],
            "saathi_chat_id": r["saathi_chat_id"],
            "sender": r["sender"],
            "text": r["text"],
            "timestamp": r["timestamp"]
        })
    return messages


@router.post("/api/saathi/chat/{chat_id}/message")
def send_saathi_message(chat_id: str, req: SaathiMessageCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Store student message
    msg_id = f"smsg-{uuid.uuid4().hex[:8]}"
    now_time = datetime.now().strftime("%I:%M %p")
    
    cursor.execute("""
        INSERT INTO saathi_messages (id, saathi_chat_id, sender, text, timestamp)
        VALUES (?, ?, ?, ?, ?)
    """, (msg_id, chat_id, "student", req.text, now_time))
    
    # Generate warm peer response
    saathi_reply_id = f"smsg-{uuid.uuid4().hex[:8]}"
    saathi_reply_text = "I completely hear you. That sounds really exhausting. Take a deep breath — we can talk through it step by step whenever you're ready."
    
    lower = req.text.lower()
    if "exam" in lower or "study" in lower or "assignment" in lower:
        saathi_reply_text = "Academics get so suffocating during test season. I remember feeling like everyone else understood the syllabus except me. You're definitely not alone in feeling this way."
    elif "hostel" in lower or "home" in lower or "lonely" in lower:
        saathi_reply_text = "Hostel transition is so quietly tough. The first few months away from home can feel really isolating, but it does get easier. I'm here for you."
    elif "placement" in lower or "job" in lower or "career" in lower:
        saathi_reply_text = "Placement stress is an absolute pressure cooker. Remember that your first job does not define your entire potential. Let's take it one day at a time."
        
    cursor.execute("""
        INSERT INTO saathi_messages (id, saathi_chat_id, sender, text, timestamp)
        VALUES (?, ?, ?, ?, ?)
    """, (saathi_reply_id, chat_id, "saathi", saathi_reply_text, now_time))
    
    conn.commit()
    conn.close()
    
    return {
        "user_message": {
            "id": msg_id,
            "saathi_chat_id": chat_id,
            "sender": "student",
            "text": req.text,
            "timestamp": now_time
        },
        "saathi_reply": {
            "id": saathi_reply_id,
            "saathi_chat_id": chat_id,
            "sender": "saathi",
            "text": saathi_reply_text,
            "timestamp": now_time
        }
    }
