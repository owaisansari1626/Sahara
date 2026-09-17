import React from 'react';
import { ShieldCheck, UserX, EyeOff, Sliders, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface CheckInScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

export const CheckInScreen: React.FC<CheckInScreenProps> = ({ onContinue, onBack }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl w-full bg-white/90 backdrop-blur-md rounded-3xl border border-[#DCE5D4] shadow-xl p-6 sm:p-10 space-y-8">
        
        {/* Top Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#DCE5D4] text-[#173F2A] mx-auto shadow-xs">
            <span className="text-2xl">🌿</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#173F2A]">
            Before we begin
          </h2>

          <div className="text-sm sm:text-base text-[#173F2A]/80 font-normal leading-relaxed max-w-lg mx-auto">
            <p>You don’t need to create an account.</p>
            <p>You don’t need to tell us your name.</p>
            <p>You don’t need to tell us which college you attend.</p>
          </div>
        </div>

        {/* 3 Privacy Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Card 1 */}
          <div className="p-5 rounded-2xl bg-[#F7F3E8] border border-[#EDE8DA] hover:border-[#9BAE91] transition-colors space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#DCE5D4] text-[#173F2A] flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#173F2A]">Anonymous</h3>
            <p className="text-xs text-[#234D32]/80 leading-relaxed">
              No name, email, phone, or college ID required.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-2xl bg-[#F7F3E8] border border-[#EDE8DA] hover:border-[#9BAE91] transition-colors space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#DCE5D4] text-[#173F2A] flex items-center justify-center">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#173F2A]">Private</h3>
            <p className="text-xs text-[#234D32]/80 leading-relaxed">
              Your personal conversation is never shared with your college.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-2xl bg-[#F7F3E8] border border-[#EDE8DA] hover:border-[#9BAE91] transition-colors space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#DCE5D4] text-[#173F2A] flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#173F2A]">Your choice</h3>
            <p className="text-xs text-[#234D32]/80 leading-relaxed">
              You decide whether to continue to coping, peer, or professional support.
            </p>
          </div>

        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#EDE8DA]">
          <button
            onClick={onBack}
            className="text-xs font-semibold text-[#234D32] hover:text-[#173F2A] px-3 py-2 cursor-pointer"
          >
            ← Back to Overview
          </button>

          <button
            onClick={onContinue}
            className="w-full sm:w-auto bg-[#173F2A] hover:bg-[#234D32] text-[#F7F3E8] px-8 py-3.5 rounded-2xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
            id="start-anonymously-btn"
          >
            <span>Start anonymously</span>
            <ArrowRight className="w-4 h-4 text-[#9BAE91] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Prototype Disclaimer */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#EDE8DA]/60 border border-[#DCE5D4] text-[11px] text-[#234D32]/90">
          <AlertCircle className="w-4 h-4 text-[#234D32] shrink-0 mt-0.5" />
          <p>
            <strong>Prototype Notice:</strong> Sahara is a design prototype demonstrating trust-driven access for student wellness. It does not replace emergency medical care or clinical diagnosis.
          </p>
        </div>

      </div>
    </div>
  );
};
