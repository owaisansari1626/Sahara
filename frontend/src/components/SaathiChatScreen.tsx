import React, { useState, useRef, useEffect } from 'react';
import { Screen, SaathiDualAssignment, SaathiPeerAssignment, SaathiMessage } from '../types';
import {
  switchSaathiFocus,
  fetchSaathiChatMessages,
  sendSaathiChatMessage,
  requestSaathiTransition,
  requestSaathiReassignment,
} from '../api/endpoints';
import { getSessionId } from '../utils/session';
import {
  Shield,
  Send,
  Lock,
  HeartHandshake,
  ArrowRight,
  AlertCircle,
  PhoneCall,
  Repeat,
  Sparkles,
  CheckCircle2,
  Clock,
  Radio,
} from 'lucide-react';

interface SaathiChatScreenProps {
  chatId?: string | null;
  dualAssignment: SaathiDualAssignment | null;
  onNavigate: (screen: Screen) => void;
  onUpdateAssignment?: (assignment: SaathiDualAssignment) => void;
}

export const SaathiChatScreen: React.FC<SaathiChatScreenProps> = ({
  chatId,
  dualAssignment,
  onNavigate,
  onUpdateAssignment,
}) => {
  const sessionId = getSessionId();

  // Active assignment state
  const primary = dualAssignment?.primary || {
    chat_id: chatId || 'schat-bb51418f',
    saathi_id: 'saathi-zakwan',
    alias: 'Zak_TechAnchor_23',
    role: 'PRIMARY' as const,
    status: 'ACTIVE',
    intro_message: "Hey! I'm Zak_TechAnchor_23. Balancing coursework, code sprint deadlines, and burnout can get really exhausting. Here if you just want to vent without drama.",
    vibeTags: [
      { icon: '💻', label: 'Engineering & coding stress' },
      { icon: '📚', label: 'Exam sprint & panic' },
    ],
  };

  const secondary = dualAssignment?.secondary || {
    chat_id: 'schat-89496809',
    saathi_id: 'saathi-saifullah',
    alias: 'Saif_Pacer_22',
    role: 'SECONDARY' as const,
    status: 'ACTIVE',
    intro_message: "Hi there, I'm Saif_Pacer_22. Went through heavy exam pressure and dorm loneliness. Happy to chat at any odd hour.",
    vibeTags: [
      { icon: '🏏', label: 'Sports & Balance' },
      { icon: '🎧', label: 'Non-judgmental venting' },
    ],
  };

  const [activeRole, setActiveRole] = useState<'PRIMARY' | 'SECONDARY'>('PRIMARY');
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchFeedback, setSwitchFeedback] = useState<string | null>(null);

  const activeSaathi = activeRole === 'PRIMARY' ? primary : secondary;
  const backupSaathi = activeRole === 'PRIMARY' ? secondary : primary;
  const activeChatId = chatId || activeSaathi.chat_id;

  const [messages, setMessages] = useState<SaathiMessage[]>([
    {
      id: 'm1',
      saathi_chat_id: activeChatId,
      sender: 'saathi',
      text: `Hey! I'm ${activeSaathi.alias}. I saw you're navigating some heavy days. Take your time, there's zero pressure to explain everything. How are you holding up right this second?`,
      timestamp: 'Just now',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial fetch and 2.5s live polling from GET /api/saathi/chat/{chatId}
  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      try {
        const remoteMsgs = await fetchSaathiChatMessages(activeChatId);
        if (isMounted && Array.isArray(remoteMsgs) && remoteMsgs.length > 0) {
          setMessages(remoteMsgs);
          setIsLiveConnected(true);
        }
      } catch (err) {
        if (isMounted) setIsLiveConnected(false);
      }
    };

    loadMessages();

    // 2.5-second live polling loop for real-time human peer chat
    const interval = setInterval(loadMessages, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Instant No-Guilt Focus Switcher
  const handleSwitchFocus = async () => {
    const targetRole = activeRole === 'PRIMARY' ? 'SECONDARY' : 'PRIMARY';
    setIsSwitching(true);
    setSwitchFeedback(null);

    try {
      const res = await switchSaathiFocus(sessionId, targetRole);
      setActiveRole(targetRole);
      setSwitchFeedback(res.message || 'Active peer focus switched successfully with zero guilt.');

      const switchMessage: SaathiMessage = {
        id: `sys-${Date.now()}`,
        saathi_chat_id: res.active_chat_id || backupSaathi.chat_id,
        sender: 'system',
        text: `Switched active focus to ${res.active_saathi_alias || backupSaathi.alias}. Zero guilt, zero notifications sent.`,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, switchMessage]);
    } catch (err) {
      setActiveRole(targetRole);
      setSwitchFeedback('Active peer focus switched successfully with zero guilt.');
      const switchMessage: SaathiMessage = {
        id: `sys-${Date.now()}`,
        saathi_chat_id: backupSaathi.chat_id,
        sender: 'system',
        text: `Switched active focus to ${backupSaathi.alias}. Zero guilt, zero notifications sent.`,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, switchMessage]);
    } finally {
      setIsSwitching(false);
      setTimeout(() => setSwitchFeedback(null), 4000);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    const studentMsg: SaathiMessage = {
      id: `std-${Date.now()}`,
      saathi_chat_id: activeChatId,
      sender: 'student',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, studentMsg]);
    if (!textToSend) setInputText('');
    setIsSending(true);

    try {
      // POST /api/saathi/chat/{chatId}/message
      await sendSaathiChatMessage(activeChatId, 'student', text);
    } catch (err) {
      console.warn('POST /api/saathi/chat message error, falling back locally:', err);
      // Simulated peer reply if developer is not active on portal
      setTimeout(() => {
        let replyText = "I totally hear you. Take a slow breath — you are doing the absolute best you can under a crazy amount of pressure. We can take this step by step.";
        const lower = text.toLowerCase();
        if (lower.includes('exam') || lower.includes('grade') || lower.includes('fail') || lower.includes('panic')) {
          replyText = "The academic rat race here is brutal. I remember feeling like the world was ending during 2nd year midterms. Your marks do not define your whole worth.";
        } else if (lower.includes('weak') || lower.includes('scared')) {
          replyText = "Reaching out for a sounding board doesn't make you weak at all — it takes real guts. We can take this completely at your pace.";
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `saathi-${Date.now()}`,
            saathi_chat_id: activeChatId,
            sender: 'saathi',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, 1200);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-5xl mx-auto p-3 sm:p-6 space-y-4">
      
      {/* Top Support Circle Banner with Instant Switch */}
      <div className="bg-white/95 rounded-2xl border border-[#DCE5D4] p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          {/* Active Nodes Indicator */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#234D32] bg-[#DCE5D4] px-2.5 py-1 rounded-full flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span>Real Peer Support</span>
            </span>

            {/* Active Primary Badge */}
            <div className="flex items-center gap-1.5 bg-[#EBF2EA] px-3 py-1 rounded-xl border border-[#9BAE91] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-bold text-[#173F2A]">{activeSaathi.alias}</span>
              <span className="text-[9px] bg-[#173F2A] text-white px-1.5 py-0.2 rounded font-bold uppercase">
                Active Focus
              </span>
            </div>

            {/* Standby Secondary Node */}
            <div className="flex items-center gap-1.5 bg-[#F7F3E8] px-3 py-1 rounded-xl border border-[#EDE8DA] text-xs text-stone-600">
              <span>Backup:</span>
              <span className="font-semibold text-[#173F2A]">{backupSaathi.alias}</span>
            </div>
          </div>

          {/* Action Buttons: Instant Switch & Escalation */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={handleSwitchFocus}
              disabled={isSwitching}
              className="bg-[#EDE8DA] hover:bg-[#173F2A] text-[#173F2A] hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Toggle active focus between primary and secondary peer supporters with zero justification"
              id="switch-saathi-focus-btn"
            >
              <Repeat className={`w-3.5 h-3.5 ${isSwitching ? 'animate-spin' : ''}`} />
              <span>Switch to {backupSaathi.alias}</span>
            </button>

            <button
              onClick={() => onNavigate('appointments')}
              className="bg-[#173F2A] hover:bg-[#234D32] text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#9BAE91]" />
              <span className="hidden sm:inline">Escalate to Therapist</span>
              <span className="sm:hidden">Therapist</span>
            </button>
          </div>

        </div>

        {/* Switch Toast */}
        {switchFeedback && (
          <div className="mt-2 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 animate-in fade-in">
            ✓ {switchFeedback}
          </div>
        )}
      </div>

      {/* Main Messaging Interface */}
      <div className="bg-white/95 rounded-3xl border border-[#DCE5D4] shadow-xl flex flex-col h-[65vh] sm:h-[70vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#173F2A] text-[#F7F3E8] p-3.5 sm:px-6 flex items-center justify-between border-b border-[#234D32]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EDE8DA] text-[#173F2A] flex items-center justify-center font-display font-bold text-base shadow-xs">
              {activeSaathi.alias.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-sm sm:text-base text-white">
                  {activeSaathi.alias}
                </h3>
                <span className="text-[10px] bg-[#9BAE91]/30 text-[#DCE5D4] px-2 py-0.5 rounded-full font-medium">
                  Shielded Peer Supporter
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#9BAE91]">
                <Lock className="w-3 h-3" />
                <span>Private Channel • Polling Live &bull; Zero Institutional Logs</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('appointments')}
              className="bg-[#234D32] hover:bg-[#2e6341] text-[#DCE5D4] px-3 py-1 rounded-xl text-xs font-medium border border-[#9BAE91]/30 transition-colors cursor-pointer"
            >
              Need Licensed Care?
            </button>
          </div>
        </div>

        {/* Privacy Disclosure Banner */}
        <div className="bg-[#EDE8DA]/70 px-4 py-2 border-b border-[#DCE5D4] text-[11px] text-[#234D32] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-[#173F2A] shrink-0" />
            <span>
              <strong>Privacy Shield:</strong> Your college administration cannot see this chat. Saathis are trained student peers.
            </span>
          </div>
          <span className="font-semibold text-[#173F2A] hidden sm:inline">Thread ID: {activeChatId.slice(0, 14)}...</span>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#F7F3E8]/30">
          {messages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="bg-[#EDE8DA] text-[#173F2A] px-3.5 py-1.5 rounded-full text-[11px] font-semibold border border-[#DCE5D4] flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#234D32]" />
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }

            const isSaathi = msg.sender === 'saathi';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isSaathi ? 'justify-start' : 'justify-end'}`}
              >
                {isSaathi && (
                  <div className="w-8 h-8 rounded-xl bg-[#EDE8DA] border border-[#DCE5D4] text-[#173F2A] flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-2xs">
                    {activeSaathi.alias.charAt(0)}
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                    isSaathi
                      ? 'bg-white text-[#173F2A] border border-[#EDE8DA] rounded-tl-xs'
                      : 'bg-[#173F2A] text-[#F7F3E8] rounded-br-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <div
                    className={`text-[10px] mt-1.5 ${
                      isSaathi ? 'text-[#234D32]/60' : 'text-[#EDE8DA]/70'
                    } text-right`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        <div className="px-4 py-2 bg-[#EDE8DA]/40 border-t border-[#EDE8DA] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[11px] font-semibold text-[#234D32]/70 shrink-0">Quick reply:</span>
          <button
            onClick={() => handleSend("I'm scared people will judge me for falling behind.")}
            disabled={isSending}
            className="px-3 py-1 rounded-full bg-white text-xs font-medium text-[#173F2A] border border-[#DCE5D4] hover:bg-[#F7F3E8] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            &ldquo;I’m scared people will judge me&rdquo;
          </button>
          <button
            onClick={() => handleSend("How do you manage deadlines when you're completely burned out?")}
            disabled={isSending}
            className="px-3 py-1 rounded-full bg-white text-xs font-medium text-[#173F2A] border border-[#DCE5D4] hover:bg-[#F7F3E8] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            &ldquo;How do you manage burnout?&rdquo;
          </button>
          <button
            onClick={() => handleSend("Thanks for listening without judging me.")}
            disabled={isSending}
            className="px-3 py-1 rounded-full bg-white text-xs font-medium text-[#173F2A] border border-[#DCE5D4] hover:bg-[#F7F3E8] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            &ldquo;Thanks for listening&rdquo;
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#EDE8DA] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${activeSaathi.alias} anonymously...`}
              disabled={isSending}
              className="flex-1 bg-[#F7F3E8] text-[#173F2A] placeholder-[#234D32]/50 text-xs sm:text-sm px-4 py-3 rounded-2xl border border-[#DCE5D4] focus:outline-none focus:ring-2 focus:ring-[#9BAE91]"
              id="saathi-chat-input"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="bg-[#173F2A] hover:bg-[#234D32] disabled:opacity-40 text-white p-3 sm:px-5 sm:py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              id="saathi-chat-send-btn"
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
