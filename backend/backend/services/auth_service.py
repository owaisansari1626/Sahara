import hmac
import hashlib
import os
import json
import base64
import time
from typing import Optional, Dict, Any
from fastapi import Header, HTTPException
from backend.config import settings
from backend.database import get_db_connection

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return hashed, salt

def verify_password(password: str, password_hash: str, salt: str) -> bool:
    expected, _ = hash_password(password, salt)
    return hmac.compare_digest(expected, password_hash)

def create_saathi_token(saathi_id: str, username: str, expires_in_days: int = 7) -> str:
    payload = {
        "saathi_id": saathi_id,
        "username": username,
        "exp": int(time.time()) + (expires_in_days * 86400)
    }
    payload_bytes = json.dumps(payload).encode('utf-8')
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode('utf-8')
    
    secret = (settings.ADMIN_SECRET_KEY or "sahara-default-secret-key").encode('utf-8')
    sig = hmac.new(secret, payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{sig}"

def verify_saathi_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_b64, sig = parts
        secret = (settings.ADMIN_SECRET_KEY or "sahara-default-secret-key").encode('utf-8')
        expected_sig = hmac.new(secret, payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected_sig, sig):
            return None
        payload_bytes = base64.urlsafe_b64decode(payload_b64.encode('utf-8'))
        payload = json.loads(payload_bytes.decode('utf-8'))
        if payload.get("exp", 0) < int(time.time()):
            return None
        return payload
    except Exception:
        return None

def get_current_saathi(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    FastAPI dependency that validates Saathi Bearer token from Authorization header
    and returns the verified Saathi record.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required. Please log in.")
    
    parts = authorization.strip().split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format. Use: Bearer <token>")
    
    token = parts[1]
    payload = verify_saathi_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Session expired or invalid token. Please log in again.")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM saathis WHERE id = ?", (payload["saathi_id"],))
    saathi = cursor.fetchone()
    conn.close()
    
    if not saathi:
        raise HTTPException(status_code=401, detail="Saathi account not found.")
    
    return dict(saathi)
