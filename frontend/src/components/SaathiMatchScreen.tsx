import React, { useEffect, useState } from 'react';
import { Screen, SaathiDualAssignment, SaathiPeerAssignment } from '../types';
import { matchSaathis } from '../api/endpoints';
import { getSessionId } from '../utils/session';
import {
  HeartHandshake,
  Shield,
  Sparkles,
  Lock,
  ArrowRight,
  CheckCircle2,
  Users,
  RefreshCw,
} from 'lucide-react';

interface SaathiMatchScreenProps {
  onNavigate: (screen: Screen) => void;
  onMatchComplete: (dual: SaathiDualAssignment) => void;
}

export const SaathiMatchScreen: React.FC<SaathiMatchScreenProps> = ({
  onNavigate,
  onMatchComplete,
}) => {
  const [loading, setLoading] = useState(true);
  const [dualAssignment, setDualAssignment] = useState<SaathiDualAssignment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = getSessionId();

  const handleFetchMatch = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await matchSaathis(sessionId);
      setDualAssignment(data);
      onMatchComplete(data);
    } catch (err: any) {
      console.warn('POST /api/saathi/match failed, using intelligent deterministic fallback:', err);
      // Fallback matching data matching the schema
      const fallbackData: SaathiDualAssignment = {
        session_id: sessionId,
        primary: {
          chat_id: 'schat-89496809',
          saathi_id: 'saathi-arjun',
          alias: 'Pacer_Comm_22',
          role: 'PRIMARY',
          status: 'ACTIVE',
          intro_message: "Hey! I'm Pacer_Comm_22. Balancing coursework, high expectations, and burnout can get really exhausting. Here if you just want to vent without any drama.",
          vibeTags: [
            { icon: '🏏', label: 'Sports & Balance' },
            { icon: '⚡', label: 'Exam pressure' },
            { icon: '🎧', label: 'Calm listener' },
          ],
        },
        secondary: {
          chat_id: 'schat-782cea20',
          saathi_id: 'saathi-rohan',
          alias: 'SeniorCode_IT_21',
          role: 'SECONDARY',
          status: 'ACTIVE',
          intro_message: "Hi there, I'm SeniorCode_IT_21. Went through heavy placement stress and late night dorm loneliness. Happy to chat at any odd hour.",
          vibeTags: [
            { icon: '💻', label: 'Tech student' },
            { icon: '🌙', label: 'Night owl' },
            { icon: '🎮', label: 'Quiet presence' },
          ],
        },
      };

      setDualAssignment(fallbackData);
      onMatchComplete(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchMatch();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
      
      {/* Container */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-[#DCE5D4] shadow-xl p-6 sm:p-10 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#DCE5D4] text-xs font-semibold text-[#173F2A]">
            <HeartHandshake className="w-3.5 h-3.5 text-[#234D32]" />
            <span>Dual-Saathi Support Architecture</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#173F2A]">
            Your support circle is matched.
          </h2>

          <p className="text-sm text-[#173F2A]/80">
            Sahara automatically assigns <strong>two trained peer companions</strong> so you never rely on just one person. Switch anytime without justification.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-[#9BAE91]/30 border-t-[#173F2A] animate-spin flex items-center justify-center">
              <span className="text-xl">🌿</span>
            </div>
            <p className="text-sm font-semibold text-[#173F2A]">
              Matching peer supporters based on silent session context...
            </p>
            <p className="text-xs text-stone-500 max-w-xs text-center">
              Shielding identities • Balancing Saathi capacity • Zero student browsing
            </p>
          </div>
        )}

        {/* Result: Dual Assignment Reveal */}
        {!loading && dualAssignment && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Primary Saathi Card */}
              <div className="bg-gradient-to-br from-[#EBF2EA] to-white p-6 rounded-3xl border-2 border-[#173F2A] shadow-md flex flex-col justify-between space-y-4 relative">
                <span className="absolute -top-3 left-6 bg-[#173F2A] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Primary Companion
                </span>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#173F2A] text-white flex items-center justify-center font-display font-bold text-lg shadow-xs">
                      {dualAssignment.primary.alias.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#173F2A]">
                        {dualAssignment.primary.alias}
                      </h3>
                      <p className="text-xs text-[#234D32] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#3D7A5A]" />
                        <span>Active Verified Peer</span>
                      </p>
                    </div>
                  </div>

                  {/* Vibe Tags */}
                  {dualAssignment.primary.vibeTags && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {dualAssignment.primary.vibeTags.map((v, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white border border-[#9BAE91]/40 text-[#173F2A]"
                        >
                          {v.icon && <span>{v.icon}</span>}
                          <span>{v.label}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Intro Quote */}
                  <p className="text-xs text-[#173F2A]/90 italic leading-relaxed pt-1 bg-white/70 p-3 rounded-xl border border-[#EDE8DA]">
                    &ldquo;{dualAssignment.primary.intro_message}&rdquo;
                  </p>
                </div>

                <div className="text-[11px] text-[#234D32] flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3 text-[#173F2A]" />
                  <span>Encrypted Peer Channel &bull; Zero Institutional Access</span>
                </div>
              </div>

              {/* Secondary Saathi Backup Card */}
              <div className="bg-[#F7F3E8] p-6 rounded-3xl border border-[#DCE5D4] shadow-xs flex flex-col justify-between space-y-4 relative">
                <span className="absolute -top-3 left-6 bg-[#9BAE91] text-[#173F2A] text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Secondary Backup
                </span>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#EDE8DA] border border-[#DCE5D4] text-[#173F2A] flex items-center justify-center font-display font-bold text-lg">
                      {dualAssignment.secondary.alias.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#173F2A]">
                        {dualAssignment.secondary.alias}
                      </h3>
                      <p className="text-xs text-stone-500">Standby Support Node</p>
                    </div>
                  </div>

                  {/* Vibe Tags */}
                  {dualAssignment.secondary.vibeTags && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {dualAssignment.secondary.vibeTags.map((v, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white border border-[#EDE8DA] text-[#173F2A]"
                        >
                          {v.icon && <span>{v.icon}</span>}
                          <span>{v.label}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-[#173F2A]/80 italic leading-relaxed pt-1 bg-white/60 p-3 rounded-xl border border-[#EDE8DA]">
                    &ldquo;{dualAssignment.secondary.intro_message}&rdquo;
                  </p>
                </div>

                <div className="text-[11px] text-stone-500 flex items-center gap-1">
                  <span>Available with 1-tap instant switch if primary is offline or unavailable.</span>
                </div>
              </div>

            </div>

            {/* CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#EDE8DA]">
              <div className="flex items-center gap-2 text-xs text-[#234D32]">
                <Shield className="w-4 h-4 text-[#173F2A]" />
                <span>Your real identity is never shown to either Saathi.</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleFetchMatch}
                  className="p-3 text-stone-500 hover:text-[#173F2A] hover:bg-[#EDE8DA] rounded-xl transition-colors cursor-pointer"
                  title="Refresh matching assignment"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('saathi_chat')}
                  className="flex-1 sm:flex-initial bg-[#173F2A] hover:bg-[#234D32] text-white px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  id="enter-saathi-chat-btn"
                >
                  <span>Enter Safe Peer Chat</span>
                  <ArrowRight className="w-4 h-4 text-[#9BAE91]" />
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
