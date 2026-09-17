import React from 'react';
import { ShieldCheck, UserX, EyeOff, BarChart2, Lock, ArrowDown, Server, Database, School, CheckCircle2, FileText, ChevronRight } from 'lucide-react';

export const PrivacyCenterScreen: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#DCE5D4] text-xs font-semibold text-[#173F2A]">
          <Lock className="w-3.5 h-3.5 text-[#234D32]" />
          <span>Cryptographic & Structural Isolation</span>
        </div>

        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#173F2A]">
          Your privacy isn’t a promise. It’s architecture.
        </h2>

        <p className="text-base text-[#173F2A]/80 font-normal">
          Why Indian college students trust Sahara: The platform is structurally separated from university networks, grading servers, and administration databases.
        </p>
      </div>

      {/* 3 Large Privacy Pillars Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: NO IDENTITY */}
        <div className="bg-white/95 rounded-3xl p-7 border-2 border-[#DCE5D4] hover:border-[#9BAE91] shadow-md transition-all space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#DCE5D4] text-[#173F2A] flex items-center justify-center">
            <UserX className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#234D32] bg-[#EDE8DA] px-2.5 py-0.5 rounded-full">
              Pillar 1
            </span>
            <h3 className="font-display text-2xl font-bold text-[#173F2A]">
              NO IDENTITY
            </h3>
            <p className="text-xs text-[#234D32]/80 leading-relaxed">
              We never ask for what we don&apos;t need. Zero tracking of student identities from the very first greeting.
            </p>
          </div>

          <ul className="space-y-2 pt-2 border-t border-[#EDE8DA] text-xs font-semibold text-[#173F2A]">
            <li className="flex items-center gap-2 text-rose-800">
              <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-bold">✕</span>
              <span>No Student Names</span>
            </li>
            <li className="flex items-center gap-2 text-rose-800">
              <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-bold">✕</span>
              <span>No Roll Numbers / College IDs</span>
            </li>
            <li className="flex items-center gap-2 text-rose-800">
              <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-bold">✕</span>
              <span>No College Email Sign-in</span>
            </li>
          </ul>
        </div>

        {/* Card 2: NO COLLEGE ACCESS */}
        <div className="bg-white/95 rounded-3xl p-7 border-2 border-[#DCE5D4] hover:border-[#9BAE91] shadow-md transition-all space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#DCE5D4] text-[#173F2A] flex items-center justify-center">
            <EyeOff className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#234D32] bg-[#EDE8DA] px-2.5 py-0.5 rounded-full">
              Pillar 2
            </span>
            <h3 className="font-display text-2xl font-bold text-[#173F2A]">
              NO COLLEGE ACCESS
            </h3>
            <p className="text-xs text-[#234D32]/80 leading-relaxed">
              Individual conversations and triage evaluations are strictly isolated on an independent, non-institutional infrastructure.
            </p>
          </div>

          <ul className="space-y-2 pt-2 border-t border-[#EDE8DA] text-xs font-semibold text-[#173F2A]">
            <li className="flex items-center gap-2 text-[#3D7A5A]">
              <CheckCircle2 className="w-4 h-4 text-[#3D7A5A]" />
              <span>Deans & faculty cannot view chats</span>
            </li>
            <li className="flex items-center gap-2 text-[#3D7A5A]">
              <CheckCircle2 className="w-4 h-4 text-[#3D7A5A]" />
              <span>Zero academic or disciplinary impact</span>
            </li>
            <li className="flex items-center gap-2 text-[#3D7A5A]">
              <CheckCircle2 className="w-4 h-4 text-[#3D7A5A]" />
              <span>End-to-end ephemeral encryption</span>
            </li>
          </ul>
        </div>

        {/* Card 3: AGGREGATE ONLY */}
        <div className="bg-white/95 rounded-3xl p-7 border-2 border-[#DCE5D4] hover:border-[#9BAE91] shadow-md transition-all space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#DCE5D4] text-[#173F2A] flex items-center justify-center">
            <BarChart2 className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#234D32] bg-[#EDE8DA] px-2.5 py-0.5 rounded-full">
              Pillar 3
            </span>
            <h3 className="font-display text-2xl font-bold text-[#173F2A]">
              AGGREGATE ONLY
            </h3>
            <p className="text-xs text-[#234D32]/80 leading-relaxed">
              Institutions only receive high-level anonymous wellness trends to budget wellness initiatives and schedule exam breaks.
            </p>
          </div>

          <div className="p-3 bg-[#F7F3E8] rounded-xl border border-[#EDE8DA] text-[11px] text-[#234D32] space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span>✓ Academic pressure:</span>
              <span className="text-[#173F2A] font-bold">34%</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>✓ Sleep & burnout:</span>
              <span className="text-[#173F2A] font-bold">24%</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>✓ Relationship & loneliness:</span>
              <span className="text-[#173F2A] font-bold">18%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Visual System Architecture Diagram */}
      <div className="bg-white/95 rounded-3xl border border-[#DCE5D4] p-6 sm:p-10 shadow-lg space-y-8">
        
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#234D32] bg-[#DCE5D4] px-3 py-1 rounded-full">
            System Topology
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#173F2A]">
            Data Flow & Institutional Firewalls
          </h3>
          <p className="text-xs sm:text-sm text-[#173F2A]/70 max-w-xl mx-auto">
            A visual representation of how student interactions remain strictly private while university stakeholders only receive anonymized trend telemetry.
          </p>
        </div>

        {/* The Architecture Flow Graphic */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
          
          {/* Left: Student Pipeline (Protected) */}
          <div className="lg:col-span-6 bg-[#EBF2EA] p-6 rounded-3xl border-2 border-[#9BAE91] space-y-5">
            <div className="flex items-center justify-between border-b border-[#9BAE91]/40 pb-3">
              <span className="font-display font-bold text-base text-[#173F2A]">
                1. Student Private Domain
              </span>
              <span className="text-[10px] bg-[#173F2A] text-white px-2.5 py-0.5 rounded-full font-bold">
                Zero Identification
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#9BAE91] shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-[#DCE5D4] flex items-center justify-center font-bold text-[#173F2A]">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-[#173F2A]">STUDENT</h4>
                  <p className="text-[#234D32]/70 text-[11px]">Opens browser via any anonymous device</p>
                </div>
              </div>

              <div className="flex justify-center text-[#234D32]">
                <ArrowDown className="w-4 h-4 animate-bounce" />
              </div>

              <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#9BAE91] shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-[#DCE5D4] flex items-center justify-center font-bold text-[#173F2A]">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-[#173F2A]">SAHARA APPLICATION</h4>
                  <p className="text-[#234D32]/70 text-[11px]">Empathetic chat + Silent AI triage (No labels)</p>
                </div>
              </div>

              <div className="flex justify-center text-[#234D32]">
                <ArrowDown className="w-4 h-4 animate-bounce" />
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#173F2A] text-white rounded-2xl shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-[#234D32] flex items-center justify-center font-bold text-[#9BAE91]">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-white">INDEPENDENT PLATFORM</h4>
                  <p className="text-[#DCE5D4] text-[11px]">Encrypted peer channel & licensed therapy routing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Center Divider / Cryptographic Barrier */}
          <div className="lg:col-span-1 flex lg:flex-col items-center justify-center gap-2 py-4">
            <div className="h-0.5 lg:h-20 w-12 lg:w-0.5 bg-[#9BAE91]" />
            <div className="p-2 rounded-full bg-[#173F2A] text-white shadow-xs" title="Cryptographic anonymization barrier">
              <Lock className="w-4 h-4 text-[#9BAE91]" />
            </div>
            <div className="h-0.5 lg:h-20 w-12 lg:w-0.5 bg-[#9BAE91]" />
          </div>

          {/* Right: College Pipeline (Anonymized Aggregate Only) */}
          <div className="lg:col-span-5 bg-[#F7F3E8] p-6 rounded-3xl border border-[#EDE8DA] space-y-5">
            <div className="flex items-center justify-between border-b border-[#EDE8DA] pb-3">
              <span className="font-display font-bold text-base text-[#173F2A]">
                2. College Portal
              </span>
              <span className="text-[10px] bg-[#EDE8DA] text-stone-700 px-2.5 py-0.5 rounded-full font-bold">
                Aggregate Telemetry
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-[#EDE8DA] shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-[#EDE8DA] flex items-center justify-center font-bold text-[#173F2A]">
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[#173F2A]">COLLEGE ADMINISTRATION</h4>
                  <p className="text-stone-500 text-[11px]">Only receives anonymized macro insights</p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#EDE8DA] space-y-2 text-[11px]">
                <p className="font-bold text-[#173F2A]">What College Sees:</p>
                <div className="space-y-1.5 text-stone-600">
                  <p>✓ &ldquo;42% increase in exam stress week before midterms&rdquo;</p>
                  <p>✓ &ldquo;Hostel block B requesting more quiet study rooms&rdquo;</p>
                  <p>✓ &ldquo;Average student return trust score: 94.2%&rdquo;</p>
                </div>
                <div className="pt-2 border-t border-stone-100 text-[10px] text-rose-700 font-semibold">
                  ⛔ Strictly blocked from viewing student transcripts or personal names.
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
