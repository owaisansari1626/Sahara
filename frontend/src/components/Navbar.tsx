import React, { useState } from 'react';
import { Screen } from '../types';
import { Sparkles, MessageCircle, HeartHandshake, Lock, BarChart3, Home, Menu, X, Calendar, Wind, Terminal } from 'lucide-react';

interface NavbarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentScreen, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (screen: Screen) => {
    onNavigate(screen);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F7F3E8] border-b border-[#9BAE91]/30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <button
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
            id="brand-logo-btn"
          >
            <div className="w-8 h-8 bg-[#173F2A] rounded-2xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3 2 7h-2c0-2-1-3-3-3"/>
                <path d="M7 20c-3 0-5-2-5-5 0-3.5 2.5-6.5 6-7.5"/>
                <path d="M13 14.23a4.5 4.5 0 0 0-4.23 4.23"/>
              </svg>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold serif tracking-tight text-[#173F2A]">
                Sahara <span className="text-[#173F2A]/60 font-normal italic font-devanagari">सहारा</span>
              </span>
            </div>
          </button>

          {/* Desktop Center Navigation */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium">
            <button
              onClick={() => handleNavClick('chat')}
              className={`transition-colors cursor-pointer py-1 ${
                currentScreen === 'chat'
                  ? 'text-[#173F2A] font-bold border-b-2 border-[#173F2A]'
                  : 'text-[#173F2A]/70 hover:text-[#173F2A]'
              }`}
              id="nav-companion-chat"
            >
              Companion Chat
            </button>
            <button
              onClick={() => handleNavClick('saathi_match')}
              className={`transition-colors cursor-pointer py-1 ${
                currentScreen === 'saathi_match' || currentScreen === 'saathi_chat'
                  ? 'text-[#173F2A] font-bold border-b-2 border-[#173F2A]'
                  : 'text-[#173F2A]/70 hover:text-[#173F2A]'
              }`}
              id="nav-saathi"
            >
              Saathi Peers
            </button>
            <button
              onClick={() => handleNavClick('dev_inbox')}
              className={`transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
                currentScreen === 'dev_inbox'
                  ? 'text-[#173F2A] font-bold border-b-2 border-[#173F2A]'
                  : 'text-[#173F2A]/70 hover:text-[#173F2A]'
              }`}
              id="nav-dev-inbox"
            >
              <Terminal className="w-3.5 h-3.5 text-[#3D7A5A]" />
              <span>Dev Inbox</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">4 Devs</span>
            </button>
            <button
              onClick={() => handleNavClick('appointments')}
              className={`transition-colors cursor-pointer py-1 ${
                currentScreen === 'appointments'
                  ? 'text-[#173F2A] font-bold border-b-2 border-[#173F2A]'
                  : 'text-[#173F2A]/70 hover:text-[#173F2A]'
              }`}
              id="nav-appointments"
            >
              Psychologists
            </button>
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`transition-colors cursor-pointer py-1 ${
                currentScreen === 'dashboard'
                  ? 'text-[#173F2A] font-bold border-b-2 border-[#173F2A]'
                  : 'text-[#173F2A]/70 hover:text-[#173F2A]'
              }`}
              id="nav-space"
            >
              Student Space
            </button>
            <button
              onClick={() => handleNavClick('privacy')}
              className={`transition-colors cursor-pointer py-1 ${
                currentScreen === 'privacy'
                  ? 'text-[#173F2A] font-bold border-b-2 border-[#173F2A]'
                  : 'text-[#173F2A]/70 hover:text-[#173F2A]'
              }`}
              id="nav-privacy"
            >
              Privacy
            </button>
            <button
              onClick={() => handleNavClick('admin')}
              className={`transition-colors cursor-pointer py-1 flex items-center gap-1 ${
                currentScreen === 'admin'
                  ? 'text-[#173F2A] font-bold border-b-2 border-[#173F2A]'
                  : 'text-[#173F2A]/60 hover:text-[#173F2A]'
              }`}
              id="nav-admin"
            >
              <Lock className="w-3 h-3 text-[#9BAE91]" />
              <span>Admin</span>
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNavClick('chat')}
              className="bg-[#173F2A] hover:bg-[#234D32] text-white px-4 sm:px-5 py-2 rounded-2xl text-xs tracking-wide uppercase font-semibold transition-all duration-200 shadow-xs hover:shadow flex items-center gap-1.5 cursor-pointer"
              id="header-start-chat-btn"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#9BAE91]" />
              <span>Start Chat</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[#173F2A] hover:bg-[#EDE8DA] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#DCE5D4] py-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => handleNavClick('landing')}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                currentScreen === 'landing' ? 'bg-[#173F2A] text-white' : 'text-[#173F2A] hover:bg-[#EDE8DA]'
              }`}
            >
              Overview / Home
            </button>
            <button
              onClick={() => handleNavClick('chat')}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between ${
                currentScreen === 'chat' ? 'bg-[#173F2A] text-white' : 'text-[#173F2A] hover:bg-[#EDE8DA]'
              }`}
            >
              <span>Companion Chat</span>
              <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">Layer 1</span>
            </button>
            <button
              onClick={() => handleNavClick('saathi_match')}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                currentScreen === 'saathi_match' || currentScreen === 'saathi_chat' ? 'bg-[#173F2A] text-white' : 'text-[#173F2A] hover:bg-[#EDE8DA]'
              }`}
            >
              Saathi Dual Peer Match (Layer 2)
            </button>
            <button
              onClick={() => handleNavClick('dev_inbox')}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between ${
                currentScreen === 'dev_inbox' ? 'bg-[#173F2A] text-white' : 'text-[#173F2A] hover:bg-[#EDE8DA]'
              }`}
            >
              <span>Saathi Developer Portal (Layer 3)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">4 Devs</span>
            </button>
            <button
              onClick={() => handleNavClick('appointments')}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                currentScreen === 'appointments' ? 'bg-[#173F2A] text-white' : 'text-[#173F2A] hover:bg-[#EDE8DA]'
              }`}
            >
              Psychologist Appointments
            </button>
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                currentScreen === 'dashboard' ? 'bg-[#173F2A] text-white' : 'text-[#173F2A] hover:bg-[#EDE8DA]'
              }`}
            >
              Student Space & Daily Check-Ins
            </button>
            <button
              onClick={() => handleNavClick('privacy')}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                currentScreen === 'privacy' ? 'bg-[#173F2A] text-white' : 'text-[#173F2A] hover:bg-[#EDE8DA]'
              }`}
            >
              Privacy Architecture
            </button>
            <button
              onClick={() => handleNavClick('admin')}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between ${
                currentScreen === 'admin' ? 'bg-[#173F2A] text-white' : 'text-[#173F2A] hover:bg-[#EDE8DA]'
              }`}
            >
              <span>Admin Telemetry</span>
              <Lock className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>
        )}

      </div>
    </header>
  );
};
