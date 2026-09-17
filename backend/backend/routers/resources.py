from fastapi import APIRouter
from backend.database import get_db_connection

router = APIRouter()

@router.get("/api/coping-tools")
def get_coping_tools():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM coping_tools")
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "title": r["title"],
            "duration": r["duration"],
            "tag": r["tag"],
            "description": r["description"],
            "category": r["category"]
        })
    return result

@router.get("/api/crisis-helplines")
def get_crisis_helplines():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM crisis_helplines")
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "name": r["name"],
            "number": r["number"],
            "description": r["description"],
            "type": r["type"]
        })
    return result
