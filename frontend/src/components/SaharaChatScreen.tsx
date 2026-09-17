import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, TriageSeverity, Screen, SaathiPeerAssignment } from '../types';
import { postChatMessage, fetchChatHistory, resetChatHistory } from '../api/endpoints';
import { getSessionId, resetSessionId } from '../utils/session';
import {
  Shield,
  Send,
  Lock,
  Sparkles,
  PhoneCall,
  HeartHandshake,
  Wind,
  AlertTriangle,
  RotateCcw,
  Tag,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface SaharaChatScreenProps {
  onNavigate: (screen: Screen) => void;
  onSelectPeerChat: (
    chatId: string,
    primaryPeer?: SaathiPeerAssignment,
    secondaryPeer?: SaathiPeerAssignment
  ) => void;
}

const INITIAL_GREETING: ChatMessage = {
  id: 'greet-1',
  sender: 'sahara',
  text: "Hey 👋 I'm Sahara.\n\nYou don't have to explain everything perfectly or know what's wrong.\n\nWhat's been going on lately?",
  timestamp: 'Just now',
};

const CRISIS_HELPLINES = [
  {
    name: 'Tele-MANAS (Govt of India)',
    number: '14416 / 1800-891-4416',
    tel: 'tel:14416',
    desc: '24/7 National mental health helpline in 20+ languages',
  },
  {
    name: 'KIRAN National Helpline',
    number: '1800-599-0019',
    tel: 'tel:18005990019',
    desc: '24/7 Toll-free psychological crisis intervention',
  },
  {
    name: 'Vandrevala Foundation',
    number: '+91 9999 666 555',
    tel: 'tel:+919999666555',
    desc: '24/7 Free crisis counseling via phone & WhatsApp',
  },
];

const QUICK_PROMPTS = [
  'My semester exams start next week and I am panicking',
  'Feeling totally overwhelmed with assignments',
  'Hostel life feels really lonely and isolating',
  'I feel completely burned out and cannot sleep',
  'Parental expectations are suffocating me',
];

export const SaharaChatScreen: React.FC<SaharaChatScreenProps> = ({
  onNavigate,
  onSelectPeerChat,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('sahara_chat_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return [INITIAL_GREETING];
  });

  const [currentSeverity, setCurrentSeverity] = useState<TriageSeverity>('MILD');
  const [inferredTags, setInferredTags] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = getSessionId();

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sahara_chat_messages', JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to persist messages:', e);
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const studentMessage: ChatMessage = {
      id: `std-${Date.now()}`,
      sender: 'student',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, studentMessage];
    setMessages(updatedMessages);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      // Direct call to FastAPI backend POST /api/chat
      const res = await postChatMessage({
        session_id: sessionId,
        userMessage: text,
        currentSeverity,
        messages: updatedMessages.map((m) => ({
          role: m.sender === 'student' ? 'user' : 'model',
          parts: [{ text: m.text }],
        })),
      });

      const saharaReply: ChatMessage = {
        id: `sahara-${Date.now()}`,
        sender: 'sahara',
        text: res.reply || "I hear you. You don't have to carry this all alone. We can take this one gentle step at a time.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity: res.suggestedSeverity,
        inferredTags: res.inferredTags,
        peerRedirect: res.peerRedirect,
      };

      setMessages((prev) => [...prev, saharaReply]);

      if (res.suggestedSeverity) {
        setCurrentSeverity(res.suggestedSeverity);
      }

      if (res.inferredTags && res.inferredTags.length > 0) {
        setInferredTags((prev) => Array.from(new Set([...prev, ...res.inferredTags!])));
      }
    } catch (err: any) {
      console.warn('API /api/chat error, applying local contextual fallback:', err);
      // Fallback
      setTimeout(() => {
        let reply = "I hear you. College pressures can build up so quietly until everything feels heavy. Let's take a slow breath.";
        let sev: TriageSeverity = currentSeverity;

        const lower = text.toLowerCase();
        let peerRedirectInfo = null;
        const studentTurns = updatedMessages.filter((m) => m.sender === 'student').length;

        if (lower.includes('suicide') || lower.includes('harm') || lower.includes('die') || lower.includes('end it') || lower.includes('not safe')) {
          reply = "I care about your safety deeply, and you do not have to carry this immense pain alone. Please let us connect you with verified 24/7 emergency support right now. Your life has immense value.";
          sev = 'SEVERE';
        } else if (lower.includes('exam') || lower.includes('study') || lower.includes('fail') || lower.includes('panic') || lower.includes('grade')) {
          reply = "Exam pressure can create a vicious cycle where the more you worry, the harder it is to start. Take a slow breath — you don't need to master everything in one hour.";
          sev = 'MODERATE';
          // Require at least 2 conversational student turns before creating a peerRedirect card
          if (studentTurns >= 2) {
            peerRedirectInfo = {
              shouldRedirect: true,
              matchedDomain: 'exam_period',
              domainLabel: 'Exam & Performance Pressure',
              action: 'OFFER',
              matchedSaathi: {
                chat_id: 'schat-bb51418f',
                saathi_id: 'saathi-zakwan',
                alias: 'Zak_TechAnchor_23',
                role: 'PRIMARY',
                status: 'ACTIVE',
                intro_message: "Hey! I'm Zak_TechAnchor_23. Balancing sprint deadlines and exam panic is brutal. Here if you want to break down the syllabus together.",
                vibeTags: [
                  { icon: '💻', label: 'Engineering & coding stress', tag_key: 'academic_stress' },
                  { icon: '📚', label: 'Exam sprint & panic', tag_key: 'exam_period' },
                ],
                avatarSeed: 'Zakwan',
                colorScheme: { bg: 'bg-[#EBF2EA]', border: 'border-[#9BAE91]', text: 'text-[#173F2A]' },
              },
              secondarySaathi: {
                chat_id: 'schat-89496809',
                saathi_id: 'saathi-saifullah',
                alias: 'Saif_Pacer_22',
                role: 'SECONDARY',
                status: 'ACTIVE',
                intro_message: "Hey! I'm Saif_Pacer_22. Went through heavy exam pressure and dorm loneliness. Happy to chat at any odd hour.",
                vibeTags: [
                  { icon: '🏏', label: 'Sports & Balance', tag_key: 'academic_stress' },
                  { icon: '🎧', label: 'Non-judgmental venting', tag_key: 'isolation' },
                ],
                avatarSeed: 'Saifullah',
                colorScheme: { bg: 'bg-[#F4ECE1]', border: 'border-[#D8C7B0]', text: 'text-[#173F2A]' },
              },
              handoffText: "You don't have to carry this alone. I've matched you with Zak_TechAnchor_23 who understands engineering exam pressure.",
            };
          }
        } else if (lower.includes('overwhelm') || lower.includes('lonely') || lower.includes('hostel') || lower.includes('alone')) {
          reply = "Feeling isolated in a crowded campus is remarkably common. Connecting with a student who genuinely understands college life might help lift that weight.";
          sev = 'MODERATE';
          // Require at least 2 conversational student turns before creating a peerRedirect card
          if (studentTurns >= 2) {
            peerRedirectInfo = {
              shouldRedirect: true,
              matchedDomain: 'isolation',
              domainLabel: 'Hostel & Social Isolation',
              action: 'OFFER',
              matchedSaathi: {
                chat_id: 'schat-89496809',
                saathi_id: 'saathi-saifullah',
                alias: 'Saif_Pacer_22',
                role: 'PRIMARY',
                status: 'ACTIVE',
                intro_message: "Hey! I'm Saif_Pacer_22. Being surrounded by 500 people in the mess hall and still feeling alone is so real. Here to listen.",
                vibeTags: [
                  { icon: '🏏', label: 'Sports & Balance', tag_key: 'academic_stress' },
                  { icon: '🎧', label: 'Non-judgmental venting', tag_key: 'isolation' },
                ],
                avatarSeed: 'Saifullah',
                colorScheme: { bg: 'bg-[#F4ECE1]', border: 'border-[#D8C7B0]', text: 'text-[#173F2A]' },
              },
              secondarySaathi: {
                chat_id: 'schat-bb51418f',
                saathi_id: 'saathi-zakwan',
                alias: 'Zak_TechAnchor_23',
                role: 'SECONDARY',
                status: 'ACTIVE',
                intro_message: "Hey! I'm Zak_TechAnchor_23. Balancing sprint deadlines and exam panic is brutal. Here if you want to break down the syllabus together.",
                vibeTags: [
                  { icon: '💻', label: 'Engineering & coding stress', tag_key: 'academic_stress' },
                  { icon: '📚', label: 'Exam sprint & panic', tag_key: 'exam_period' },
                ],
                avatarSeed: 'Zakwan',
                colorScheme: { bg: 'bg-[#EBF2EA]', border: 'border-[#9BAE91]', text: 'text-[#173F2A]' },
              },
              handoffText: "You don't have to carry this alone. I've connected you with Saif_Pacer_22, who knows the weight of hostel transitions.",
            };
          }
        } else {
          sev = 'MILD';
        }

        const saharaReply: ChatMessage = {
          id: `sahara-${Date.now()}`,
          sender: 'sahara',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          severity: sev,
          peerRedirect: peerRedirectInfo,
        };

        setMessages((prev) => [...prev, saharaReply]);
        setCurrentSeverity(sev);
      }, 600);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetChatHistory(sessionId);
    } catch {}
    resetSessionId();
    setMessages([INITIAL_GREETING]);
    setCurrentSeverity('MILD');
    setInferredTags([]);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-4xl mx-auto p-3 sm:p-6 flex flex-col justify-between">
      
      {/* Main Chat Container */}
      <div className="bg-[#F7F3E8] rounded-3xl border border-[#9BAE91]/30 shadow-xl flex flex-col h-[78vh] sm:h-[82vh] overflow-hidden">
        
        {/* Chat Header */}
        <div className="h-16 border-b border-[#9BAE91]/20 flex items-center px-4 sm:px-6 justify-between shrink-0 bg-white/60 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#173F2A] flex items-center justify-center text-white shadow-xs">
              <span className="text-base">🌿</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-sm sm:text-base text-[#173F2A]">Sahara Companion</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] text-[#234D32]/70 font-mono">
                {sessionId.slice(0, 18)}...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Severity Badge */}
            <div
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                currentSeverity === 'SEVERE'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                  : currentSeverity === 'MODERATE'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-[#DCE5D4] text-[#173F2A] border border-[#9BAE91]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  currentSeverity === 'SEVERE'
                    ? 'bg-rose-600'
                    : currentSeverity === 'MODERATE'
                    ? 'bg-amber-600'
                    : 'bg-[#173F2A]'
                }`}
              />
              <span>
                {currentSeverity === 'SEVERE'
                  ? 'Crisis Protocol'
                  : currentSeverity === 'MODERATE'
                  ? 'Moderate Distress'
                  : 'Gentle Support'}
              </span>
            </div>

            {/* Reset Session Button */}
            <button
              onClick={handleReset}
              className="p-2 text-stone-500 hover:text-[#173F2A] hover:bg-white/80 rounded-xl transition-colors cursor-pointer"
              title="Reset session and start fresh conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* STICKY CRISIS HELPLINE BANNER (Active on SEVERE) */}
        {currentSeverity === 'SEVERE' && (
          <div className="bg-rose-600 text-white px-4 py-3 shadow-md flex items-center justify-between flex-wrap gap-2 text-xs shrink-0 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-200 shrink-0" />
              <span>
                <strong>24/7 Verified Emergency Helplines:</strong> Tele-MANAS (<strong>14416</strong>) & Kiran (<strong>1800-599-0019</strong>). Free & confidential.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="tel:14416"
                className="bg-white text-rose-700 px-3 py-1 rounded-full font-bold text-xs hover:bg-rose-50 transition-colors flex items-center gap-1"
              >
                <PhoneCall className="w-3 h-3" />
                <span>Call 14416</span>
              </a>
              <button
                onClick={() => onNavigate('appointments')}
                className="bg-rose-800 hover:bg-rose-900 text-white px-3 py-1 rounded-full font-semibold text-xs transition-colors"
              >
                Psychologist
              </button>
            </div>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#F7F3E8]">
          
          {/* Subtle Security Pill */}
          <div className="flex justify-center my-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE8DA]/70 border border-[#9BAE91]/20 text-[11px] text-[#173F2A]/70">
              <Shield className="w-3 h-3 text-[#173F2A]" />
              <span>Anonymous session • Zero college tracking • Shielded peer aliases</span>
            </div>
          </div>

          {/* Inferred Tag Pills */}
          {inferredTags.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-semibold text-[#234D32]/70 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Inferred tags:
              </span>
              {inferredTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-full bg-[#DCE5D4] text-[10px] font-bold text-[#173F2A] uppercase tracking-wide border border-[#9BAE91]/40"
                >
                  {tag.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => {
            const isSahara = msg.sender === 'sahara';
            const redirect = msg.peerRedirect;
            const isModerateDistress = msg.severity === 'MODERATE' || currentSeverity === 'MODERATE';
            const hasRedirect =
              redirect &&
              redirect.shouldRedirect &&
              redirect.matchedSaathi &&
              isModerateDistress &&
              currentSeverity !== 'SEVERE';

            return (
              <div key={msg.id} className="space-y-3">
                <div
                  className={`flex gap-2.5 max-w-[90%] sm:max-w-[78%] ${
                    isSahara ? 'self-start' : 'self-end flex-row-reverse ml-auto'
                  }`}
                >
                  {isSahara && (
                    <div className="w-8 h-8 rounded-xl bg-[#173F2A] shrink-0 flex items-center justify-center text-white text-xs shadow-2xs mt-0.5">
                      🌿
                    </div>
                  )}

                  <div
                    className={`p-4 text-xs sm:text-sm leading-relaxed ${
                      isSahara
                        ? 'chat-bubble-bot text-[#173F2A] border border-[#9BAE91]/20'
                        : 'chat-bubble-user text-white'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <div
                      className={`text-[10px] mt-1.5 ${
                        isSahara ? 'text-[#173F2A]/50' : 'text-white/60'
                      } text-right`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>

                {/* REDIRECTION BRIDGE CARD (Bot -> Peer Handoff) */}
                {hasRedirect && (
                  <div className="ml-10 max-w-[92%] sm:max-w-[80%] bg-gradient-to-br from-[#FEF7EB] to-white border-2 border-[#E5AD35] rounded-3xl p-5 shadow-md space-y-3.5 animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A12] bg-[#FFE7BA] px-2.5 py-0.5 rounded-full">
                          {redirect.domainLabel || 'Peer Support Match'}
                        </span>
                        <span className="text-[10px] font-semibold text-stone-500">Live Peer Handoff</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#173F2A] text-white flex items-center justify-center font-display font-bold text-base shadow-xs shrink-0">
                        {redirect.matchedSaathi!.alias.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-bold text-sm sm:text-base text-[#173F2A]">
                            {redirect.matchedSaathi!.alias}
                          </h4>
                          <span className="text-[10px] bg-[#DCE5D4] text-[#173F2A] px-2 py-0.2 rounded font-bold">
                            Trained Peer
                          </span>
                        </div>
                        <p className="text-xs text-[#4E3919] italic leading-relaxed">
                          &ldquo;{redirect.handoffText || redirect.matchedSaathi!.intro_message}&rdquo;
                        </p>
                      </div>
                    </div>

                    {/* Vibe Tags */}
                    {redirect.matchedSaathi!.vibeTags && redirect.matchedSaathi!.vibeTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {redirect.matchedSaathi!.vibeTags.map((v, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-lg bg-white border border-[#E5AD35]/40 text-[#173F2A]"
                          >
                            {v.icon && <span>{v.icon}</span>}
                            <span>{v.label}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2 border-t border-[#E5AD35]/30 flex items-center justify-between">
                      <span className="text-[10px] text-[#8A5A12] font-semibold">
                        🔒 100% Shielded Alias &bull; Zero College Logs
                      </span>
                      <button
                        onClick={() =>
                          onSelectPeerChat(
                            redirect.matchedSaathi!.chat_id,
                            redirect.matchedSaathi,
                            redirect.secondarySaathi
                          )
                        }
                        className="bg-[#173F2A] hover:bg-[#234D32] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        id={`connect-${redirect.matchedSaathi!.chat_id}`}
                      >
                        <HeartHandshake className="w-3.5 h-3.5 text-[#9BAE91]" />
                        <span>Connect with {redirect.matchedSaathi!.alias}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-2.5 max-w-[85%] self-start">
              <div className="w-8 h-8 rounded-xl bg-[#173F2A] shrink-0 flex items-center justify-center text-white text-xs">
                🌿
              </div>
              <div className="chat-bubble-bot p-4 text-xs sm:text-sm text-[#173F2A] flex items-center gap-1.5 border border-[#9BAE91]/20">
                <span className="text-xs font-medium text-[#173F2A]/70 mr-1">Sahara is listening</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#9BAE91] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#9BAE91] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#9BAE91] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* SEVERE Persistent Crisis Card */}
          {currentSeverity === 'SEVERE' && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 space-y-4 shadow-sm my-2">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-200 text-rose-900 flex items-center justify-center text-lg shrink-0">
                  🆘
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm sm:text-base text-rose-950">
                    You do not have to carry this immense pain by yourself.
                  </h4>
                  <p className="text-xs text-rose-800 leading-relaxed mt-0.5">
                    Please connect with immediate, verified 24/7 counselors who are ready to support you this very minute.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {CRISIS_HELPLINES.map((hl, i) => (
                  <a
                    key={i}
                    href={hl.tel}
                    className="p-3 bg-white rounded-2xl border border-rose-200 hover:border-rose-400 hover:shadow-xs transition-all flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-rose-950">{hl.name}</p>
                      <p className="text-[10px] text-stone-500">{hl.desc}</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-lg">
                      {hl.number.split('/')[0]}
                    </span>
                  </a>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-rose-200">
                <button
                  onClick={() => onNavigate('appointments')}
                  className="bg-rose-700 hover:bg-rose-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Book Subsidized Psychologist Session</span>
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Taps Suggestions */}
        {messages.length < 5 && (
          <div className="px-4 py-2 bg-white/40 border-t border-[#9BAE91]/20 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[11px] font-semibold text-[#173F2A]/60 shrink-0">Quick taps:</span>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isTyping}
                className="px-3 py-1 bg-white border border-[#9BAE91]/50 rounded-full text-xs font-medium text-[#173F2A] hover:bg-[#173F2A] hover:text-white transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#9BAE91]/20 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type anything. You don't have to explain it all..."
              disabled={isTyping}
              className="flex-1 bg-[#F7F3E8] text-[#173F2A] placeholder-[#173F2A]/40 text-xs sm:text-sm px-4 py-3 rounded-2xl border border-[#9BAE91]/30 focus:outline-none focus:ring-2 focus:ring-[#9BAE91]"
              id="sahara-chat-input"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="bg-[#173F2A] hover:bg-[#234D32] disabled:opacity-40 text-white p-3 sm:px-5 sm:py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              id="sahara-chat-send-btn"
            >
              <Send className="w-4 h-4 text-[#9BAE91]" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
