import uuid
import json
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from backend.schemas import ChatRequest, ChatResponse, PeerRedirectInfo, PeerRedirectRequest
from backend.database import get_db_connection
from backend.services.langchain_service import process_student_chat_with_langchain
from backend.services.matching_service import evaluate_peer_redirection

router = APIRouter()

# ---------------------------------------------------------------------------
# Crisis Detection Caveat (v1 Implementation Note):
# The current SEVERE distress detection relies on high-sensitivity keyword/regex
# triggers combined with Gemini zero-shot classification (v1).
# Production deployment requires:
#  1. A calibrated clinical intent classifier (e.g. fine-tuned on crisis dialogs)
#  2. Automated logging and proactive human clinical supervisor review of near-misses
#  3. Real-time fallback escalation paths if network or LLM latency spikes
# ---------------------------------------------------------------------------

@router.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    # Session handling: Never fallback to shared "anon-session".
    # If missing or blank, generate a dedicated UUID server-side so anonymous students never collide.
    session_id = request.session_id.strip() if (request.session_id and request.session_id.strip()) else f"sess-{uuid.uuid4()}"
    
    # Process chat through LangChain Gemini service layer
    result = await process_student_chat_with_langchain(
        user_message=request.userMessage,
        history=request.messages,
        current_severity=request.currentSeverity or "MODERATE"
    )
    
    reply_text = result.get("reply", "")
    suggested_severity = result.get("suggestedSeverity", "MODERATE")
    inferred_tags = result.get("inferredTags", [])
    source = result.get("source", "langchain-gemini")
    
    # Persist message, reply, and inferred tags into SQLite database
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now_iso = datetime.now().isoformat()
    now_time = datetime.now().strftime("%I:%M %p")

    # Ensure session exists and update tags
    cursor.execute("SELECT inferred_tags FROM sessions WHERE session_id = ?", (session_id,))
    row = cursor.fetchone()
    
    merged_tags = list(set(inferred_tags))
    if not row:
        tags_json = json.dumps(merged_tags)
        cursor.execute("INSERT INTO sessions (session_id, created_at, last_active, inferred_tags) VALUES (?, ?, ?, ?)",
                       (session_id, now_iso, now_iso, tags_json))
    else:
        existing_tags = []
        try:
            existing_tags = json.loads(row["inferred_tags"] or "[]")
        except Exception:
            existing_tags = []
        
        merged_tags = list(set(existing_tags + inferred_tags))
        cursor.execute("UPDATE sessions SET last_active = ?, inferred_tags = ? WHERE session_id = ?",
                       (now_iso, json.dumps(merged_tags), session_id))
    
    # Insert user message log
    std_id = f"std-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO chat_messages (id, session_id, sender, text, severity, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (std_id, session_id, "student", request.userMessage, suggested_severity, now_time))
    
    # Insert Sahara reply log
    sahara_id = f"sahara-{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO chat_messages (id, session_id, sender, text, severity, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (sahara_id, session_id, "sahara", reply_text, suggested_severity, now_time))
    
    conn.commit()
    conn.close()
    
    # Layer 1 to Layer 2 Peer Redirection Evaluation:
    # If the student's conversation indicates a specific domain (e.g., exam pressure, sleep issues),
    # evaluate matching against peer Saathis with specialized vibe tags and provision redirection bridge.
    peer_redirect = None
    if suggested_severity != "SEVERE" and merged_tags:
        peer_redirect = evaluate_peer_redirection(
            session_id=session_id,
            inferred_tags=merged_tags,
            current_severity=suggested_severity,
            student_message=request.userMessage
        )

    return ChatResponse(
        session_id=session_id,
        reply=reply_text,
        suggestedSeverity=suggested_severity,
        inferredTags=merged_tags,
        source=source,
        peerRedirect=peer_redirect
    )

@router.post("/api/chat/redirect-peer", response_model=PeerRedirectInfo)
def redirect_to_peer_endpoint(req: PeerRedirectRequest):
    """
    Explicit transition endpoint from bot chat (Layer 1) to peer supporter (Layer 2).
    Returns the matched specialized Saathi and active chat connection.
    """
    session_id = req.session_id.strip() if (req.session_id and req.session_id.strip()) else f"sess-{uuid.uuid4()}"
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT inferred_tags FROM sessions WHERE session_id = ?", (session_id,))
    row = cursor.fetchone()
    cursor.execute("""
        SELECT text FROM chat_messages 
        WHERE session_id = ? AND sender = 'student' 
        ORDER BY created_at DESC LIMIT 1
    """, (session_id,))
    last_student_msg = cursor.fetchone()
    student_message_text = last_student_msg["text"] if last_student_msg else None
    conn.close()

    tags = []
    if row and row["inferred_tags"]:
        try:
            tags = json.loads(row["inferred_tags"])
        except Exception:
            tags = []
    if req.preferred_tag and req.preferred_tag not in tags:
        tags.insert(0, req.preferred_tag)

    redirect_info = evaluate_peer_redirection(
        session_id=session_id,
        inferred_tags=tags,
        current_severity="MODERATE",
        student_message=student_message_text
    )
    if not redirect_info:
        raise HTTPException(status_code=404, detail="No suitable peer supporter match found for the current conversation.")
    return redirect_info

@router.get("/api/chat/history")
def get_chat_history(sessionId: str = Query(..., description="Unique client session UUID")):
    if not sessionId or not sessionId.strip():
        raise HTTPException(status_code=400, detail="sessionId query parameter is required")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, sender, text, severity, timestamp
        FROM chat_messages
        WHERE session_id = ?
        ORDER BY created_at ASC
    """, (sessionId.strip(),))
    rows = cursor.fetchall()
    conn.close()
    
    messages = []
    for r in rows:
        messages.append({
            "id": r["id"],
            "sender": r["sender"],
            "text": r["text"],
            "severity": r["severity"],
            "timestamp": r["timestamp"]
        })
    return {"session_id": sessionId, "messages": messages}

@router.post("/api/chat/reset")
def reset_chat_history(sessionId: str = Query(..., description="Unique client session UUID")):
    if not sessionId or not sessionId.strip():
        raise HTTPException(status_code=400, detail="sessionId query parameter is required")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM chat_messages WHERE session_id = ?", (sessionId.strip(),))
    conn.commit()
    conn.close()
    return {"status": "reset", "session_id": sessionId}
