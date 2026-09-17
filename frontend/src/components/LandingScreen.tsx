import React from 'react';
import { Screen } from '../types';
import { ShieldCheck, HeartHandshake, Lock, ArrowRight, Sparkles, CheckCircle2, UserX, School, EyeOff, MessageSquareText, PhoneCall, Shield } from 'lucide-react';

interface LandingScreenProps {
  onStart: () => void;
  onNavigate: (screen: Screen) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart, onNavigate }) => {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden">
      {/* Subtle botanical background accents */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#DCE5D4]/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 -ml-24 w-80 h-80 rounded-full bg-[#EDE8DA]/70 blur-3xl pointer-events-none" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-16 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-7 space-y-7 text-left">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#EDE8DA] border border-[#DCE5D4] text-[#173F2A]">
              <span className="text-sm">🌿</span>
              <span className="text-xs font-semibold tracking-wide text-[#234D32]">
                Sahara • साथी • Peer-First Mental Health
              </span>
            </div>

            {/* Main Hero Headlines */}
            <div className="space-y-3">
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#173F2A] leading-none">
                  Sahara
                </h1>
                <span className="font-devanagari text-2xl sm:text-4xl text-[#234D32]/80 font-medium">
                  सहारा
                </span>
              </div>

              <p className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#234D32] leading-tight pt-1">
                &ldquo;You don’t have to say you need help.&rdquo;
              </p>

              <p className="text-sm sm:text-base lg:text-lg text-[#173F2A]/80 max-w-2xl font-normal leading-relaxed">
                A private, zero-judgment first step for students facing academic pressure, burnout, or late-night loneliness. No forms, no college notifications, and zero clinical labels.
              </p>
            </div>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <button
                onClick={onStart}
                className="bg-[#173F2A] hover:bg-[#234D32] text-[#F7F3E8] px-7 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-3 group cursor-pointer"
                id="hero-start-conversation-btn"
              >
                <span>Start a private conversation</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#9BAE91] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('privacy')}
                className="bg-[#EDE8DA]/70 hover:bg-[#EDE8DA] text-[#173F2A] border border-[#DCE5D4] px-5 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                id="hero-how-privacy-works-btn"
              >
                <Lock className="w-4 h-4 text-[#234D32]" />
                <span>How Sahara protects privacy</span>
              </button>
            </div>

            {/* 3 Privacy & Trust Indicators */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pt-3 border-t border-[#DCE5D4]/70">
              <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-2 p-2.5 rounded-xl bg-white/70 border border-[#EDE8DA]">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#DCE5D4]/70 flex items-center justify-center text-[#173F2A] shrink-0">
                  <UserX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#173F2A]">No Login</h4>
                  <p className="text-[10px] sm:text-[11px] text-[#234D32]/70 hidden xs:block">Zero credentials</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-2 p-2.5 rounded-xl bg-white/70 border border-[#EDE8DA]">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#DCE5D4]/70 flex items-center justify-center text-[#173F2A] shrink-0">
                  <School className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#173F2A]">No College ID</h4>
                  <p className="text-[10px] sm:text-[11px] text-[#234D32]/70 hidden xs:block">Zero faculty logs</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-2 p-2.5 rounded-xl bg-white/70 border border-[#EDE8DA]">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#DCE5D4]/70 flex items-center justify-center text-[#173F2A] shrink-0">
                  <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#173F2A]">Shielded</h4>
                  <p className="text-[10px] sm:text-[11px] text-[#234D32]/70 hidden xs:block">Peer alias protection</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Card & Calm Illustration */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md bg-gradient-to-b from-[#EDE8DA]/90 to-white/95 p-5 sm:p-7 rounded-3xl shadow-xl border border-[#DCE5D4]">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#EDE8DA]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-[#173F2A]">Anonymous Companion Entry</span>
                </div>
                <span className="text-[10px] font-bold text-[#234D32] bg-[#DCE5D4] px-2.5 py-0.5 rounded-full">
                  100% Shielded
                </span>
              </div>

              {/* Calm Student at Desk SVG Art */}
              <div className="my-4 flex items-center justify-center">
                <svg viewBox="0 0 360 220" className="w-full h-auto max-w-[280px] sm:max-w-[320px] drop-shadow-xs" aria-label="Calm student resting at study desk with laptop and tea">
                  <defs>
                    <linearGradient id="warmLight" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#F7F3E8" />
                      <stop offset="100%" stopColor="#EDE8DA" />
                    </linearGradient>
                    <linearGradient id="plantGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#9BAE91" />
                      <stop offset="100%" stopColor="#234D32" />
                    </linearGradient>
                    <linearGradient id="windowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#DCE5D4" />
                      <stop offset="100%" stopColor="#EAF2E7" />
                    </linearGradient>
                  </defs>

                  {/* Window in background */}
                  <rect x="220" y="20" width="110" height="90" rx="10" fill="url(#windowGrad)" stroke="#9BAE91" strokeWidth="2" opacity="0.6"/>
                  <line x1="275" y1="20" x2="275" y2="110" stroke="#9BAE91" strokeWidth="1.5" opacity="0.4"/>
                  <line x1="220" y1="65" x2="330" y2="65" stroke="#9BAE91" strokeWidth="1.5" opacity="0.4"/>
                  <circle cx="280" cy="45" r="14" fill="#F7F3E8" opacity="0.8"/>

                  {/* Desk Surface */}
                  <rect x="20" y="145" width="320" height="12" rx="4" fill="#234D32" />
                  <rect x="35" y="157" width="12" height="50" rx="2" fill="#173F2A" />
                  <rect x="313" y="157" width="12" height="50" rx="2" fill="#173F2A" />

                  {/* Desk Lamp */}
                  <path d="M 40 145 L 50 85 L 75 95" fill="none" stroke="#234D32" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 68 85 L 90 95 L 78 115 Z" fill="#9BAE91" />
                  <polygon points="80,105 160,150 110,150" fill="#FFF8DE" opacity="0.35" />

                  {/* Laptop */}
                  <rect x="120" y="125" width="70" height="20" rx="2" fill="#9BAE91" />
                  <polygon points="110,145 200,145 190,140 120,140" fill="#234D32" opacity="0.8" />
                  <circle cx="155" cy="135" r="3" fill="#F7F3E8" />

                  {/* Student */}
                  <rect x="220" y="110" width="12" height="60" rx="4" fill="#EDE8DA" stroke="#9BAE91" strokeWidth="2" />
                  <path d="M 185 145 C 190 120, 205 105, 230 110 C 245 115, 255 130, 255 150 Z" fill="#234D32" />
                  <circle cx="218" cy="85" r="18" fill="#173F2A" />
                  <circle cx="215" cy="88" r="15" fill="#E8C5A8" />
                  <path d="M 205 80 Q 220 70 230 80 Q 220 90 205 80 Z" fill="#173F2A" />
                  <path d="M 215 115 Q 185 125 165 145" fill="none" stroke="#234D32" strokeWidth="12" strokeLinecap="round" />

                  {/* Chai Cup */}
                  <rect x="85" y="130" width="18" height="15" rx="3" fill="#DCE5D4" stroke="#234D32" strokeWidth="1.5" />
                  <path d="M 103 133 Q 110 137 103 142" fill="none" stroke="#234D32" strokeWidth="1.5" />
                  <path d="M 91 125 Q 94 118 91 112" fill="none" stroke="#9BAE91" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

                  {/* Plant */}
                  <path d="M 290 145 L 295 125 L 315 125 L 320 145 Z" fill="#DCE5D4" stroke="#234D32" strokeWidth="1.5" />
                  <path d="M 305 125 Q 295 100 285 105 Q 298 112 305 125 Z" fill="url(#plantGrad)" />
                  <path d="M 305 125 Q 315 95 325 102 Q 315 110 305 125 Z" fill="url(#plantGrad)" />
                  <path d="M 305 125 Q 305 85 300 90 Q 308 105 305 125 Z" fill="#3D7A5A" />
                </svg>
              </div>

              {/* Sample Dialogue */}
              <div className="space-y-2.5 bg-[#F7F3E8] p-3.5 rounded-2xl border border-[#DCE5D4]">
                <div className="flex items-start gap-2">
                  <span className="text-sm shrink-0 mt-0.5">🌿</span>
                  <div className="bg-white p-2.5 rounded-2xl rounded-tl-xs shadow-2xs border border-[#EDE8DA] text-xs text-[#173F2A]">
                    <p className="font-semibold text-[#234D32] text-[11px] mb-0.5">Sahara</p>
                    <p>&ldquo;Hey. You don’t have to carry this alone. What feels heaviest right now?&rdquo;</p>
                  </div>
                </div>
                <div className="flex items-end justify-end">
                  <div className="bg-[#173F2A] text-[#F7F3E8] p-2.5 rounded-2xl rounded-br-xs shadow-2xs text-xs">
                    <p className="font-medium">&ldquo;Exams are next week and I cannot sleep.&rdquo;</p>
                  </div>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="mt-3.5 pt-3 flex items-center justify-between text-xs text-[#234D32]">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#9BAE91]" />
                  Instant session UUID
                </span>
                <button
                  onClick={onStart}
                  className="font-bold text-[#173F2A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Enter chat →
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* 4-Step Architecture Flow */}
        <section className="mt-16 sm:mt-20 pt-10 border-t border-[#DCE5D4]">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#234D32] bg-[#DCE5D4] px-3 py-1 rounded-full">
              Sahara’s Privacy Architecture
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#173F2A] mt-2.5">
              Support before a student has to ask for it
            </h2>
            <p className="text-xs sm:text-sm text-[#173F2A]/70 mt-1.5">
              Traditional college counseling centers require forms, appointments, and institutional disclosure. Sahara removes every barrier.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Step 1 */}
            <div className="bg-white/85 p-5 rounded-2xl border border-[#EDE8DA] shadow-xs relative">
              <span className="absolute -top-2.5 left-5 bg-[#173F2A] text-[#F7F3E8] text-[10px] font-bold px-2 py-0.5 rounded-full">
                Step 1
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#DCE5D4] flex items-center justify-center text-[#173F2A] mb-3 mt-1">
                <UserX className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#173F2A] mb-1">Zero-Identity UUID</h3>
              <p className="text-xs text-[#234D32]/80 leading-relaxed">
                Unique client session generated on first load. No names, no college emails, no roll numbers.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white/85 p-5 rounded-2xl border border-[#EDE8DA] shadow-xs relative">
              <span className="absolute -top-2.5 left-5 bg-[#173F2A] text-[#F7F3E8] text-[10px] font-bold px-2 py-0.5 rounded-full">
                Step 2
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#DCE5D4] flex items-center justify-center text-[#173F2A] mb-3 mt-1">
                <MessageSquareText className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#173F2A] mb-1">Empathetic Companion</h3>
              <p className="text-xs text-[#234D32]/80 leading-relaxed">
                Conversational triage powered by server-side AI. Classifies distress without medical labeling.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white/85 p-5 rounded-2xl border border-[#EDE8DA] shadow-xs relative">
              <span className="absolute -top-2.5 left-5 bg-[#173F2A] text-[#F7F3E8] text-[10px] font-bold px-2 py-0.5 rounded-full">
                Step 3
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#DCE5D4] flex items-center justify-center text-[#173F2A] mb-3 mt-1">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#173F2A] mb-1">Dual-Saathi Assignment</h3>
              <p className="text-xs text-[#234D32]/80 leading-relaxed">
                Automated match assigns 2 peer supporters (Primary & Secondary). Instant focus switch with zero guilt.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white/85 p-5 rounded-2xl border border-[#EDE8DA] shadow-xs relative">
              <span className="absolute -top-2.5 left-5 bg-[#173F2A] text-[#F7F3E8] text-[10px] font-bold px-2 py-0.5 rounded-full">
                Step 4
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#DCE5D4] flex items-center justify-center text-[#173F2A] mb-3 mt-1">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#173F2A] mb-1">Decoupled Clinical Care</h3>
              <p className="text-xs text-[#234D32]/80 leading-relaxed">
                Professional psychologist booking stored in an isolated table with zero links to chat logs or session UUIDs.
              </p>
            </div>

          </div>
        </section>

      </main>

      {/* Bottom Sticky Bar */}
      <footer className="bg-[#EDE8DA]/80 border-t border-[#DCE5D4] py-4 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#173F2A]">
          <p className="font-display font-bold text-sm">
            &ldquo;No labels. No judgment. Just support that finds you.&rdquo;
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('admin')}
              className="text-[#234D32] hover:text-[#173F2A] font-semibold text-xs px-2 py-1 underline cursor-pointer"
            >
              Admin Dashboard
            </button>
            <button
              onClick={onStart}
              className="bg-[#173F2A] hover:bg-[#234D32] text-[#F7F3E8] px-4 py-1.5 rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
            >
              Start Anonymously
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
