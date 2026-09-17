import React, { useState, useEffect } from 'react';
import { Screen, SaathiDualAssignment, SaathiPeerAssignment } from './types';
import { getSessionId } from './utils/session';
import { Navbar } from './components/Navbar';
import { LandingScreen } from './components/LandingScreen';
import { CheckInScreen } from './components/CheckInScreen';
import { SaharaChatScreen } from './components/SaharaChatScreen';
import { SaathiMatchScreen } from './components/SaathiMatchScreen';
import { SaathiChatScreen } from './components/SaathiChatScreen';
import { DevInboxScreen } from './components/DevInboxScreen';
import { ProfessionalSupportScreen } from './components/ProfessionalSupportScreen';
import { PrivacyCenterScreen } from './components/PrivacyCenterScreen';
import { StudentDashboardScreen } from './components/StudentDashboardScreen';
import { ImpactDashboardScreen } from './components/ImpactDashboardScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [dualAssignment, setDualAssignment] = useState<SaathiDualAssignment | null>(() => {
    try {
      const saved = localStorage.getItem('sahara_dual_assignment');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Ensure persistent session ID is generated on first load
  useEffect(() => {
    getSessionId();
  }, []);

  // Sync dual assignment to storage
  useEffect(() => {
    if (dualAssignment) {
      try {
        localStorage.setItem('sahara_dual_assignment', JSON.stringify(dualAssignment));
      } catch (e) {
        console.error(e);
      }
    }
  }, [dualAssignment]);

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMatchComplete = (assignment: SaathiDualAssignment) => {
    setDualAssignment(assignment);
  };

  const handleSelectPeerChat = (
    chatId: string, 
    peer?: SaathiPeerAssignment, 
    secondary?: SaathiPeerAssignment
  ) => {
    setActiveChatId(chatId);
    if (peer) {
      setDualAssignment({
        session_id: getSessionId(),
        primary: peer,
        secondary: secondary || dualAssignment?.secondary || {
          chat_id: `schat-sec-${chatId.replace('schat-', '')}`,
          saathi_id: 'saathi-saifullah',
          alias: 'Saif_Pacer_22',
          role: 'SECONDARY',
          status: 'ACTIVE',
          intro_message: "Hi there, I'm your secondary peer anchor. Happy to chat whenever you need.",
          vibeTags: peer.vibeTags || []
        },
      });
    }
    handleNavigate('saathi_chat');
  };

  return (
    <div className="min-h-screen bg-[#F7F3E8] text-[#173F2A] font-sans antialiased flex flex-col selection:bg-[#DCE5D4] selection:text-[#173F2A]">
      
      {/* Main Navigation Header */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
      />

      {/* Dynamic Screen Routing */}
      <main className="flex-1">
        {currentScreen === 'landing' && (
          <LandingScreen
            onStart={() => handleNavigate('checkin')}
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === 'checkin' && (
          <CheckInScreen
            onContinue={() => handleNavigate('chat')}
            onBack={() => handleNavigate('landing')}
          />
        )}

        {currentScreen === 'chat' && (
          <SaharaChatScreen
            onNavigate={handleNavigate}
            onSelectPeerChat={handleSelectPeerChat}
          />
        )}

        {currentScreen === 'saathi_match' && (
          <SaathiMatchScreen
            onNavigate={handleNavigate}
            onMatchComplete={handleMatchComplete}
          />
        )}

        {currentScreen === 'saathi_chat' && (
          <SaathiChatScreen
            chatId={activeChatId}
            dualAssignment={dualAssignment}
            onNavigate={handleNavigate}
            onUpdateAssignment={setDualAssignment}
          />
        )}

        {currentScreen === 'dev_inbox' && (
          <DevInboxScreen
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === 'appointments' && (
          <ProfessionalSupportScreen
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === 'privacy' && (
          <PrivacyCenterScreen />
        )}

        {currentScreen === 'dashboard' && (
          <StudentDashboardScreen
            onNavigate={handleNavigate}
            dualAssignment={dualAssignment}
          />
        )}

        {currentScreen === 'admin' && (
          <ImpactDashboardScreen />
        )}
      </main>

      {/* Global Sleek Footer */}
      <footer className="bg-[#173F2A] border-t border-[#234D32] py-4 px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/70 shrink-0 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">🌿</span>
          <p className="tracking-wide font-medium">Sahara (सहारा) &bull; Student Mental Health Infrastructure</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-white/60 flex-wrap">
          <button onClick={() => handleNavigate('dev_inbox')} className="hover:text-white transition-colors cursor-pointer text-emerald-300 font-semibold">
            Developer Portal (4 Devs)
          </button>
          <span>&bull;</span>
          <button onClick={() => handleNavigate('privacy')} className="hover:text-white transition-colors cursor-pointer">
            Privacy Architecture
          </button>
          <span>&bull;</span>
          <button onClick={() => handleNavigate('admin')} className="hover:text-white transition-colors cursor-pointer">
            Admin Telemetry
          </button>
          <span>&bull;</span>
          <p className="italic text-white/80 font-serif">&ldquo;You don't have to say you need help.&rdquo;</p>
        </div>
      </footer>

    </div>
  );
}
