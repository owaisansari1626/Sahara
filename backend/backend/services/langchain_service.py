import json
import logging
from typing import Dict, Any, List
from backend.config import settings

logger = logging.getLogger("sahara.langchain")

ALLOWED_TAGS = [
    "academic_stress",
    "family_stress",
    "relationship_stress",
    "sleep_issues",
    "isolation",
    "night_owl",
    "exam_period"
]

SYSTEM_INSTRUCTION = """You are "Sahara (सहारा)", an empathetic, confidential, and warm conversational first-step companion designed specifically for Indian college students.
Core principles:
1. "A student should never have to admit they need help before they can receive support."
2. Never speak like a clinical diagnostic bot or questionnaire. Do not give medical diagnoses (e.g. do not say "You have clinical depression" or "This is generalized anxiety").
3. Speak with warmth, gentle validation, and cultural awareness of Indian student pressures (academic load, competitive exams, parental expectations, hostel transitions, placement anxieties).
4. Keep replies concise, conversational (2-4 sentences), and non-judgmental.
5. If the student indicates imminent danger, self-harm, or severe crisis, respond with urgent care, validation, and encourage connecting immediately to crisis resources.
6. Classify the subtle distress level as one of: MILD, MODERATE, or SEVERE.
7. Infer relevant internal matching tags (ZERO to THREE tags maximum) strictly from this fixed vocabulary:
   ["academic_stress", "family_stress", "relationship_stress", "sleep_issues", "isolation", "night_owl", "exam_period"].
   CRITICAL PRIVACY RULE: Do NOT generate free text tags, PII, names, or real-world identities. Only choose from the above list.

Output ONLY valid JSON in format:
{
  "reply": "Your warm empathetic message...",
  "severity": "MILD" | "MODERATE" | "SEVERE",
  "inferredTags": ["academic_stress", "exam_period"]
}"""

def get_contextual_fallback(user_message: str, current_severity: str = "MODERATE") -> Dict[str, Any]:
    lower = (user_message or "").lower()
    reply = "I hear you. You don't have to carry this alone. What feels like the heaviest part of your day right now?"
    inferred_severity = current_severity or "MODERATE"
    inferred_tags: List[str] = []

    if any(k in lower for k in ["die", "kill", "suicid", "end it", "harm", "not safe", "feel safe", "hurt myself", "hopeless", "danger", "crisis"]):
        reply = "I care about your safety deeply, and you do not have to go through this immense pain alone. Please let us connect you with immediate, 24/7 human crisis support right now. Your life has immense value."
        inferred_severity = "SEVERE"
        inferred_tags = ["isolation"]
    elif any(k in lower for k in ["exam", "test", "grade", "gpa", "marks", "fail", "midterm", "finals"]):
        reply = "Exam pressure can create a vicious cycle where the more you worry, the harder it is to start. Take a slow breath — you don't need to master everything in one hour. Would you like to unpack the biggest blocker, or try a quick 3-minute mental reset?"
        inferred_severity = "MILD"
        inferred_tags = ["academic_stress", "exam_period"]
    elif any(k in lower for k in ["study", "assignment", "deadline", "project", "syllabus"]):
        reply = "Academic workload can feel completely suffocating when deadlines pile up. What is the one thing causing the most pressure right now?"
        inferred_severity = "MILD"
        inferred_tags = ["academic_stress"]
    elif any(k in lower for k in ["sleep", "insomnia", "tired", "restless", "nightmare", "awake", "3 am", "late night"]):
        reply = "When sleep slips away, everything else feels magnified. Is your mind racing with next day's to-dos or is it more of a general restlessness keeping you awake?"
        inferred_severity = "MILD"
        inferred_tags = ["sleep_issues", "night_owl"]
    elif any(k in lower for k in ["family", "parents", "dad", "mom", "expectations"]):
        reply = "Living up to family expectations is a heavy invisible weight carried by so many students. It's completely valid to feel drained by it."
        inferred_severity = "MODERATE"
        inferred_tags = ["family_stress"]
    elif any(k in lower for k in ["relationship", "breakup", "partner", "boyfriend", "girlfriend"]):
        reply = "Relationship struggles during college can disrupt your whole emotional baseline. Take your time, there's no rush to fix everything at once."
        inferred_severity = "MODERATE"
        inferred_tags = ["relationship_stress"]
    elif any(k in lower for k in ["overwhelm", "lonely", "friend", "isolate", "hostel", "placement"]):
        reply = "Feeling isolated in a crowded college campus is remarkably common, even when it feels like everyone else is thriving. You don't have to perform or put on a brave face here. What's been lingering in your thoughts the most?"
        inferred_severity = "MODERATE"
        inferred_tags = ["isolation", "academic_stress"]

    return {
        "reply": reply,
        "suggestedSeverity": inferred_severity,
        "inferredTags": inferred_tags,
        "source": "rule-fallback"
    }

async def process_student_chat_with_langchain(user_message: str, history: List[Any] = None, current_severity: str = "MODERATE") -> Dict[str, Any]:
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.info("No GEMINI_API_KEY set; using rule-fallback engine.")
        return get_contextual_fallback(user_message, current_severity)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        # Build history for multi-turn context
        chat_history = []
        if history:
            for item in history:
                role = getattr(item, 'role', None) or (item.get('role', '') if isinstance(item, dict) else '')
                parts = getattr(item, 'parts', None) or (item.get('parts', []) if isinstance(item, dict) else [])
                text = ""
                if isinstance(parts, list) and len(parts) > 0:
                    text = parts[0].get('text', '') if isinstance(parts[0], dict) else str(parts[0])
                if role in ['user', 'student']:
                    chat_history.append(types.Content(role="user", parts=[types.Part(text=text)]))
                elif role in ['model', 'sahara', 'assistant']:
                    chat_history.append(types.Content(role="model", parts=[types.Part(text=text)]))

        prompt_str = f'Student message: "{user_message}"\nProvide reply, classify distress level as MILD/MODERATE/SEVERE, and infer tags from allowed vocabulary in JSON format.'

        # Use Interactions (Chat) API as recommended for gemini-3.6-flash
        chat = client.aio.chats.create(
            model="gemini-3.6-flash",
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
            ),
            history=chat_history,
        )
        response = await chat.send_message(prompt_str)
        content_text = response.text.strip()
        logger.info(f"Gemini response len={len(content_text)}, preview={repr(content_text)[:300]}")

        # Clean JSON markdown fences if present
        if content_text.startswith("```"):
            lines = content_text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            content_text = "\n".join(lines).strip()

        parsed = json.loads(content_text)
        
        # Validate inferred tags against allowed vocabulary
        raw_tags = parsed.get("inferredTags", [])
        validated_tags = [t for t in raw_tags if t in ALLOWED_TAGS] if isinstance(raw_tags, list) else []

        return {
            "reply": parsed.get("reply", "I'm listening. Take all the time you need."),
            "suggestedSeverity": parsed.get("severity", "MODERATE"),
            "inferredTags": validated_tags,
            "source": "langchain-gemini"
        }
    except Exception as e:
        logger.error(f"Error executing Gemini chat: {e}")
        return get_contextual_fallback(user_message, current_severity)
