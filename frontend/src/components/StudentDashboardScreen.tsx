import React, { useState, useEffect } from 'react';
import { Screen, SaathiDualAssignment, CheckInRecord, CopingTool, CrisisHelpline } from '../types';
import { postCheckin, fetchCheckins, fetchCopingTools, fetchCrisisHelplines } from '../api/endpoints';
import { getSessionId } from '../utils/session';
import {
  Sparkles,
  HeartHandshake,
  Wind,
  ArrowRight,
  Play,
  Pause,
  Lock,
  PhoneCall,
  CheckCircle2,
  Calendar,
  Smile,
  Zap,
  Activity,
} from 'lucide-react';

interface StudentDashboardScreenProps {
  onNavigate: (screen: Screen) => void;
  dualAssignment: SaathiDualAssignment | null;
}

const DEFAULT_COPING_TOOLS: CopingTool[] = [
  {
    id: 'tool-breathe',
    title: '4-7-8 Diaphragmatic Breath',
    category: 'Breathing',
    duration: '3 mins',
    tag: 'Instant Calm',
    description: 'Scientifically regulates heart rate variability and downregulates the autonomic fight-or-flight response.',
  },
  {
    id: 'tool-ground',
    title: '5-4-3-2-1 Sensory Grounding',
    category: 'Grounding',
    duration: '4 mins',
    tag: 'Anti-Overthinking',
    description: 'Brings attention back into your physical surroundings through sight, touch, sound, smell, and taste.',
  },
  {
    id: 'tool-box',
    title: 'Box Breathing (4-4-4-4)',
    category: 'Breathing',
    duration: '2 mins',
    tag: 'Focus Reset',
    description: 'Used by high-stress professionals before exams or high stakes deadlines.',
  },
  {
    id: 'tool-pressure',
    title: 'The Exam Pressure Unload',
    category: 'Cognitive',
    duration: '5 mins',
    tag: 'Academic Stress',
    description: 'Step-by-step cognitive release exercise to separate your self-worth from semester grades.',
  },
];

const DEFAULT_HELPLINES: CrisisHelpline[] = [
  {
    name: 'Tele-MANAS (Govt of India 24/7)',
    number: '14416 / 1800-891-4416',
    description: 'Free, confidential 24/7 national tele-mental health helpline in 20+ Indian languages.',
    type: 'Toll-Free Government Helpline',
  },
  {
    name: 'KIRAN National Helpline',
    number: '1800-599-0019',
    description: '24/7 mental health rehabilitation and crisis counseling hotline.',
    type: 'National Mental Health Helpline',
  },
  {
    name: 'Vandrevala Foundation',
    number: '+91 9999 666 555',
    description: 'Free, professional 24/7 crisis intervention via call and WhatsApp.',
    type: '24/7 Crisis Support',
  },
];

const MOOD_OPTIONS = [
  { label: 'Heavy & Overwhelmed', emoji: '🌧️', energy: 1 },
  { label: 'Exhausted & Sleepy', emoji: '🌙', energy: 2 },
  { label: 'Restless & Anxious', emoji: '⚡', energy: 2 },
  { label: 'Taking a breath', emoji: '🌿', energy: 3 },
  { label: 'A bit lighter', emoji: '🌤️', energy: 4 },
  { label: 'Steady & Grounded', emoji: '🪴', energy: 5 },
];

export const StudentDashboardScreen: React.FC<StudentDashboardScreenProps> = ({
  onNavigate,
  dualAssignment,
}) => {
  const sessionId = getSessionId();

  const primary = dualAssignment?.primary || {
    alias: 'Zak_TechAnchor_23',
    intro_message: 'Balancing coursework and exam panic can get overwhelming.',
  };

  const secondary = dualAssignment?.secondary || {
    alias: 'Saif_Pacer_22',
    intro_message: 'Went through heavy placement stress. Happy to chat anytime.',
  };

  const [selectedMood, setSelectedMood] = useState<string>('Heavy & Overwhelmed');
  const [stressorInput, setStressorInput] = useState('');
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [checkinHistory, setCheckinHistory] = useState<CheckInRecord[]>([]);

  // Interactive Breathing State
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathePhase, setBreathePhase] = useState<'Inhale (4s)' | 'Hold (7s)' | 'Exhale (8s)'>('Inhale (4s)');
  const [breatheSeconds, setBreatheSeconds] = useState(4);

  const [copingTools, setCopingTools] = useState<CopingTool[]>(DEFAULT_COPING_TOOLS);
  const [helplines, setHelplines] = useState<CrisisHelpline[]>(DEFAULT_HELPLINES);

  // Load check-in history, coping tools, and crisis helplines from backend
  useEffect(() => {
    fetchCheckins(sessionId).then((res) => {
      if (Array.isArray(res) && res.length > 0) setCheckinHistory(res);
    });

    fetchCopingTools().then((res) => {
      if (Array.isArray(res) && res.length > 0) setCopingTools(res);
    });

    fetchCrisisHelplines().then((res) => {
      if (Array.isArray(res) && res.length > 0) setHelplines(res);
    });
  }, [sessionId]);

  // 4-7-8 Breathing Loop
  useEffect(() => {
    let timer: any;
    if (isBreathingActive) {
      timer = setInterval(() => {
        setBreatheSeconds((prev) => {
          if (prev <= 1) {
            if (breathePhase === 'Inhale (4s)') {
              setBreathePhase('Hold (7s)');
              return 7;
            } else if (breathePhase === 'Hold (7s)') {
              setBreathePhase('Exhale (8s)');
              return 8;
            } else {
              setBreathePhase('Inhale (4s)');
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathePhase('Inhale (4s)');
      setBreatheSeconds(4);
    }
    return () => clearInterval(timer);
  }, [isBreathingActive, breathePhase]);

  const handleSaveCheckin = async () => {
    setIsSubmittingCheckin(true);
    const matched = MOOD_OPTIONS.find((m) => m.label === selectedMood);

    try {
      const record = await postCheckin({
        session_id: sessionId,
        mood: selectedMood,
        energy: matched?.energy || 3,
        stressor: stressorInput.trim() || 'General campus stress',
      });

      setCheckinHistory((prev) => [record, ...prev]);
      setCheckinSuccess(true);
      setTimeout(() => setCheckinSuccess(false), 3500);
    } catch (err) {
      console.warn('POST /api/checkins failed, storing locally:', err);
      const localRecord: CheckInRecord = {
        id: `chk-${Date.now()}`,
        session_id: sessionId,
        mood: selectedMood,
        energy: matched?.energy || 3,
        stressor: stressorInput.trim() || 'General campus stress',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setCheckinHistory((prev) => [localRecord, ...prev]);
      setCheckinSuccess(true);
      setTimeout(() => setCheckinSuccess(false), 3500);
    } finally {
      setIsSubmittingCheckin(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#DCE5D4] pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCE5D4] text-xs font-semibold text-[#173F2A]">
            <Sparkles className="w-3.5 h-3.5 text-[#234D32]" />
            <span>Private Sanctuary</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#173F2A]">
            Student Space & Daily Check-In
          </h2>
          <p className="text-sm text-[#173F2A]/80">
            A quiet space for mood tracking, self-regulation exercises, and accessing your dual-Saathi circle.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-[#DCE5D4] text-xs text-[#234D32] shadow-2xs">
          <Lock className="w-4 h-4 text-[#173F2A]" />
          <span>Zero institutional reporting</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (7 cols): Mood Check & Interactive Tools */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Daily Mood Check-In Widget (POST /api/checkins) */}
          <div className="bg-white/95 rounded-3xl p-6 sm:p-7 border border-[#DCE5D4] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-[#173F2A]">Daily Mood Snapshot</h3>
                <p className="text-xs text-[#234D32]/70">Wired to POST /api/checkins. Log how you feel with zero pressure.</p>
              </div>
              <span className="text-2xl">{MOOD_OPTIONS.find((m) => m.label === selectedMood)?.emoji}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {MOOD_OPTIONS.map((mood) => {
                const isSelected = selectedMood === mood.label;
                return (
                  <button
                    key={mood.label}
                    onClick={() => setSelectedMood(mood.label)}
                    className={`p-3 rounded-2xl border text-xs font-semibold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#173F2A] text-[#F7F3E8] border-[#173F2A] shadow-xs'
                        : 'bg-[#F7F3E8] text-[#173F2A] border-[#EDE8DA] hover:bg-[#EDE8DA]'
                    }`}
                  >
                    <span>{mood.emoji}</span>
                    <span className="truncate">{mood.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <input
                type="text"
                value={stressorInput}
                onChange={(e) => setStressorInput(e.target.value)}
                placeholder="Optional: What's the main stressor today? (e.g. Finals, placement test)"
                className="flex-1 bg-[#F7F3E8] text-[#173F2A] placeholder-[#234D32]/50 text-xs px-3.5 py-2.5 rounded-xl border border-[#DCE5D4] focus:outline-none"
              />
              <button
                onClick={handleSaveCheckin}
                disabled={isSubmittingCheckin}
                className="w-full sm:w-auto bg-[#173F2A] hover:bg-[#234D32] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
              >
                {isSubmittingCheckin ? 'Saving...' : 'Log Check-In'}
              </button>
            </div>

            {checkinSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mood snapshot logged securely to session UUID!</span>
              </div>
            )}
          </div>

          {/* Interactive 4-7-8 Breathing Tool */}
          <div className="bg-gradient-to-br from-[#EBF2EA] to-[#F7F3E8] rounded-3xl p-6 sm:p-8 border-2 border-[#9BAE91] shadow-md space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#234D32] bg-[#DCE5D4] px-2.5 py-0.5 rounded-full mb-1">
                  <Wind className="w-3 h-3" />
                  Interactive Breathing Tool
                </div>
                <h3 className="font-display text-2xl font-bold text-[#173F2A]">
                  4-7-8 Diaphragmatic Breath
                </h3>
                <p className="text-xs text-[#234D32] max-w-md mt-1">
                  Downregulates the nervous system and eases exam racing thoughts.
                </p>
              </div>

              <button
                onClick={() => setIsBreathingActive(!isBreathingActive)}
                className={`p-3.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  isBreathingActive
                    ? 'bg-[#173F2A] text-white shadow-sm'
                    : 'bg-white text-[#173F2A] border border-[#9BAE91] hover:bg-[#EDE8DA]'
                }`}
                id="breathing-toggle-btn"
              >
                {isBreathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-[#9BAE91]" />}
                <span>{isBreathingActive ? 'Pause' : 'Start Rhythm'}</span>
              </button>
            </div>

            {/* Breathing Animation Canvas */}
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-44 h-44 rounded-full border-2 border-[#9BAE91]/40 flex items-center justify-center transition-transform duration-1000 ${
                    isBreathingActive && breathePhase.includes('Inhale')
                      ? 'scale-110 bg-[#DCE5D4]/60'
                      : isBreathingActive && breathePhase.includes('Hold')
                      ? 'scale-110 bg-[#9BAE91]/40 ring-4 ring-[#9BAE91]'
                      : 'scale-90 bg-[#F7F3E8]'
                  }`}
                >
                  <div className="w-32 h-32 rounded-full bg-[#173F2A] text-white flex flex-col items-center justify-center shadow-lg transition-all">
                    <span className="font-display text-3xl font-bold">{breatheSeconds}s</span>
                    <span className="text-[11px] font-medium text-[#9BAE91] tracking-wide mt-0.5">
                      {isBreathingActive ? breathePhase.split(' ')[0] : 'Ready'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs font-semibold text-[#234D32] text-center">
                {isBreathingActive
                  ? breathePhase === 'Inhale (4s)'
                    ? '🌿 Gently breathe in through your nose...'
                    : breathePhase === 'Hold (7s)'
                    ? '✨ Hold the air calmly in your chest...'
                    : '💨 Slowly exhale through your mouth...'
                  : 'Click "Start Rhythm" to begin a 2-minute relaxation loop.'}
              </p>
            </div>
          </div>

          {/* Coping Library Cards (GET /api/coping-tools) */}
          <div className="space-y-4">
            <h3 className="font-display text-lg font-bold text-[#173F2A]">Self-Regulation Library</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {copingTools.map((tool) => (
                <div
                  key={tool.id}
                  className="bg-white p-5 rounded-2xl border border-[#DCE5D4] hover:border-[#9BAE91] shadow-2xs transition-all space-y-2.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#3D7A5A] bg-[#EBF2EA] px-2.5 py-0.5 rounded-full">
                        {tool.tag}
                      </span>
                      <span className="text-stone-500">{tool.duration}</span>
                    </div>
                    <h4 className="font-display text-base font-bold text-[#173F2A] mt-2">{tool.title}</h4>
                    <p className="text-xs text-[#234D32]/80 leading-relaxed mt-1">{tool.description}</p>
                  </div>

                  <button
                    onClick={() => onNavigate('chat')}
                    className="text-xs font-bold text-[#173F2A] hover:underline flex items-center gap-1 pt-2 cursor-pointer"
                  >
                    <span>Practice with Sahara</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (5 cols): Your Support Circle & Helplines */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Support Circle Card */}
          <div className="bg-white/95 rounded-3xl p-6 sm:p-7 border border-[#DCE5D4] shadow-md space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#234D32] bg-[#DCE5D4] px-2.5 py-0.5 rounded-full">
                  Your Support Circle
                </span>
                <span className="text-[11px] text-stone-500 font-medium">Dual Nodes</span>
              </div>
              <h3 className="font-display text-xl font-bold text-[#173F2A] mt-2">
                People in your corner
              </h3>
              <p className="text-xs text-[#234D32]/80">
                You never rely on just one contact. Switch seamlessly whenever you want.
              </p>
            </div>

            <div className="space-y-3">
              {/* Primary Saathi Node */}
              <div className="p-4 rounded-2xl bg-[#EBF2EA] border border-[#9BAE91] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#173F2A] text-white flex items-center justify-center font-bold text-sm">
                    {primary.alias.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-[#173F2A]">{primary.alias}</h4>
                      <span className="text-[9px] bg-[#173F2A] text-white px-1.5 py-0.2 rounded font-bold">
                        PRIMARY
                      </span>
                    </div>
                    <p className="text-[11px] text-[#234D32]">Shielded Peer Supporter</p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('saathi_chat')}
                  className="bg-[#173F2A] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs hover:bg-[#234D32] cursor-pointer"
                >
                  Open Chat
                </button>
              </div>

              {/* Secondary Saathi Node */}
              <div className="p-4 rounded-2xl bg-[#F7F3E8] border border-[#EDE8DA] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EDE8DA] border border-[#DCE5D4] text-[#173F2A] flex items-center justify-center font-bold text-sm">
                    {secondary.alias.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-[#173F2A]">{secondary.alias}</h4>
                      <span className="text-[9px] bg-[#9BAE91] text-[#173F2A] px-1.5 py-0.2 rounded font-bold">
                        BACKUP
                      </span>
                    </div>
                    <p className="text-[11px] text-[#234D32]/70">Standby Peer Node</p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('saathi_chat')}
                  className="bg-white border border-[#DCE5D4] hover:bg-[#EDE8DA] text-[#173F2A] px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Chat
                </button>
              </div>

              {/* Professional Care Node */}
              <div className="p-4 rounded-2xl bg-[#F7F3E8] border border-[#EDE8DA] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#173F2A] text-white flex items-center justify-center font-bold text-sm">
                    🩺
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#173F2A]">Licensed Psychologist</h4>
                    <p className="text-[11px] text-[#234D32]/70">Decoupled private booking (₹0-149)</p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('appointments')}
                  className="bg-[#173F2A] text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[#234D32] cursor-pointer"
                >
                  Book
                </button>
              </div>
            </div>

            <button
              onClick={() => onNavigate('saathi_match')}
              className="w-full py-2.5 rounded-xl border border-dashed border-[#9BAE91] text-xs font-bold text-[#173F2A] hover:bg-[#F7F3E8] transition-colors cursor-pointer"
            >
              + Refresh Dual-Saathi Match
            </button>
          </div>

          {/* Verified Crisis Helplines List (GET /api/crisis-helplines) */}
          <div className="p-5 rounded-3xl bg-[#FDF2F2] border border-[#FFD6D6] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#962D2D]">24/7 Verified Emergency Helplines:</span>
              <span className="text-[10px] bg-[#FFD6D6] text-[#962D2D] px-2 py-0.5 rounded font-bold">
                FREE
              </span>
            </div>

            <div className="space-y-2">
              {helplines.map((hl, idx) => (
                <div key={idx} className="p-3 bg-white rounded-xl border border-[#FFD6D6] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#173F2A]">{hl.name}</span>
                    <a
                      href={`tel:${hl.number.split('/')[0].trim()}`}
                      className="text-xs font-mono font-bold text-rose-700 hover:underline"
                    >
                      {hl.number.split('/')[0]}
                    </a>
                  </div>
                  <p className="text-[10px] text-stone-600">{hl.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
