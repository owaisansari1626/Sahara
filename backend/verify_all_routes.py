import json
import uuid
import sys
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import init_db

def run_route_tests():
    print("=" * 80)
    print(" SAHARA BACKEND — COMPREHENSIVE ROUTE VERIFICATION SUITE")
    print("=" * 80)

    # Initialize DB
    init_db()
    from backend.database import get_db_connection
    _conn = get_db_connection()
    _conn.execute("UPDATE saathis SET current_load = 0")
    _conn.commit()
    _conn.close()

    client = TestClient(app)
    admin_headers = {"X-Admin-Key": "sahara-admin-secret-2025"}

    passed = 0
    total = 0

    def test(name, fn):
        nonlocal passed, total
        total += 1
        print(f"\n[{total}] Testing: {name} ...", end=" ")
        try:
            fn()
            print("PASSED (200 OK)")
            passed += 1
        except Exception as e:
            print(f"FAILED: {e}")
            raise e

    # 1. Health Route
    def test_health():
        r = client.get("/api/health")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert r.json()["status"] == "ok"
    test("GET /api/health", test_health)

    # 2. Coping Tools
    def test_coping_tools():
        r = client.get("/api/coping-tools")
        assert r.status_code == 200
        tools = r.json()
        assert len(tools) >= 5
        assert "title" in tools[0]
    test("GET /api/coping-tools", test_coping_tools)

    # 3. Crisis Helplines
    def test_helplines():
        r = client.get("/api/crisis-helplines")
        assert r.status_code == 200
        lines = r.json()
        assert len(lines) >= 4
        assert "Tele-MANAS" in lines[0]["name"]
    test("GET /api/crisis-helplines", test_helplines)

    # 4. Counsellors Directory
    def test_counsellors():
        r = client.get("/api/counsellors")
        assert r.status_code == 200
        c = r.json()
        assert len(c) >= 3
        assert "Dr. Ananya Sen" in c[0]["name"]
    test("GET /api/counsellors", test_counsellors)

    # Create a fresh session UUID
    session_id = f"test-sess-{uuid.uuid4().hex[:8]}"

    # 5. Chat POST (with session_id, moderate stress)
    def test_chat_with_session():
        r = client.post("/api/chat", json={
            "session_id": session_id,
            "userMessage": "I have semester exams coming up and I am unable to focus or sleep.",
            "currentSeverity": "MODERATE"
        })
        assert r.status_code == 200
        data = r.json()
        assert data["session_id"] == session_id
        assert len(data["reply"]) > 10
        assert "inferredTags" in data
        assert isinstance(data["inferredTags"], list)
    test("POST /api/chat (Session ID & Tag Inference)", test_chat_with_session)

    # 6. Chat POST (Auto-UUID generation when session_id is None)
    def test_chat_auto_uuid():
        r = client.post("/api/chat", json={
            "userMessage": "I feel lonely in the hostel."
        })
        assert r.status_code == 200
        data = r.json()
        assert data["session_id"].startswith("sess-")
    test("POST /api/chat (Auto-Session UUID Generation)", test_chat_auto_uuid)

    # 7. Chat POST (Crisis Trigger)
    def test_chat_crisis():
        r = client.post("/api/chat", json={
            "session_id": session_id,
            "userMessage": "I am having suicidal thoughts and don't feel safe."
        })
        assert r.status_code == 200
        data = r.json()
        assert data["suggestedSeverity"] == "SEVERE"
    test("POST /api/chat (Crisis Trigger & Severe Severity)", test_chat_crisis)

    # 8. Chat History GET
    def test_chat_history():
        r = client.get(f"/api/chat/history?sessionId={session_id}")
        assert r.status_code == 200
        msgs = r.json()["messages"]
        assert len(msgs) >= 4
    test("GET /api/chat/history", test_chat_history)

    # 9. Daily Check-in POST
    def test_checkin_post():
        r = client.post("/api/checkins", json={
            "session_id": session_id,
            "mood": "Overwhelmed",
            "energy": 2,
            "stressor": "Placements",
            "note": "Attending 3 interview rounds today"
        })
        assert r.status_code == 200
        data = r.json()
        assert data["session_id"] == session_id
        assert data["mood"] == "Overwhelmed"
    test("POST /api/checkins", test_checkin_post)

    # 10. Daily Check-in GET
    def test_checkin_get():
        r = client.get(f"/api/checkins?sessionId={session_id}")
        assert r.status_code == 200
        checkins = r.json()
        assert len(checkins) >= 1
    test("GET /api/checkins", test_checkin_get)

    # 11. Saathis Public Directory (Must be 401 Unauthorized for students)
    def test_saathis_unauth():
        r = client.get("/api/saathis")
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"
    test("GET /api/saathis (Blocked for Student Privacy - 401)", test_saathis_unauth)

    # 12. Saathis Admin Directory (200 with X-Admin-Key)
    def test_saathis_admin():
        r = client.get("/api/saathis", headers=admin_headers)
        assert r.status_code == 200
        saathis = r.json()
        assert len(saathis) >= 4
        assert "name" in saathis[0]
        assert "alias" in saathis[0]
        assert "maxCapacity" in saathis[0]
    test("GET /api/saathis (Admin Access with X-Admin-Key - 200)", test_saathis_admin)

    # 13. Dual-Saathi Matching POST
    primary_chat_id = None
    secondary_chat_id = None
    def test_saathi_match():
        nonlocal primary_chat_id, secondary_chat_id
        r = client.post("/api/saathi/match", json={"session_id": session_id})
        assert r.status_code == 200
        data = r.json()
        assert data["session_id"] == session_id
        assert data["primary"]["role"] == "PRIMARY"
        assert data["secondary"]["role"] == "SECONDARY"
        assert any(x in data["primary"]["alias"] for x in ["Zak", "Saif", "Riyaz", "Sami", "NightOwl", "Pacer", "Anchor", "QuietAnchor", "SeniorCode"])
        primary_chat_id = data["primary"]["chat_id"]
        secondary_chat_id = data["secondary"]["chat_id"]
    test("POST /api/saathi/match (Dual-Saathi Matching)", test_saathi_match)

    # 14. Saathi Chat Message GET
    def test_saathi_chat_get():
        r = client.get(f"/api/saathi/chat/{primary_chat_id}")
        assert r.status_code == 200
        msgs = r.json()
        assert len(msgs) >= 1  # Initial greeting
    test("GET /api/saathi/chat/{chat_id}", test_saathi_chat_get)

    # 15. Saathi Chat Message POST
    def test_saathi_chat_msg_post():
        r = client.post(f"/api/saathi/chat/{primary_chat_id}/message", json={
            "saathi_chat_id": primary_chat_id,
            "sender": "student",
            "text": "Hi, I feel anxious about my upcoming exam."
        })
        assert r.status_code == 200
        data = r.json()
        assert "user_message" in data
        assert "saathi_reply" in data
    test("POST /api/saathi/chat/{chat_id}/message", test_saathi_chat_msg_post)

    # 16. Saathi Role Switch POST
    def test_saathi_switch():
        r = client.post("/api/saathi/switch", json={
            "session_id": session_id,
            "target_role": "SECONDARY"
        })
        assert r.status_code == 200
        data = r.json()
        assert data["active_chat_id"] == secondary_chat_id
    test("POST /api/saathi/switch (No-Guilt Instant Focus Toggle)", test_saathi_switch)

    # 17. Saathi Transition POST (with notice & history transfer consent)
    def test_saathi_transition():
        r = client.post("/api/saathi/transition", json={
            "saathi_chat_id": primary_chat_id,
            "notice_weeks": 2,
            "consented_history_transfer": True
        })
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "TRANSITIONING"
        assert data["consented_history_transfer"] is True
        assert data["new_chat_id"] is not None
    test("POST /api/saathi/transition (Saathi Step-Back with Notice)", test_saathi_transition)

    # 18. Saathi Reassign Request POST (Escape Hatch)
    def test_saathi_reassign():
        r = client.post("/api/saathi/reassign-request", json={
            "saathi_chat_id": secondary_chat_id,
            "reason_flag": "RECOGNITION_RISK"
        })
        assert r.status_code == 200
        data = r.json()
        assert data["reassigned"] is True
        assert data["new_chat_id"] is not None
    test("POST /api/saathi/reassign-request (Silent Escape Hatch)", test_saathi_reassign)

    # 19. Clinical Psychologist Appointment POST (Isolated PII)
    def test_appointment_post():
        r = client.post("/api/appointments", json={
            "counsellor_id": "counsellor-1",
            "counsellor_name": "Dr. Ananya Sen",
            "student_name": "Kavya S.",
            "student_email": "kavya@campus.edu",
            "modality": "Video",
            "selected_slot": "Tomorrow, 3:00 PM",
            "notes": "Discussing exam panic"
        })
        assert r.status_code == 200
        data = r.json()
        assert data["student_name"] == "Kavya S."
        assert data["status"] == "CONFIRMED"
    test("POST /api/appointments (Decoupled Clinical Booking)", test_appointment_post)

    # 20. Appointments Admin GET (Unauthorized 401, Admin 200)
    def test_appointments_auth():
        unauth = client.get("/api/appointments")
        assert unauth.status_code == 401
        auth = client.get("/api/appointments", headers=admin_headers)
        assert auth.status_code == 200
        appts = auth.json()
        assert len(appts) >= 1
    test("GET /api/appointments (Access Control: 401 / 200)", test_appointments_auth)

    # 21. Campus Analytics GET (Unauthorized 401, Admin 200)
    def test_analytics_auth():
        unauth = client.get("/api/analytics")
        assert unauth.status_code == 401
        auth = client.get("/api/analytics", headers=admin_headers)
        assert auth.status_code == 200
        analytics = auth.json()
        assert "totalStudentsCovered" in analytics
        assert "studentTrustScore" in analytics
    test("GET /api/analytics (Admin Key Verification)", test_analytics_auth)

    # 22. Chat Reset POST
    def test_chat_reset():
        r = client.post(f"/api/chat/reset?sessionId={session_id}")
        assert r.status_code == 200
        # Verify history is empty
        history_res = client.get(f"/api/chat/history?sessionId={session_id}")
        assert len(history_res.json()["messages"]) == 0
    test("POST /api/chat/reset (Clear Conversation Log)", test_chat_reset)

    # 23. Chat Layer 1: Exam Domain Tag Matching & Peer Redirection
    redirect_chat_id = None
    def test_chat_peer_redirection():
        nonlocal redirect_chat_id
        exam_session_id = f"exam-sess-{uuid.uuid4().hex[:8]}"
        r = client.post("/api/chat", json={
            "session_id": exam_session_id,
            "userMessage": "I am facing huge stress with my upcoming exams and grades. I am completely overwhelmed by test anxiety.",
            "currentSeverity": "MODERATE"
        })
        assert r.status_code == 200
        data = r.json()
        assert "peerRedirect" in data
        assert data["peerRedirect"] is not None
        pr = data["peerRedirect"]
        assert pr["shouldRedirect"] is True
        assert pr["matchedDomain"] in ["exam_period", "academic_stress"]
        assert pr["matchedSaathi"] is not None
        assert any(x in pr["matchedSaathi"]["alias"] for x in ["Zak", "Saif", "Riyaz", "Sami", "NightOwl", "Pacer", "Anchor", "QuietAnchor", "SeniorCode"])
        assert pr["matchedSaathi"]["chat_id"].startswith("schat-")
        assert len(pr["handoffText"]) > 10
        redirect_chat_id = pr["matchedSaathi"]["chat_id"]
    test("POST /api/chat (Layer 1 Exam Domain Vibe Matching -> Layer 2 Peer Redirection)", test_chat_peer_redirection)

    # 24. Seamless Post-Redirection Peer Messaging
    def test_seamless_peer_messaging():
        assert redirect_chat_id is not None
        r = client.post(f"/api/saathi/chat/{redirect_chat_id}/message", json={
            "saathi_chat_id": redirect_chat_id,
            "sender": "student",
            "text": "Hi, Sahara suggested I connect with you about handling exam pressure."
        })
        assert r.status_code == 200
        data = r.json()
        assert "user_message" in data
        assert "saathi_reply" in data
        assert "exam" in data["saathi_reply"]["text"].lower() or "academic" in data["saathi_reply"]["text"].lower() or "alone" in data["saathi_reply"]["text"].lower()
    test("POST /api/saathi/chat/{chat_id}/message (Immediate Seamless Handoff Messaging)", test_seamless_peer_messaging)

    # 25. Explicit Peer Redirection Endpoint & Crisis Safety Suppression
    def test_explicit_redirect_and_crisis_safety():
        # A. Explicit redirect endpoint
        red_sess = f"red-sess-{uuid.uuid4().hex[:8]}"
        r1 = client.post("/api/chat/redirect-peer", json={
            "session_id": red_sess,
            "preferred_tag": "exam_period"
        })
        assert r1.status_code == 200
        d1 = r1.json()
        assert d1["shouldRedirect"] is True
        assert d1["matchedDomain"] == "exam_period"
        assert d1["matchedSaathi"] is not None

        # B. Crisis safety: SEVERE distress must suppress peer redirection in favor of emergency crisis helplines
        crisis_sess = f"crisis-sess-{uuid.uuid4().hex[:8]}"
        r2 = client.post("/api/chat", json={
            "session_id": crisis_sess,
            "userMessage": "I want to end my life, I don't feel safe with myself right now."
        })
        assert r2.status_code == 200
        d2 = r2.json()
        assert d2["suggestedSeverity"] == "SEVERE"
        assert d2["peerRedirect"] is None, "Peer redirection must be suppressed during SEVERE crisis"
    test("POST /api/chat/redirect-peer & Crisis Safety Suppression", test_explicit_redirect_and_crisis_safety)

    # 26. Saathi Auth: Login with Valid Credentials
    saathi_token = None
    def test_saathi_login_success():
        nonlocal saathi_token
        r = client.post("/api/saathi/auth/login", json={
            "username": "zakwan",
            "password": "SaharaPeer2025!"
        })
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        assert data["name"] == "Zakwan"
        assert "Zak" in data["alias"]
        saathi_token = data["token"]
    test("POST /api/saathi/auth/login (Valid Dev Saathi Login)", test_saathi_login_success)

    # 27. Saathi Auth: Login with Invalid Credentials (401)
    def test_saathi_login_invalid():
        r = client.post("/api/saathi/auth/login", json={
            "username": "zakwan",
            "password": "WrongPassword123!"
        })
        assert r.status_code == 401
    test("POST /api/saathi/auth/login (Invalid Password - 401)", test_saathi_login_invalid)

    # 28. Saathi Auth: GET /api/saathi/auth/me (Bearer Token)
    def test_saathi_auth_me():
        assert saathi_token is not None
        r = client.get("/api/saathi/auth/me", headers={"Authorization": f"Bearer {saathi_token}"})
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "Zakwan"
        assert data["saathi_id"] == "saathi-zakwan"
    test("GET /api/saathi/auth/me (Authenticated Profile)", test_saathi_auth_me)

    # 29. Saathi Inbox: GET /api/saathi/inbox/chats
    def test_saathi_inbox_chats():
        assert saathi_token is not None
        r = client.get("/api/saathi/inbox/chats", headers={"Authorization": f"Bearer {saathi_token}"})
        assert r.status_code == 200
        chats = r.json()
        assert isinstance(chats, list)
    test("GET /api/saathi/inbox/chats (Isolated Student Threads)", test_saathi_inbox_chats)

    # 30. Saathi Human Reply: POST /api/saathi/inbox/chat/{chat_id}/reply
    def test_saathi_human_reply():
        # First ensure Zakwan has a chat
        assert saathi_token is not None
        # Match zakwan explicitly or find chat
        r_chats = client.get("/api/saathi/inbox/chats", headers={"Authorization": f"Bearer {saathi_token}"})
        chats = r_chats.json()
        target_chat_id = None
        if chats:
            target_chat_id = chats[0]["chat_id"]
        else:
            # Create a test chat assigned to saathi-zakwan
            from backend.database import get_db_connection
            from datetime import datetime
            conn = get_db_connection()
            target_chat_id = f"schat-{uuid.uuid4().hex[:8]}"
            now_iso = datetime.now().isoformat()
            conn.execute("""
                INSERT INTO saathi_chats (id, session_id, saathi_id, student_alias, role, status, created_at)
                VALUES (?, ?, 'saathi-zakwan', 'Student_A', 'PRIMARY', 'ACTIVE', ?)
            """, (target_chat_id, "sess-test-auth", now_iso))
            conn.commit()
            conn.close()

        r_reply = client.post(
            f"/api/saathi/inbox/chat/{target_chat_id}/reply",
            headers={"Authorization": f"Bearer {saathi_token}"},
            json={"text": "Hey, Zakwan here! Take a breath, we can solve this problem together."}
        )
        assert r_reply.status_code == 200
        reply_data = r_reply.json()
        assert reply_data["sender"] == "saathi"
        assert "Zakwan here" in reply_data["text"]

        # Verify student sees it in thread
        r_student_view = client.get(f"/api/saathi/chat/{target_chat_id}")
        assert r_student_view.status_code == 200
        msgs = r_student_view.json()
        assert any(m["text"] == "Hey, Zakwan here! Take a breath, we can solve this problem together." for m in msgs)
    test("POST /api/saathi/inbox/chat/{chat_id}/reply (Real Human Saathi Reply)", test_saathi_human_reply)

    # 31. Web Portal: GET /dev-inbox
    def test_dev_inbox_portal():
        r = client.get("/dev-inbox")
        assert r.status_code == 200
        assert "Saathi Portal" in r.text
        assert "zakwan" in r.text
    test("GET /dev-inbox (Interactive Web Portal HTML)", test_dev_inbox_portal)

    print("\n" + "=" * 80)
    print(f" ALL {passed}/{total} BACKEND ROUTES TESTED & FUNCTIONING FLAWLESSLY!")
    print("=" * 80)

if __name__ == "__main__":
    run_route_tests()
