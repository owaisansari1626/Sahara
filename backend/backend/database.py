import sqlite3
import json
import os
from datetime import datetime
from backend.config import settings

def get_db_connection():
    os.makedirs(os.path.dirname(settings.DATABASE_FILE), exist_ok=True)
    conn = sqlite3.connect(settings.DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Sessions table (with inferred tags)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            created_at TEXT,
            last_active TEXT,
            inferred_tags TEXT DEFAULT '[]'
        )
    ''')

    # Chat messages table (Sahara AI companion)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            session_id TEXT,
            sender TEXT,
            text TEXT,
            severity TEXT,
            timestamp TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Check-ins table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS checkins (
            id TEXT PRIMARY KEY,
            session_id TEXT,
            mood TEXT,
            energy INTEGER,
            stressor TEXT,
            note TEXT,
            timestamp TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Saathis peer supporters table (privacy-hardened with alias and capacity limits)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS saathis (
            id TEXT PRIMARY KEY,
            name TEXT,
            alias TEXT,
            year TEXT,
            field TEXT,
            college_type TEXT,
            vibe_tags TEXT,
            bio TEXT,
            availability TEXT,
            languages TEXT,
            badges TEXT,
            avatar_seed TEXT,
            color_scheme TEXT,
            max_capacity INTEGER DEFAULT 5,
            current_load INTEGER DEFAULT 0
        )
    ''')

    # Saathi peer chats (dual-Saathi model with PRIMARY/SECONDARY role and status)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS saathi_chats (
            id TEXT PRIMARY KEY,
            session_id TEXT,
            saathi_id TEXT,
            student_alias TEXT,
            role TEXT DEFAULT 'PRIMARY',
            status TEXT DEFAULT 'ACTIVE',
            consented_history_transfer INTEGER DEFAULT 0,
            transition_notice_date TEXT,
            created_at TEXT
        )
    ''')

    # Saathi peer messages
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS saathi_messages (
            id TEXT PRIMARY KEY,
            saathi_chat_id TEXT,
            sender TEXT,
            text TEXT,
            timestamp TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Counsellors table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS counsellors (
            id TEXT PRIMARY KEY,
            name TEXT,
            credentials TEXT,
            title TEXT,
            specializations TEXT,
            experience TEXT,
            languages TEXT,
            fee TEXT,
            modalities TEXT,
            next_slot TEXT,
            verified INTEGER,
            avatar_seed TEXT
        )
    ''')

    # Appointments table - Isolated PII storage, completely decoupled from sessions & chat history
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            counsellor_id TEXT,
            counsellor_name TEXT,
            student_name TEXT,
            student_email TEXT,
            modality TEXT,
            selected_slot TEXT,
            notes TEXT,
            status TEXT,
            created_at TEXT
        )
    ''')

    # Crisis helplines
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS crisis_helplines (
            id TEXT PRIMARY KEY,
            name TEXT,
            number TEXT,
            description TEXT,
            type TEXT
        )
    ''')

    # Coping tools
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS coping_tools (
            id TEXT PRIMARY KEY,
            title TEXT,
            duration TEXT,
            tag TEXT,
            description TEXT,
            category TEXT
        )
    ''')

    # Campus analytics
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS campus_analytics (
            id INTEGER PRIMARY KEY DEFAULT 1,
            data_json TEXT
        )
    ''')

    # Saathi Authentication table for developer peer supporters
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS saathi_auth (
            saathi_id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            password_hash TEXT,
            salt TEXT,
            created_at TEXT
        )
    ''')

    # Safe column migrations for existing SQLite database files
    _ensure_column(cursor, "sessions", "inferred_tags", "TEXT DEFAULT '[]'")
    _ensure_column(cursor, "saathis", "alias", "TEXT")
    _ensure_column(cursor, "saathis", "max_capacity", "INTEGER DEFAULT 10")
    _ensure_column(cursor, "saathis", "current_load", "INTEGER DEFAULT 0")
    _ensure_column(cursor, "saathi_chats", "role", "TEXT DEFAULT 'PRIMARY'")
    _ensure_column(cursor, "saathi_chats", "consented_history_transfer", "INTEGER DEFAULT 0")
    _ensure_column(cursor, "saathi_chats", "transition_notice_date", "TEXT")

    conn.commit()
    
    # Seed data if empty or update missing fields
    seed_db(conn)
    conn.close()

def _ensure_column(cursor, table_name: str, column_name: str, column_def: str):
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [row[1] for row in cursor.fetchall()]
    if column_name not in columns:
        cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_def}")

def seed_db(conn):
    cursor = conn.cursor()

    from backend.services.auth_service import hash_password

    # The 4 Real Developer Saathi Profiles
    dev_saathis = [
        (
            'saathi-zakwan',
            'Zakwan',
            'Zak_TechAnchor_23',
            'Final Year',
            'Software Systems & Tech',
            'Tech University',
            json.dumps([
                {'icon': '💻', 'label': 'Engineering & coding stress', 'tag_key': 'academic_stress'},
                {'icon': '📚', 'label': 'Exam sprint & panic', 'tag_key': 'exam_period'},
                {'icon': '🌙', 'label': 'Late-night overthinking', 'tag_key': 'night_owl'},
                {'icon': '☕', 'label': 'Coffee & calm listener', 'tag_key': 'sleep_issues'}
            ]),
            'Developer and final-year engineer. Been through brutal exam seasons, sprint burnout, and late-night panic. Here to listen without judgment.',
            'Available today',
            json.dumps(['English', 'Hindi', 'Urdu']),
            json.dumps(['Founding Peer Supporter', 'Exam & Tech Stress Anchor', 'Active Listener']),
            'Zakwan',
            json.dumps({
                'bg': 'bg-[#EBF2EA]',
                'border': 'border-[#9BAE91]',
                'badgeBg': 'bg-[#DCE5D4]',
                'text': 'text-[#173F2A]'
            }),
            10,
            0
        ),
        (
            'saathi-saifullah',
            'Saifullah',
            'Saif_Pacer_22',
            '3rd Year',
            'Computer Science & Economics',
            'State University',
            json.dumps([
                {'icon': '⚡', 'label': 'Exam & performance pressure', 'tag_key': 'academic_stress'},
                {'icon': '📈', 'label': 'Career & placement anxiety', 'tag_key': 'exam_period'},
                {'icon': '🏠', 'label': 'Family expectations', 'tag_key': 'family_stress'},
                {'icon': '🎧', 'label': 'Chill listener', 'tag_key': 'isolation'}
            ]),
            'Balancing academic rigor, family expectations, and placement dread. If you need to unpack pressure without feeling judged, let\'s talk.',
            'Available today',
            json.dumps(['English', 'Hindi', 'Urdu']),
            json.dumps(['Founding Peer Supporter', 'Placement & Expectation Peer']),
            'Saifullah',
            json.dumps({
                'bg': 'bg-[#F4ECE1]',
                'border': 'border-[#D8C7B0]',
                'badgeBg': 'bg-[#EDE8DA]',
                'text': 'text-[#173F2A]'
            }),
            10,
            0
        ),
        (
            'saathi-riyaz',
            'Riyaz',
            'Riyaz_NightOwl_22',
            '3rd Year',
            'Information Technology',
            'National Institute',
            json.dumps([
                {'icon': '🌙', 'label': 'Late-night overthinking', 'tag_key': 'night_owl'},
                {'icon': '💤', 'label': 'Sleep & insomnia struggles', 'tag_key': 'sleep_issues'},
                {'icon': '🌿', 'label': 'Calm grounding', 'tag_key': 'isolation'},
                {'icon': '🎮', 'label': 'Casual gaming & venting', 'tag_key': 'academic_stress'}
            ]),
            'The 3 AM thoughts hit hardest when the hostel gets quiet. Always up late, happy to listen and help you decompress your mind.',
            'Available tonight (10 PM - 3 AM)',
            json.dumps(['English', 'Hindi', 'Urdu']),
            json.dumps(['Founding Peer Supporter', 'Late-Night Support Specialist']),
            'Riyaz',
            json.dumps({
                'bg': 'bg-[#F2EBEF]',
                'border': 'border-[#D4BDCB]',
                'badgeBg': 'bg-[#E8DAE2]',
                'text': 'text-[#173F2A]'
            }),
            10,
            0
        ),
        (
            'saathi-samiiksha',
            'Samiiksha',
            'Sami_QuietAnchor_23',
            '3rd Year',
            'Data Sciences & Design',
            'Liberal Arts & Tech Institute',
            json.dumps([
                {'icon': '🌿', 'label': 'Hostel transition & loneliness', 'tag_key': 'isolation'},
                {'icon': '💭', 'label': 'Interpersonal & relationship stress', 'tag_key': 'relationship_stress'},
                {'icon': '🎨', 'label': 'Creative mindful grounding', 'tag_key': 'family_stress'},
                {'icon': '📖', 'label': 'First-year & campus adaptation', 'tag_key': 'academic_stress'}
            ]),
            'Knows how intimidating campus transitions and feeling like an outsider can be. Warm, patient listener who will hold safe space for your thoughts.',
            'Available this afternoon & evening',
            json.dumps(['English', 'Hindi', 'Marathi']),
            json.dumps(['Founding Peer Supporter', 'Campus Transition Specialist']),
            'Samiiksha',
            json.dumps({
                'bg': 'bg-[#E8EFF2]',
                'border': 'border-[#B4CCD8]',
                'badgeBg': 'bg-[#D6E6ED]',
                'text': 'text-[#173F2A]'
            }),
            10,
            0
        )
    ]

    # Insert or update the 4 developer Saathis
    for s in dev_saathis:
        cursor.execute("SELECT id FROM saathis WHERE id = ?", (s[0],))
        exists = cursor.fetchone()
        if not exists:
            cursor.execute('''
                INSERT INTO saathis VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', s)
        else:
            cursor.execute("""
                UPDATE saathis 
                SET name = ?, alias = ?, year = ?, field = ?, college_type = ?, vibe_tags = ?,
                    bio = ?, availability = ?, languages = ?, badges = ?, avatar_seed = ?,
                    color_scheme = ?, max_capacity = COALESCE(max_capacity, 10)
                WHERE id = ?
            """, (s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], s[9], s[10], s[11], s[12], s[0]))

    # Seed Saathi authentication credentials (Default: SaharaPeer2025!)
    default_users = [
        ("saathi-zakwan", "zakwan"),
        ("saathi-saifullah", "saifullah"),
        ("saathi-riyaz", "riyaz"),
        ("saathi-samiiksha", "samiiksha")
    ]
    now_iso = datetime.now().isoformat()
    for saathi_id, username in default_users:
        cursor.execute("SELECT saathi_id FROM saathi_auth WHERE saathi_id = ? OR username = ?", (saathi_id, username))
        auth_exists = cursor.fetchone()
        if not auth_exists:
            p_hash, salt = hash_password("SaharaPeer2025!")
            cursor.execute("""
                INSERT INTO saathi_auth (saathi_id, username, password_hash, salt, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (saathi_id, username, p_hash, salt, now_iso))

    # Seed Counsellors
    cursor.execute("SELECT COUNT(*) FROM counsellors")
    if cursor.fetchone()[0] == 0:
        counsellors_data = [
            (
                'counsellor-1',
                'Dr. Ananya Sen',
                'M.Phil (NIMHANS), Ph.D Clinical Psychology',
                'Senior Clinical Psychologist & Youth Specialist',
                json.dumps(['Academic Anxiety', 'Burnout & Panic', 'Identity & Self-Worth']),
                '9+ years working with university students',
                json.dumps(['English', 'Hindi', 'Bengali']),
                '₹0 / session (Subsidized by Independent Student Fund)',
                json.dumps(['Video', 'Voice', 'Text']),
                'Today, 4:30 PM',
                1,
                'Ananya'
            ),
            (
                'counsellor-2',
                'Mr. Vikram Rao',
                'M.Sc Counseling Psychology, Trauma-Informed Certified',
                'Adolescent & Young Adult Therapist',
                json.dumps(['Family Expectations', 'Relationship Dynamics', 'Depressive Episodes']),
                '7+ years with Indian college campuses',
                json.dumps(['English', 'Hindi', 'Kannada']),
                '₹99 / session (Subsidized rate)',
                json.dumps(['Video', 'Voice']),
                'Tomorrow, 11:00 AM',
                1,
                'Vikram'
            ),
            (
                'counsellor-3',
                'Ms. Shalini Nair',
                'M.A. Applied Psychology, CBT & Mindfulness Practitioner',
                'Student Wellness & Stress Consultant',
                json.dumps(['Sleep Disturbances', 'Social Anxiety', 'Imposter Syndrome']),
                '6+ years in youth mental health',
                json.dumps(['English', 'Hindi', 'Malayalam']),
                '₹149 / session (Student rate)',
                json.dumps(['Video', 'Voice', 'Text']),
                'Tomorrow, 3:00 PM',
                1,
                'Shalini'
            )
        ]
        cursor.executemany('''
            INSERT INTO counsellors VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', counsellors_data)

    # Seed Crisis Helplines
    cursor.execute("SELECT COUNT(*) FROM crisis_helplines")
    if cursor.fetchone()[0] == 0:
        helplines_data = [
            (
                'helpline-1',
                'Tele-MANAS (Govt of India 24/7)',
                '14416 / 1800-891-4416',
                'Free, confidential 24/7 national tele-mental health helpline in 20+ Indian languages.',
                'Toll-Free Government Helpline'
            ),
            (
                'helpline-2',
                'KIRAN National Helpline',
                '1800-599-0019',
                '24/7 Department of Empowerment of Persons with Disabilities mental health rehabilitation hotline.',
                'National Mental Health Helpline'
            ),
            (
                'helpline-3',
                'Vandrevala Foundation',
                '+91 9999 666 555',
                'Free, professional 24/7 crisis intervention and emotional distress support via call and WhatsApp.',
                '24/7 Crisis Support'
            ),
            (
                'helpline-4',
                'AASRA Helpline',
                '+91 98204 66726',
                '24/7 suicide prevention and crisis counseling service.',
                'Suicide Prevention Helpline'
            )
        ]
        cursor.executemany('''
            INSERT INTO crisis_helplines VALUES (?, ?, ?, ?, ?)
        ''', helplines_data)

    # Seed Coping Tools
    cursor.execute("SELECT COUNT(*) FROM coping_tools")
    if cursor.fetchone()[0] == 0:
        coping_data = [
            ('tool-breathe', '4-7-8 Diaphragmatic Breath', '3 mins', 'Instant Calm', 'Scientifically regulates heart rate variability and downregulates fight-or-flight response.', 'Breathing'),
            ('tool-ground', '5-4-3-2-1 Sensory Grounding', '4 mins', 'Anti-Overthinking', 'Brings attention back into your physical surroundings through 5 senses.', 'Grounding'),
            ('tool-box', 'Box Breathing (4-4-4-4)', '2 mins', 'Focus Reset', 'Used by professionals before high-stakes exams or intense deadlines.', 'Breathing'),
            ('tool-pressure', 'The Exam Pressure Unload', '5 mins', 'Academic Stress', 'Step-by-step cognitive release exercise to separate self-worth from semester grades.', 'Study Pressure'),
            ('tool-sleep', 'Hostel Night Wind-down', '6 mins', 'Sleep & Rest', 'Guided progressive muscle relaxation for overactive minds in dorm environments.', 'Sleep')
        ]
        cursor.executemany('''
            INSERT INTO coping_tools VALUES (?, ?, ?, ?, ?, ?)
        ''', coping_data)

    # Seed Campus Analytics
    cursor.execute("SELECT COUNT(*) FROM campus_analytics")
    if cursor.fetchone()[0] == 0:
        analytics_obj = {
            "totalStudentsCovered": "2,000",
            "pilotCampuses": "3 Institutes",
            "botReturnRate": "38.4%",
            "avgTimeToTouchpoint": "< 18 mins",
            "maleHelpSeekingRate": "42.6%",
            "saathiSessionsCompleted": 482,
            "professionalEscalations": 86,
            "crisisInterceptsHandled": 14,
            "studentTrustScore": "94.2%",
            "breakdownByCategory": [
                {"category": "Academic & Exam Pressure", "percentage": 34, "color": "#234D32"},
                {"category": "Sleep Disruption & Physical Fatigue", "percentage": 24, "color": "#3D7A5A"},
                {"category": "Family Expectations & Career Anxiety", "percentage": 22, "color": "#9BAE91"},
                {"category": "Relationship & Social Isolation", "percentage": 14, "color": "#DCE5D4"},
                {"category": "Other Campus Concerns", "percentage": 6, "color": "#EDE8DA"}
            ],
            "monthlyTrend": [
                {"month": "Aug", "chats": 120, "peerConnections": 45, "professional": 8},
                {"month": "Sep", "chats": 280, "peerConnections": 110, "professional": 18},
                {"month": "Oct (Midterms)", "chats": 620, "peerConnections": 240, "professional": 38},
                {"month": "Nov", "chats": 450, "peerConnections": 180, "professional": 24},
                {"month": "Dec (Finals)", "chats": 530, "peerConnections": 220, "professional": 32}
            ]
        }
        cursor.execute("INSERT INTO campus_analytics (id, data_json) VALUES (1, ?)", (json.dumps(analytics_obj),))

    conn.commit()
