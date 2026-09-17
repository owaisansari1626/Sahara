import React, { useState, useEffect, useRef } from 'react';
import { DevSaathiProfile, DevInboxChatThread, SaathiMessage, Screen } from '../types';
import {
  saathiDevLogin,
  fetchSaathiInboxChats,
  fetchSaathiChatMessages,
  sendSaathiInboxReply,
} from '../api/endpoints';
import {
  ShieldCheck,
  Send,
  Lock,
  User,
  LogOut,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  Clock,
  Tag,
  Radio,
  HeartHandshake,
  Terminal,
} from 'lucide-react';

interface DevInboxScreenProps {
  onNavigate: (screen: Screen) => void;
}

const FOUNDING_DEVELOPERS = [
  { username: 'zakwan', name: 'Zakwan', alias: 'Zak_TechAnchor_23', role: 'Engineering & Sprint Lead' },
  { username: 'saifullah', name: 'Saifullah', alias: 'Saif_Pacer_22', role: 'Athletics & Stress Anchor' },
  { username: 'riyaz', name: 'Riyaz', alias: 'Riyaz_QuietAnchor_22', role: 'Design & Creative Lead' },
  { username: 'samiiksha', name: 'Samiiksha', alias: 'Sam_CalmListen_23', role: 'Biotech & Health Lead' },
];

export const DevInboxScreen: React.FC<DevInboxScreenProps> = ({ onNavigate }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('saathi_token'));
  const [profile, setProfile] = useState<DevSaathiProfile | null>(() => {
    try {
      const saved = localStorage.getItem('saathi_dev_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [threads, setThreads] = useState<DevInboxChatThread[]>([]);
  const [scope, setScope] = useState<'all' | 'my'>('all');
  const [selectedChatId, setSelectedChatId] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<SaathiMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleLogin = async (username: string, password?: string) => {
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await saathiDevLogin(username, password || 'sahara2026');
      setToken(res.token);
      setProfile(res.profile);
      localStorage.setItem('saathi_token', res.token);
      localStorage.setItem('saathi_dev_profile', JSON.stringify(res.profile));
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('saathi_token');
    localStorage.removeItem('saathi_dev_profile');
    setToken(null);
    setProfile(null);
  };

  // Poll assigned student threads every 3 seconds with active scope
  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    const loadThreads = async () => {
      try {
        const data = await fetchSaathiInboxChats(token, scope);
        if (isMounted && Array.isArray(data)) {
          setThreads(data);
          setSelectedChatId((current) => {
            if (!current || !data.some((t) => t.chat_id === current)) {
              return data.length > 0 ? data[0].chat_id : '';
            }
            return current;
          });
        }
      } catch (err) {
        console.warn('Error fetching inbox threads:', err);
      }
    };
    loadThreads();
    const interval = setInterval(loadThreads, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, scope]);

  // Poll selected student messages every 2.5 seconds
  useEffect(() => {
    if (!selectedChatId) {
      setChatMessages([]);
      return;
    }
    let isMounted = true;
    const loadMessages = async () => {
      try {
        const msgs = await fetchSaathiChatMessages(selectedChatId);
        if (isMounted && Array.isArray(msgs)) {
          setChatMessages(msgs);
        }
      } catch (err) {
        console.warn(`Error polling chat ${selectedChatId}:`, err);
      }
    };
    loadMessages();
    const interval = setInterval(loadMessages, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text || !selectedChatId || isSending) return;

    const newMsg: SaathiMessage = {
      id: `dev-${Date.now()}`,
      saathi_chat_id: selectedChatId,
      sender: 'saathi',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setReplyText('');
    setIsSending(true);

    try {
      await sendSaathiInboxReply(selectedChatId, text, token || undefined);
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsSending(false);
    }
  };

  // If not logged in, show Dev Login View
  if (!token || !profile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] max-w-lg mx-auto p-4 sm:p-8 flex items-center justify-center">
        <div className="bg-white/95 rounded-3xl border border-[#DCE5D4] shadow-xl p-6 sm:p-8 w-full space-y-6 animate-in fade-in">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#173F2A] text-white flex items-center justify-center mx-auto shadow-xs">
              <Terminal className="w-6 h-6 text-[#9BAE91]" />
            </div>
            <h2 className="font-display text-2xl font-bold text-[#173F2A]">
              Saathi Developer Portal
            </h2>
            <p className="text-xs text-[#234D32]/80 max-w-xs mx-auto">
              Real-time peer reply inbox for the founding student supporters.
            </p>
          </div>

          {/* Quick 1-Click Founding Dev Buttons */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-[#173F2A]">1-Click Developer Sign In:</p>
            <div className="grid grid-cols-2 gap-2">
              {FOUNDING_DEVELOPERS.map((dev) => (
                <button
                  key={dev.username}
                  onClick={() => handleLogin(dev.username)}
                  disabled={isLoggingIn}
                  className="p-3 rounded-2xl bg-[#F7F3E8] border border-[#DCE5D4] hover:border-[#173F2A] hover:bg-[#EBF2EA] text-left transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#173F2A] group-hover:text-[#234D32]">{dev.name}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-stone-500 truncate mt-0.5">{dev.alias}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#EDE8DA]"></div>
            <span className="flex-shrink mx-3 text-stone-400 text-[10px] font-bold uppercase">Or Manual Login</span>
            <div className="flex-grow border-t border-[#EDE8DA]"></div>
          </div>

          {/* Manual Login Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (usernameInput.trim()) handleLogin(usernameInput.trim(), passwordInput);
            }}
            className="space-y-3"
          >
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#173F2A]">Username / Dev Handle:</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. zakwan"
                className="w-full bg-[#F7F3E8] text-[#173F2A] px-4 py-2.5 rounded-xl border border-[#DCE5D4] text-xs focus:outline-none focus:ring-2 focus:ring-[#9BAE91]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#173F2A]">Password:</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F7F3E8] text-[#173F2A] px-4 py-2.5 rounded-xl border border-[#DCE5D4] text-xs focus:outline-none focus:ring-2 focus:ring-[#9BAE91]"
              />
            </div>

            <button
              type="submit"
              disabled={!usernameInput.trim() || isLoggingIn}
              className="w-full bg-[#173F2A] hover:bg-[#234D32] disabled:opacity-50 text-white py-3 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              {isLoggingIn ? 'Authenticating...' : 'Sign in to Saathi Inbox'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  const selectedThread = threads.find((t) => t.chat_id === selectedChatId) || (threads.length > 0 ? threads[0] : null);

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4 animate-in fade-in">
      
      {/* Dev Portal Header */}
      <div className="bg-white/95 rounded-2xl border border-[#DCE5D4] p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#173F2A] text-white flex items-center justify-center font-bold text-base shadow-xs">
            {profile.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-base text-[#173F2A]">
                {profile.name} <span className="text-stone-400 font-normal">({profile.alias})</span>
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>ONLINE &bull; READY</span>
              </span>
            </div>
            <p className="text-xs text-[#234D32]/80">
              {profile.department} &bull; {profile.year}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-stone-500 font-medium hidden md:inline">
            Active Student Queue: <strong>{threads.length} threads</strong>
          </span>
          <button
            onClick={handleLogout}
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Inbox 2-Column Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[72vh] sm:h-[76vh]">
        
        {/* Left Sidebar: Assigned Student Threads (4 cols) */}
        <div className="lg:col-span-4 bg-white/95 rounded-3xl border border-[#DCE5D4] shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[#EDE8DA] flex items-center justify-between shrink-0 bg-[#F7F3E8]/50 gap-2">
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-[#DCE5D4]">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  scope === 'all' ? 'bg-[#173F2A] text-white shadow-2xs' : 'text-stone-600 hover:text-[#173F2A]'
                }`}
              >
                All Chats ({threads.length})
              </button>
              <button
                type="button"
                onClick={() => setScope('my')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  scope === 'my' ? 'bg-[#173F2A] text-white shadow-2xs' : 'text-stone-600 hover:text-[#173F2A]'
                }`}
              >
                My Chats
              </button>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Live (3s)</span>
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#EDE8DA]/60">
            {threads.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#234D32]/70">
                No active student conversations in this view.
              </div>
            ) : (
              threads.map((thread) => {
                const isSelected = selectedChatId === thread.chat_id;
                return (
                  <button
                    key={thread.chat_id}
                    onClick={() => setSelectedChatId(thread.chat_id)}
                    className={`w-full text-left p-3.5 transition-all flex flex-col gap-1.5 cursor-pointer ${
                      isSelected ? 'bg-[#EBF2EA] border-l-4 border-[#173F2A]' : 'hover:bg-[#F7F3E8]/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#173F2A] truncate max-w-[150px]">
                        {thread.student_alias || 'Student'} <span className="font-mono text-[10px] text-stone-400">({thread.chat_id.slice(0, 11)})</span>
                      </span>
                      <span className="text-[10px] text-stone-400">{thread.last_activity}</span>
                    </div>

                    {/* Distress Tags */}
                    <div className="flex flex-wrap gap-1">
                      {thread.matched_tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[9px] bg-white border border-[#9BAE91]/40 text-[#173F2A] px-1.5 py-0.2 rounded font-medium uppercase"
                        >
                          {tag.replace('_', ' ')}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-[#234D32]/80 truncate mt-0.5">
                      {thread.last_message}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Chat Window: Real-Time Conversation (8 cols) */}
        <div className="lg:col-span-8 bg-white/95 rounded-3xl border border-[#DCE5D4] shadow-md flex flex-col overflow-hidden">
          
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-[#EDE8DA] flex items-center justify-between shrink-0 bg-[#F7F3E8]/50">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#173F2A]" />
                  <div>
                    <h4 className="font-bold text-xs text-[#173F2A]">
                      Student Thread &bull; <span className="font-mono">{selectedThread.chat_id}</span>
                    </h4>
                    <p className="text-[10px] text-[#234D32]/70">
                      Student sees you as <strong>{profile.alias}</strong> (Identity Shielded)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                  <span>Real-time polling active (2.5s)</span>
                </div>
              </div>

              {/* Conversation Stream */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-[#F7F3E8]/20">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-10 text-xs text-stone-400">
                    Loading conversation messages...
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isDevSender = msg.sender === 'saathi';
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-2.5 ${isDevSender ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isDevSender && (
                          <div className="w-8 h-8 rounded-xl bg-[#EDE8DA] text-[#173F2A] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            S
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                            isDevSender
                              ? 'bg-[#173F2A] text-white rounded-br-xs'
                              : 'bg-white text-[#173F2A] border border-[#EDE8DA] rounded-tl-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-70">
                            <span className="font-bold">{isDevSender ? profile.alias : 'Anonymous Student'}</span>
                            <span>{msg.timestamp}</span>
                          </div>
                          <p className="whitespace-pre-line">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Developer Reply Input */}
              <div className="p-3 sm:p-4 bg-white border-t border-[#EDE8DA] shrink-0">
                <form onSubmit={handleSendReply} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to student as ${profile.alias}...`}
                    disabled={isSending}
                    className="flex-1 bg-[#F7F3E8] text-[#173F2A] placeholder-[#234D32]/50 text-xs sm:text-sm px-4 py-3 rounded-2xl border border-[#DCE5D4] focus:outline-none focus:ring-2 focus:ring-[#9BAE91]"
                    id="dev-inbox-reply-input"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSending}
                    className="bg-[#173F2A] hover:bg-[#234D32] disabled:opacity-40 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    id="dev-inbox-send-btn"
                  >
                    <Send className="w-4 h-4 text-[#9BAE91]" />
                    <span>Reply</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-500">
              <MessageSquare className="w-10 h-10 text-stone-300 mb-2" />
              <p className="font-bold text-sm text-[#173F2A]">No conversations in queue</p>
              <p className="text-xs text-[#234D32]/70 mt-1">Waiting for students needing peer support...</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
