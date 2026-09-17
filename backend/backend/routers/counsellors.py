import uuid
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Header
from backend.config import settings
from backend.schemas import CounsellorSchema, AppointmentCreate, AppointmentResponse
from backend.database import get_db_connection

router = APIRouter()

@router.get("/api/counsellors", response_model=List[CounsellorSchema])
def get_counsellors():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM counsellors")
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        result.append(CounsellorSchema(
            id=r["id"],
            name=r["name"],
            credentials=r["credentials"],
            title=r["title"],
            specializations=json.loads(r["specializations"] or "[]"),
            experience=r["experience"],
            languages=json.loads(r["languages"] or "[]"),
            fee=r["fee"],
            modalities=json.loads(r["modalities"] or "[]"),
            nextSlot=r["next_slot"],
            verified=bool(r["verified"]),
            avatarSeed=r["avatar_seed"]
        ))
    return result

@router.post("/api/appointments", response_model=AppointmentResponse)
def create_appointment(req: AppointmentCreate):
    """
    Deliberate, consented exception to 'no PII' required to book with a licensed counsellor.
    Stored isolated from all other tables — never joined with session_id or chat history.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    apt_id = f"apt-{uuid.uuid4().hex[:8]}"
    created_at = datetime.now().strftime("%b %d, %Y %I:%M %p")
    
    cursor.execute("""
        INSERT INTO appointments (id, counsellor_id, counsellor_name, student_name, student_email, modality, selected_slot, notes, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (apt_id, req.counsellor_id, req.counsellor_name, req.student_name, req.student_email or "", req.modality, req.selected_slot, req.notes or "", "CONFIRMED", created_at))
    
    conn.commit()
    conn.close()
    
    return AppointmentResponse(
        id=apt_id,
        counsellor_id=req.counsellor_id,
        counsellor_name=req.counsellor_name,
        student_name=req.student_name,
        modality=req.modality,
        selected_slot=req.selected_slot,
        status="CONFIRMED",
        created_at=created_at
    )

@router.get("/api/appointments", response_model=List[AppointmentResponse])
def get_appointments(x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key")):
    """
    Admin-only clinical roster access. Confidential student appointment records.
    """
    if not x_admin_key or x_admin_key != settings.ADMIN_SECRET_KEY:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Clinical appointment logs are restricted to authorized administrators."
        )

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, counsellor_id, counsellor_name, student_name, modality, selected_slot, status, created_at
        FROM appointments
        ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        result.append(AppointmentResponse(
            id=r["id"],
            counsellor_id=r["counsellor_id"],
            counsellor_name=r["counsellor_name"],
            student_name=r["student_name"],
            modality=r["modality"],
            selected_slot=r["selected_slot"],
            status=r["status"],
            created_at=r["created_at"]
        ))
    return result
