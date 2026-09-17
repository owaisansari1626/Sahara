import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Header
from backend.config import settings
from backend.database import get_db_connection

router = APIRouter()

@router.get("/api/analytics")
def get_analytics(x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key")):
    """
    Campus-wide aggregated analytics.
    Strictly protected by X-Admin-Key to prevent external data scraping.
    """
    if not x_admin_key or x_admin_key != settings.ADMIN_SECRET_KEY:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Campus analytics are restricted. Valid X-Admin-Key header required."
        )

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT data_json FROM campus_analytics WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    
    if row and row["data_json"]:
        return json.loads(row["data_json"])
    
    return {}
