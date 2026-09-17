import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from backend.schemas import CheckInCreate, CheckInResponse
from backend.database import get_db_connection

router = APIRouter()

@router.post("/api/checkins", response_model=CheckInResponse)
def create_checkin(checkin: CheckInCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    checkin_id = f"chk-{uuid.uuid4().hex[:8]}"
    now_str = datetime.now().strftime("%b %d, %I:%M %p")
    session_id = checkin.session_id.strip() if (checkin.session_id and checkin.session_id.strip()) else f"sess-{uuid.uuid4()}"
    
    # Ensure session exists
    cursor.execute("SELECT session_id FROM sessions WHERE session_id = ?", (session_id,))
    if not cursor.fetchone():
        cursor.execute("INSERT INTO sessions (session_id, created_at, last_active, inferred_tags) VALUES (?, ?, ?, ?)",
                       (session_id, datetime.now().isoformat(), datetime.now().isoformat(), '[]'))
    
    cursor.execute("""
        INSERT INTO checkins (id, session_id, mood, energy, stressor, note, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (checkin_id, session_id, checkin.mood, checkin.energy, checkin.stressor or "", checkin.note or "", now_str))
    
    conn.commit()
    conn.close()
    
    return CheckInResponse(
        id=checkin_id,
        session_id=session_id,
        mood=checkin.mood,
        energy=checkin.energy,
        stressor=checkin.stressor or "",
        note=checkin.note or "",
        timestamp=now_str
    )

@router.get("/api/checkins")
def get_checkins(sessionId: str = Query(..., description="Unique client session UUID")):
    if not sessionId or not sessionId.strip():
        raise HTTPException(status_code=400, detail="sessionId query parameter is required")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, session_id, mood, energy, stressor, note, timestamp
        FROM checkins
        WHERE session_id = ?
        ORDER BY created_at DESC
    """, (sessionId.strip(),))
    rows = cursor.fetchall()
    conn.close()
    
    res = []
    for r in rows:
        res.append({
            "id": r["id"],
            "session_id": r["session_id"],
            "mood": r["mood"],
            "energy": r["energy"],
            "stressor": r["stressor"],
            "note": r["note"],
            "timestamp": r["timestamp"]
        })
    return res
