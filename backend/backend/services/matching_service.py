import json
import uuid
import random
from datetime import datetime
from typing import List, Optional, Dict, Any
from backend.database import get_db_connection
from backend.schemas import (
    SaathiAssignment,
    SaathiMatchResponse,
    PeerRedirectInfo,
    VibeTag,
    ColorScheme
)

DOMAIN_METADATA: Dict[str, Dict[str, Any]] = {
    "exam_period": {
        "label": "Exam & Performance Pressure",
        "reason": "Specialized in coping with exam anxiety and study balance"
    },
    "academic_stress": {
        "label": "Academic Workload & Deadlines",
        "reason": "Experienced with heavy course loads and sprint deadlines"
    },
    "sleep_issues": {
        "label": "Sleep & Restlessness",
        "reason": "Specialized in late-night grounding and sleep struggles"
    },
    "night_owl": {
        "label": "Late-Night Overthinking",
        "reason": "Available during late hours for calm listening and resets"
    },
    "isolation": {
        "label": "Hostel Transition & Campus Loneliness",
        "reason": "Specialized in hostel transition and overcoming campus isolation"
    },
    "family_stress": {
        "label": "Family Expectations & Pressure",
        "reason": "Navigated high family expectations and parental pressure"
    },
    "relationship_stress": {
        "label": "Relationship Dynamics",
        "reason": "Compassionate listener for interpersonal and relationship stress"
    }
}

def get_or_create_dual_saathi_match(session_id: str, tags: Optional[List[str]] = None, student_message: Optional[str] = None) -> SaathiMatchResponse:
    """
    Finds or creates a dual-Saathi pairing (PRIMARY and SECONDARY) for the given session.
    Idempotent: If active chats already exist for this session, returns the existing assignments
    without creating redundant chats or double-incrementing Saathi load.
    Also forwards the initial student message so the dev Saathi sees it immediately.
    """
    session_id = session_id.strip() if (session_id and session_id.strip()) else f"sess-{uuid.uuid4()}"
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Check for existing ACTIVE chats for this session
    cursor.execute("""
        SELECT sc.id as chat_id, sc.role, sc.status, sc.saathi_id, s.alias, s.vibe_tags,
               s.avatar_seed, s.color_scheme, sm.text as intro_message
        FROM saathi_chats sc
        JOIN saathis s ON sc.saathi_id = s.id
        LEFT JOIN saathi_messages sm ON sm.saathi_chat_id = sc.id AND sm.sender = 'saathi'
        WHERE sc.session_id = ? AND sc.status = 'ACTIVE'
        ORDER BY sc.created_at ASC
    """, (session_id,))
    existing_chats = cursor.fetchall()

    if len(existing_chats) >= 2:
        primary_chat = next((c for c in existing_chats if c["role"] == "PRIMARY"), existing_chats[0])
        secondary_chat = next((c for c in existing_chats if c["role"] == "SECONDARY"), existing_chats[1])
        if student_message and student_message.strip():
            cursor.execute("SELECT text FROM saathi_messages WHERE saathi_chat_id = ? ORDER BY created_at DESC LIMIT 1", (primary_chat["chat_id"],))
            last_m = cursor.fetchone()
            if not last_m or last_m["text"] != student_message.strip():
                now_time = datetime.now().strftime("%I:%M %p")
                cursor.execute("""
                    INSERT INTO saathi_messages (id, saathi_chat_id, sender, text, timestamp)
                    VALUES (?, ?, 'student', ?, ?)
                """, (f"smsg-{uuid.uuid4().hex[:8]}", primary_chat["chat_id"], student_message.strip(), now_time))
                conn.commit()
        conn.close()
        return SaathiMatchResponse(
            session_id=session_id,
            primary=SaathiAssignment(
                chat_id=primary_chat["chat_id"],
                saathi_id=primary_chat["saathi_id"],
                alias=primary_chat["alias"] or "Saathi",
                role="PRIMARY",
                status=primary_chat["status"],
                intro_message=primary_chat["intro_message"] or "Hey! I'm here for you.",
                vibeTags=json.loads(primary_chat["vibe_tags"] or "[]"),
                avatarSeed=primary_chat["avatar_seed"] or "Saathi",
                colorScheme=json.loads(primary_chat["color_scheme"] or "{}")
            ),
            secondary=SaathiAssignment(
                chat_id=secondary_chat["chat_id"],
                saathi_id=secondary_chat["saathi_id"],
                alias=secondary_chat["alias"] or "Saathi",
                role="SECONDARY",
                status=secondary_chat["status"],
                intro_message=secondary_chat["intro_message"] or "Hi there, I'm here whenever you want to talk.",
                vibeTags=json.loads(secondary_chat["vibe_tags"] or "[]"),
                avatarSeed=secondary_chat["avatar_seed"] or "Saathi",
                colorScheme=json.loads(secondary_chat["color_scheme"] or "{}")
            )
        )

    # 2. Determine session tags
    student_tags = list(tags) if tags else []
    cursor.execute("SELECT inferred_tags FROM sessions WHERE session_id = ?", (session_id,))
    session_row = cursor.fetchone()
    if session_row and session_row["inferred_tags"]:
        try:
            persisted_tags = json.loads(session_row["inferred_tags"])
            student_tags = list(set(student_tags + persisted_tags))
        except Exception:
            pass
    else:
        now_iso = datetime.now().isoformat()
        cursor.execute("INSERT OR IGNORE INTO sessions (session_id, created_at, last_active, inferred_tags) VALUES (?, ?, ?, ?)",
                       (session_id, now_iso, now_iso, json.dumps(student_tags)))

    # 3. Pull available Saathis under capacity
    cursor.execute("SELECT * FROM saathis WHERE current_load < max_capacity")
    available_saathis = cursor.fetchall()
    if len(available_saathis) < 2:
        cursor.execute("SELECT * FROM saathis ORDER BY current_load ASC")
        available_saathis = cursor.fetchall()

    if len(available_saathis) < 2:
        conn.close()
        raise RuntimeError("Not enough peer supporters available.")

    # 4. Score Saathis on vibe tag matching with domain weighting
    scored_candidates = []
    for s in available_saathis:
        vibe_tags_raw = json.loads(s["vibe_tags"] or "[]")
        saathi_tag_keys = set()
        saathi_labels = []
        for vt in vibe_tags_raw:
            if isinstance(vt, dict):
                if vt.get("tag_key"):
                    saathi_tag_keys.add(vt["tag_key"])
                if vt.get("label"):
                    saathi_labels.append(vt["label"].lower())

        score = 0.0
        # Direct tag key overlap
        for t in student_tags:
            if t in saathi_tag_keys:
                score += 3.0
            # Check label matches (e.g. "exam" or "academic" in label)
            t_clean = t.replace("_", " ")
            if any(t_clean in lbl or lbl in t_clean for lbl in saathi_labels):
                score += 1.5

        # Lower load preference (gives slight boost to Saathis with more free capacity)
        cap = s["max_capacity"] or 5
        cur = s["current_load"] or 0
        score += max(0, cap - cur) * 0.1

        # Small random jitter to prevent deterministic de-anonymization
        score += random.uniform(0.0, 0.2)
        scored_candidates.append((score, s))

    scored_candidates.sort(key=lambda x: x[0], reverse=True)
    primary_saathi = scored_candidates[0][1]
    secondary_saathi = scored_candidates[1][1]

    # 5. Provision saathi_chats records
    primary_chat_id = f"schat-{uuid.uuid4().hex[:8]}"
    secondary_chat_id = f"schat-{uuid.uuid4().hex[:8]}"
    now_iso = datetime.now().isoformat()
    now_time = datetime.now().strftime("%I:%M %p")

    cursor.execute("""
        INSERT INTO saathi_chats (id, session_id, saathi_id, student_alias, role, status, consented_history_transfer, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (primary_chat_id, session_id, primary_saathi["id"], "Student", "PRIMARY", "ACTIVE", 0, now_iso))

    cursor.execute("""
        INSERT INTO saathi_chats (id, session_id, saathi_id, student_alias, role, status, consented_history_transfer, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (secondary_chat_id, session_id, secondary_saathi["id"], "Student", "SECONDARY", "ACTIVE", 0, now_iso))

    # Increment current_load
    cursor.execute("UPDATE saathis SET current_load = current_load + 1 WHERE id IN (?, ?)",
                   (primary_saathi["id"], secondary_saathi["id"]))

    # Insert warm initial peer messages (alias only)
    p_alias = primary_saathi["alias"] or "Saathi"
    s_alias = secondary_saathi["alias"] or "Saathi"

    # Contextual greeting if domain tag matches
    domain_mention = ""
    if "exam_period" in student_tags:
        domain_mention = " I know how overwhelming exam and test pressure can get."
    elif "academic_stress" in student_tags:
        domain_mention = " College workload can be completely suffocating."
    elif "sleep_issues" in student_tags or "night_owl" in student_tags:
        domain_mention = " Late nights can be so restless when your mind won't stop running."
    elif "isolation" in student_tags:
        domain_mention = " Campus life can feel surprisingly lonely sometimes."

    p_greeting = f"Hey! I'm {p_alias}.{domain_mention} There is zero pressure here — take your time and vent whatever is on your mind."
    s_greeting = f"Hi there, I'm {s_alias}. I'm here as your secondary peer anchor whenever you'd like to talk."

    cursor.execute("""
        INSERT INTO saathi_messages (id, saathi_chat_id, sender, text, timestamp)
        VALUES (?, ?, ?, ?, ?)
    """, (f"smsg-{uuid.uuid4().hex[:8]}", primary_chat_id, "saathi", p_greeting, now_time))

    cursor.execute("""
        INSERT INTO saathi_messages (id, saathi_chat_id, sender, text, timestamp)
        VALUES (?, ?, ?, ?, ?)
    """, (f"smsg-{uuid.uuid4().hex[:8]}", secondary_chat_id, "saathi", s_greeting, now_time))

    if student_message and student_message.strip():
        cursor.execute("""
            INSERT INTO saathi_messages (id, saathi_chat_id, sender, text, timestamp)
            VALUES (?, ?, 'student', ?, ?)
        """, (f"smsg-{uuid.uuid4().hex[:8]}", primary_chat_id, student_message.strip(), now_time))

    conn.commit()
    conn.close()

    return SaathiMatchResponse(
        session_id=session_id,
        primary=SaathiAssignment(
            chat_id=primary_chat_id,
            saathi_id=primary_saathi["id"],
            alias=p_alias,
            role="PRIMARY",
            status="ACTIVE",
            intro_message=p_greeting,
            vibeTags=json.loads(primary_saathi["vibe_tags"] or "[]"),
            avatarSeed=primary_saathi["avatar_seed"],
            colorScheme=json.loads(primary_saathi["color_scheme"] or "{}")
        ),
        secondary=SaathiAssignment(
            chat_id=secondary_chat_id,
            saathi_id=secondary_saathi["id"],
            alias=s_alias,
            role="SECONDARY",
            status="ACTIVE",
            intro_message=s_greeting,
            vibeTags=json.loads(secondary_saathi["vibe_tags"] or "[]"),
            avatarSeed=secondary_saathi["avatar_seed"],
            colorScheme=json.loads(secondary_saathi["color_scheme"] or "{}")
        )
    )

def evaluate_peer_redirection(session_id: str, inferred_tags: List[str], current_severity: str = "MODERATE", student_message: Optional[str] = None) -> Optional[PeerRedirectInfo]:
    """
    Evaluates whether the student's conversation tags qualify for a peer Saathi redirection offer.
    Returns PeerRedirectInfo if qualified, or None if no domain match or severity is SEVERE.
    """
    # Safety rule: Crisis helplines take strict priority over peer redirection
    if current_severity == "SEVERE":
        return None

    if not inferred_tags:
        return None

    # Priority order of domains: exam/academic -> sleep/night owl -> isolation -> family -> relationship
    priority_order = ["exam_period", "academic_stress", "sleep_issues", "night_owl", "isolation", "family_stress", "relationship_stress"]
    primary_domain = None
    for d in priority_order:
        if d in inferred_tags:
            primary_domain = d
            break

    if not primary_domain:
        primary_domain = inferred_tags[0]

    domain_meta = DOMAIN_METADATA.get(primary_domain, {
        "label": primary_domain.replace("_", " ").title(),
        "reason": f"Specialized in peer support for {primary_domain.replace('_', ' ')}"
    })

    try:
        match = get_or_create_dual_saathi_match(session_id, inferred_tags, student_message=student_message)
    except Exception:
        return None

    p_alias = match.primary.alias
    handoff_text = f"You don't have to carry this alone. I've matched you with {p_alias}, who specializes in {domain_meta['label'].lower()} and is available to talk right now."

    return PeerRedirectInfo(
        shouldRedirect=True,
        matchedDomain=primary_domain,
        domainLabel=domain_meta["label"],
        matchReason=domain_meta["reason"],
        action="OFFER",
        matchedSaathi=match.primary,
        secondarySaathi=match.secondary,
        handoffText=handoff_text
    )
