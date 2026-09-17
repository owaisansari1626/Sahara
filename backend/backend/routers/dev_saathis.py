import json
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import HTMLResponse

from backend.database import get_db_connection
from backend.schemas import (
    SaathiLoginRequest,
    SaathiLoginResponse,
    SaathiMeResponse,
    DevSaathiChatSummary,
    DevSaathiReplyRequest,
    SaathiMessageResponse,
    VibeTag,
    ColorScheme
)
from backend.services.auth_service import (
    verify_password,
    create_saathi_token,
    get_current_saathi
)

router = APIRouter()

# ---------------------------------------------------------------------------
# Saathi Authentication Endpoints
# ---------------------------------------------------------------------------

@router.post("/api/saathi/auth/login", response_model=SaathiLoginResponse)
def saathi_login(req: SaathiLoginRequest):
    username = (req.username or "").strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT sa.saathi_id, sa.username, sa.password_hash, sa.salt,
               s.name, s.alias, s.avatar_seed, s.vibe_tags, s.color_scheme
        FROM saathi_auth sa
        JOIN saathis s ON sa.saathi_id = s.id
        WHERE LOWER(sa.username) = ?
    """, (username,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    if not verify_password(req.password, row["password_hash"], row["salt"]):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    token = create_saathi_token(saathi_id=row["saathi_id"], username=row["username"], expires_in_days=7)

    return SaathiLoginResponse(
        token=token,
        saathi_id=row["saathi_id"],
        name=row["name"],
        alias=row["alias"] or row["name"],
        avatarSeed=row["avatar_seed"] or "Saathi",
        vibeTags=json.loads(row["vibe_tags"] or "[]"),
        colorScheme=json.loads(row["color_scheme"] or "{}")
    )


@router.get("/api/saathi/auth/me", response_model=SaathiMeResponse)
def saathi_get_me(current_saathi: dict = Depends(get_current_saathi)):
    return SaathiMeResponse(
        saathi_id=current_saathi["id"],
        name=current_saathi["name"],
        alias=current_saathi["alias"] or current_saathi["name"],
        year=current_saathi["year"] or "",
        field=current_saathi["field"] or "",
        avatarSeed=current_saathi["avatar_seed"] or "Saathi",
        vibeTags=json.loads(current_saathi["vibe_tags"] or "[]"),
        colorScheme=json.loads(current_saathi["color_scheme"] or "{}"),
        currentLoad=current_saathi.get("current_load", 0),
        maxCapacity=current_saathi.get("max_capacity", 10)
    )


# ---------------------------------------------------------------------------
# Authenticated Saathi Inbox Endpoints
# ---------------------------------------------------------------------------

@router.get("/api/saathi/inbox/chats", response_model=List[DevSaathiChatSummary])
def get_saathi_inbox_chats(scope: Optional[str] = "my", current_saathi: dict = Depends(get_current_saathi)):
    """
    Returns student chat channels.
    scope="my": Only chats assigned to the logged-in Saathi.
    scope="all": All active student conversations across all Saathis (team view).
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    if scope == "all":
        cursor.execute("""
            SELECT sc.id as chat_id, sc.session_id, sc.student_alias, sc.role, sc.status, sc.created_at,
                   s.inferred_tags, sc.saathi_id, st.name as saathi_name, st.alias as saathi_alias
            FROM saathi_chats sc
            LEFT JOIN sessions s ON sc.session_id = s.session_id
            LEFT JOIN saathis st ON sc.saathi_id = st.id
            WHERE sc.status = 'ACTIVE'
            ORDER BY COALESCE(
                (SELECT MAX(created_at) FROM saathi_messages sm WHERE sm.saathi_chat_id = sc.id),
                sc.created_at
            ) DESC
        """)
    else:
        cursor.execute("""
            SELECT sc.id as chat_id, sc.session_id, sc.student_alias, sc.role, sc.status, sc.created_at,
                   s.inferred_tags, sc.saathi_id, st.name as saathi_name, st.alias as saathi_alias
            FROM saathi_chats sc
            LEFT JOIN sessions s ON sc.session_id = s.session_id
            LEFT JOIN saathis st ON sc.saathi_id = st.id
            WHERE sc.saathi_id = ? AND sc.status = 'ACTIVE'
            ORDER BY COALESCE(
                (SELECT MAX(created_at) FROM saathi_messages sm WHERE sm.saathi_chat_id = sc.id),
                sc.created_at
            ) DESC
        """, (current_saathi["id"],))
    chats = cursor.fetchall()

    results = []
    for c in chats:
        # Get latest message
        cursor.execute("""
            SELECT sender, text, timestamp, created_at
            FROM saathi_messages
            WHERE saathi_chat_id = ?
            ORDER BY created_at DESC
            LIMIT 1
        """, (c["chat_id"],))
        last_msg = cursor.fetchone()

        # Count total messages
        cursor.execute("""
            SELECT COUNT(*) FROM saathi_messages WHERE saathi_chat_id = ?
        """, (c["chat_id"],))
        msg_count = cursor.fetchone()[0]

        matched_tags = []
        try:
            matched_tags = json.loads(c["inferred_tags"] or "[]")
        except Exception:
            matched_tags = []

        results.append(DevSaathiChatSummary(
            chat_id=c["chat_id"],
            session_id=c["session_id"],
            student_alias=c["student_alias"] or "Student",
            role=c["role"] or "PRIMARY",
            status=c["status"] or "ACTIVE",
            assigned_saathi_alias=c["saathi_alias"],
            assigned_saathi_name=c["saathi_name"],
            matched_tags=matched_tags,
            last_message_text=last_msg["text"] if last_msg else None,
            last_message_sender=last_msg["sender"] if last_msg else None,
            last_message_timestamp=last_msg["timestamp"] if last_msg else None,
            total_messages=msg_count
        ))

    conn.close()
    return results


@router.get("/api/saathi/inbox/chat/{chat_id}", response_model=List[SaathiMessageResponse])
def get_saathi_inbox_messages(chat_id: str, current_saathi: dict = Depends(get_current_saathi)):
    """
    Fetches chronological message history for a chat channel.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT saathi_id FROM saathi_chats WHERE id = ?", (chat_id,))
    chat_row = cursor.fetchone()
    if not chat_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Chat channel not found.")

    cursor.execute("""
        SELECT id, saathi_chat_id, sender, text, timestamp
        FROM saathi_messages
        WHERE saathi_chat_id = ?
        ORDER BY created_at ASC
    """, (chat_id,))
    rows = cursor.fetchall()
    conn.close()

    return [
        SaathiMessageResponse(
            id=r["id"],
            saathi_chat_id=r["saathi_chat_id"],
            sender=r["sender"],
            text=r["text"],
            timestamp=r["timestamp"]
        )
        for r in rows
    ]


@router.post("/api/saathi/inbox/chat/{chat_id}/reply", response_model=SaathiMessageResponse)
def post_saathi_inbox_reply(chat_id: str, req: DevSaathiReplyRequest, current_saathi: dict = Depends(get_current_saathi)):
    """
    Posts a human reply from the authenticated Saathi to the student.
    """
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Message text cannot be empty.")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT saathi_id FROM saathi_chats WHERE id = ?", (chat_id,))
    chat_row = cursor.fetchone()
    if not chat_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Chat channel not found.")

    msg_id = f"smsg-{uuid.uuid4().hex[:8]}"
    now_time = datetime.now().strftime("%I:%M %p")

    cursor.execute("""
        INSERT INTO saathi_messages (id, saathi_chat_id, sender, text, timestamp)
        VALUES (?, ?, 'saathi', ?, ?)
    """, (msg_id, chat_id, req.text.strip(), now_time))

    conn.commit()
    conn.close()

    return SaathiMessageResponse(
        id=msg_id,
        saathi_chat_id=chat_id,
        sender="saathi",
        text=req.text.strip(),
        timestamp=now_time
    )


# ---------------------------------------------------------------------------
# Interactive Web Portal for Developers (/dev-inbox & /saathi-portal)
# ---------------------------------------------------------------------------

@router.get("/dev-inbox", response_class=HTMLResponse)
@router.get("/saathi-portal", response_class=HTMLResponse)
def serve_dev_inbox():
    """
    Delivers a self-contained, responsive Web Inbox for Zakwan, Saifullah, Riyaz, and Samiiksha
    to log in, review assigned student chats, and respond live from mobile or desktop.
    """
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sahara — Saathi Peer Supporter Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0B1015;
      --card-bg: #141C24;
      --card-border: #22303E;
      --primary: #2DD4BF;
      --primary-hover: #14B8A6;
      --text: #F1F5F9;
      --text-muted: #94A3B8;
      --user-msg: #1E293B;
      --saathi-msg: #134E4A;
      --badge-bg: #1E2D3B;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background-color: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; }
    header { background: var(--card-bg); border-bottom: 1px solid var(--card-border); padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; }
    .logo { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1.1rem; color: var(--primary); }
    .badge { background: #134E4A; color: #5EEAD4; font-size: 0.72rem; padding: 3px 8px; border-radius: 20px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .user-pill { display: flex; align-items: center; gap: 8px; background: var(--badge-bg); padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; }
    .logout-btn { background: transparent; border: 1px solid #475569; color: #CBD5E1; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; margin-left: 8px; }
    .logout-btn:hover { background: #334155; }

    /* Auth Screen */
    #auth-screen { flex: 1; display: flex; justify-content: center; align-items: center; padding: 20px; }
    .auth-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; padding: 32px; width: 100%; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .auth-card h2 { font-size: 1.4rem; margin-bottom: 8px; }
    .auth-card p { font-size: 0.88rem; color: var(--text-muted); margin-bottom: 24px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 6px; color: #CBD5E1; }
    .form-group input, .form-group select { width: 100%; padding: 10px 14px; background: #0F1720; border: 1px solid var(--card-border); border-radius: 8px; color: var(--text); font-size: 0.95rem; outline: none; }
    .form-group input:focus { border-color: var(--primary); }
    .btn-login { width: 100%; padding: 12px; background: var(--primary); color: #042F2E; border: none; border-radius: 8px; font-weight: 700; font-size: 0.95rem; cursor: pointer; margin-top: 8px; transition: background 0.2s; }
    .btn-login:hover { background: var(--primary-hover); }
    .auth-err { color: #F87171; font-size: 0.82rem; margin-top: 10px; text-align: center; }

    /* App Screen Layout */
    #app-screen { flex: 1; display: none; height: calc(100vh - 61px); }
    .sidebar { width: 340px; background: var(--card-bg); border-right: 1px solid var(--card-border); display: flex; flex-direction: column; height: 100%; }
    .sidebar-header { padding: 16px; border-bottom: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center; }
    .sidebar-header h3 { font-size: 0.95rem; font-weight: 700; color: #CBD5E1; text-transform: uppercase; letter-spacing: 0.5px; }
    .chat-list { flex: 1; overflow-y: auto; }
    .chat-item { padding: 14px 16px; border-bottom: 1px solid #1A242E; cursor: pointer; transition: background 0.15s; }
    .chat-item:hover { background: #18222D; }
    .chat-item.active { background: #1C2836; border-left: 3px solid var(--primary); }
    .chat-item-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .student-alias { font-weight: 600; font-size: 0.92rem; }
    .chat-time { font-size: 0.72rem; color: var(--text-muted); }
    .last-msg { font-size: 0.82rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tag-pills { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; }
    .tag-pill { font-size: 0.68rem; background: #0F172A; border: 1px solid #334155; padding: 2px 6px; border-radius: 4px; color: #94A3B8; }

    /* Chat Area */
    .main-chat { flex: 1; display: flex; flex-direction: column; background: #0B1015; height: 100%; }
    .main-chat-header { padding: 14px 20px; background: var(--card-bg); border-bottom: 1px solid var(--card-border); display: flex; align-items: center; justify-content: space-between; }
    .chat-title-group h4 { font-size: 1rem; font-weight: 600; }
    .chat-title-group span { font-size: 0.78rem; color: var(--text-muted); }
    .messages-area { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .empty-state { margin: auto; text-align: center; color: var(--text-muted); font-size: 0.92rem; }
    
    .msg-bubble { max-width: 70%; padding: 10px 14px; border-radius: 12px; font-size: 0.9rem; line-height: 1.45; position: relative; }
    .msg-bubble.student { align-self: flex-start; background: var(--user-msg); border: 1px solid #334155; border-bottom-left-radius: 2px; }
    .msg-bubble.saathi { align-self: flex-end; background: var(--saathi-msg); border: 1px solid #115E59; color: #F0FDFA; border-bottom-right-radius: 2px; }
    .msg-time { font-size: 0.68rem; opacity: 0.7; margin-top: 4px; text-align: right; }

    .input-area { padding: 16px 20px; background: var(--card-bg); border-top: 1px solid var(--card-border); display: flex; gap: 12px; align-items: center; }
    .input-area input { flex: 1; padding: 12px 16px; background: #0F1720; border: 1px solid var(--card-border); border-radius: 8px; color: var(--text); font-size: 0.95rem; outline: none; }
    .input-area input:focus { border-color: var(--primary); }
    .btn-send { padding: 12px 20px; background: var(--primary); color: #042F2E; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: background 0.15s; }
    .btn-send:hover { background: var(--primary-hover); }

    .tab-btn { background: #0F1720; border: 1px solid var(--card-border); color: var(--text-muted); padding: 5px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .tab-btn.active { background: var(--primary); color: #042F2E; border-color: var(--primary); }

    @media (max-width: 768px) {
      .sidebar { width: 100%; }
      #app-screen.in-chat .sidebar { display: none; }
      #app-screen.in-chat .main-chat { display: flex; }
      #app-screen:not(.in-chat) .main-chat { display: none; }
    }
  </style>
</head>
<body>
  <header>
    <div class="logo">
      <span>🌿 सहारा Sahara</span>
      <span class="badge">Saathi Portal</span>
    </div>
    <div id="header-user" style="display: none;">
      <div class="user-pill">
        <span id="user-display-name">Zakwan</span>
        <button class="logout-btn" onclick="logout()">Logout</button>
      </div>
    </div>
  </header>

  <!-- Login Screen -->
  <div id="auth-screen">
    <div class="auth-card">
      <h2>Saathi Login</h2>
      <p>Sign in to access your assigned peer conversations.</p>
      <form id="login-form" onsubmit="handleLogin(event)">
        <div class="form-group">
          <label>Developer Identity</label>
          <select id="username-select" onchange="document.getElementById('username-input').value = this.value">
            <option value="zakwan">Zakwan (Exam & Tech Stress)</option>
            <option value="saifullah">Saifullah (Career & Expectations)</option>
            <option value="riyaz">Riyaz (Late-Night & Sleep)</option>
            <option value="samiiksha">Samiiksha (Campus & Transition)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Username</label>
          <input type="text" id="username-input" value="zakwan" required>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="password-input" value="SaharaPeer2025!" required>
        </div>
        <button type="submit" class="btn-login" id="login-btn">Sign In as Saathi</button>
        <div class="auth-err" id="login-err"></div>
      </form>
    </div>
  </div>

  <!-- Main Inbox Screen -->
  <div id="app-screen">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div style="display: flex; gap: 6px;">
          <button id="tab-my" class="tab-btn active" onclick="setScope('my')">My Chats</button>
          <button id="tab-all" class="tab-btn" onclick="setScope('all')">All Chats</button>
        </div>
        <button onclick="fetchChats()" style="background:transparent; border:none; color:var(--primary); cursor:pointer; font-size:0.82rem;" title="Refresh">↻</button>
      </div>
      <div class="chat-list" id="chat-list">
        <div class="empty-state" style="padding: 40px 10px;">Loading conversations...</div>
      </div>
    </aside>

    <main class="main-chat">
      <div class="main-chat-header" id="chat-header">
        <div class="chat-title-group">
          <h4 id="active-student-title">Select a student</h4>
          <span id="active-student-subtitle">Choose a chat from the left to read and reply</span>
        </div>
      </div>

      <div class="messages-area" id="messages-area">
        <div class="empty-state">No conversation selected.</div>
      </div>

      <div class="input-area" id="input-container" style="display: none;">
        <input type="text" id="reply-input" placeholder="Type your empathetic peer response..." onkeydown="if(event.key==='Enter') sendReply()">
        <button class="btn-send" onclick="sendReply()">Send</button>
      </div>
    </main>
  </div>

  <script>
    let currentToken = localStorage.getItem("saathi_token") || "";
    let activeChatId = null;
    let refreshTimer = null;
    let currentScope = "my";

    function setScope(scope) {
      currentScope = scope;
      document.getElementById("tab-my").classList.toggle("active", scope === "my");
      document.getElementById("tab-all").classList.toggle("active", scope === "all");
      fetchChats();
    }

    async function checkAuth() {
      if (!currentToken) {
        showAuth();
        return;
      }
      try {
        const res = await fetch("/api/saathi/auth/me", {
          headers: { "Authorization": `Bearer ${currentToken}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        document.getElementById("user-display-name").textContent = `${data.name} (${data.alias})`;
        showApp();
        fetchChats();
      } catch (e) {
        logout();
      }
    }

    function showAuth() {
      document.getElementById("auth-screen").style.display = "flex";
      document.getElementById("app-screen").style.display = "none";
      document.getElementById("header-user").style.display = "none";
      if (refreshTimer) clearInterval(refreshTimer);
    }

    function showApp() {
      document.getElementById("auth-screen").style.display = "none";
      document.getElementById("app-screen").style.display = "flex";
      document.getElementById("header-user").style.display = "block";
      if (!refreshTimer) refreshTimer = setInterval(pollActiveChat, 3000);
    }

    async function handleLogin(e) {
      e.preventDefault();
      const errEl = document.getElementById("login-err");
      errEl.textContent = "";
      const username = document.getElementById("username-input").value;
      const password = document.getElementById("password-input").value;
      const btn = document.getElementById("login-btn");
      btn.disabled = true;
      btn.textContent = "Signing in...";

      try {
        const res = await fetch("/api/saathi/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) {
          errEl.textContent = data.detail || "Authentication failed.";
          btn.disabled = false;
          btn.textContent = "Sign In as Saathi";
          return;
        }
        currentToken = data.token;
        localStorage.setItem("saathi_token", currentToken);
        document.getElementById("user-display-name").textContent = `${data.name} (${data.alias})`;
        showApp();
        fetchChats();
      } catch (err) {
        errEl.textContent = "Network error. Please try again.";
      } finally {
        btn.disabled = false;
        btn.textContent = "Sign In as Saathi";
      }
    }

    function logout() {
      currentToken = "";
      activeChatId = null;
      localStorage.removeItem("saathi_token");
      showAuth();
    }

    async function fetchChats() {
      if (!currentToken) return;
      try {
        const res = await fetch(`/api/saathi/inbox/chats?scope=${currentScope}`, {
          headers: { "Authorization": `Bearer ${currentToken}` }
        });
        if (!res.ok) return;
        const chats = await res.json();
        renderChatList(chats);
      } catch (e) {}
    }

    function renderChatList(chats) {
      const listEl = document.getElementById("chat-list");
      if (!chats.length) {
        listEl.innerHTML = `<div class="empty-state" style="padding: 40px 10px;">${currentScope === 'my' ? 'No chats assigned to you right now. Click "All Chats" above to see campus conversations!' : 'No active student conversations yet.'}</div>`;
        return;
      }
      listEl.innerHTML = chats.map(c => `
        <div class="chat-item ${c.chat_id === activeChatId ? 'active' : ''}" onclick="selectChat('${c.chat_id}', '${escapeHtml(c.student_alias)}', '${escapeHtml(c.assigned_saathi_name || c.assigned_saathi_alias || '')}', '${c.role}')">
          <div class="chat-item-header">
            <span class="student-alias">${escapeHtml(c.student_alias)}</span>
            <span class="chat-time">${c.last_message_timestamp || ''}</span>
          </div>
          <div class="last-msg"><strong>${c.last_message_sender === 'saathi' ? 'You: ' : (c.last_message_sender === 'student' ? 'Student: ' : '')}</strong>${escapeHtml(c.last_message_text || 'No messages yet')}</div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
            <div class="tag-pills">
              ${c.matched_tags.map(t => `<span class="tag-pill">${escapeHtml(t)}</span>`).join('')}
            </div>
            <span style="font-size:0.68rem; color:var(--text-muted); background:var(--surface-border); padding:2px 6px; border-radius:4px;">
              ${escapeHtml(c.assigned_saathi_name || c.assigned_saathi_alias || 'Peer')} (${c.role})
            </span>
          </div>
        </div>
      `).join('');
    }

    async function selectChat(chatId, alias, saathiName, role) {
      activeChatId = chatId;
      document.getElementById("app-screen").classList.add("in-chat");
      document.getElementById("active-student-title").textContent = `Chat with ${alias}`;
      document.getElementById("active-student-subtitle").textContent = `${chatId} • Assigned to ${saathiName || 'Saathi'} (${role || 'PRIMARY'})`;
      document.getElementById("input-container").style.display = "flex";
      fetchChats();
      await loadMessages(chatId);
    }

    async function loadMessages(chatId) {
      if (!chatId) return;
      try {
        const res = await fetch(`/api/saathi/inbox/chat/${chatId}`, {
          headers: { "Authorization": `Bearer ${currentToken}` }
        });
        if (!res.ok) return;
        const messages = await res.json();
        renderMessages(messages);
      } catch (e) {}
    }

    function renderMessages(messages) {
      const container = document.getElementById("messages-area");
      if (!messages.length) {
        container.innerHTML = '<div class="empty-state">No messages yet. Send an encouraging intro!</div>';
        return;
      }
      const wasAtBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) < 60;
      container.innerHTML = messages.map(m => `
        <div class="msg-bubble ${m.sender}">
          <div style="font-size:0.72rem; opacity:0.8; margin-bottom:2px; font-weight:600;">${m.sender === 'saathi' ? 'Peer Saathi' : 'Student'}</div>
          <div>${escapeHtml(m.text)}</div>
          <div class="msg-time">${m.timestamp}</div>
        </div>
      `).join('');
      if (wasAtBottom || messages.length <= 4) {
        container.scrollTop = container.scrollHeight;
      }
    }

    async function pollActiveChat() {
      await fetchChats();
      if (activeChatId) {
        await loadMessages(activeChatId);
      }
    }

    async function sendReply() {
      const input = document.getElementById("reply-input");
      const text = input.value.trim();
      if (!text || !activeChatId) return;
      input.value = "";
      try {
        const res = await fetch(`/api/saathi/inbox/chat/${activeChatId}/reply`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentToken}`
          },
          body: JSON.stringify({ text })
        });
        if (res.ok) {
          await loadMessages(activeChatId);
          fetchChats();
        }
      } catch (e) {}
    }

    function escapeHtml(str) {
      return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    // Init check
    checkAuth();
  </script>
</body>
</html>"""
