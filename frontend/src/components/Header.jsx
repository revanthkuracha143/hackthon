import React from 'react';
import { Stethoscope, Sparkles, RefreshCw } from 'lucide-react';

export default function Header({ onReset, currentStep }) {
  return (
    <header className="border-b border-gray-800/80 bg-[#090d16]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">API DOCTOR</span>
              <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border border-cyan-500/20 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> AI Debugger
              </span>
            </div>
            <p className="text-xs text-gray-400">Autonomous API Diagnosis & Verification</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {currentStep > 1 && (
            <button
              onClick={onReset}
              className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-gray-800 hover:border-gray-700 bg-gray-900/50 flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Session
            </button>
          )}
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gray-400 hover:text-cyan-400 transition"
          >
            v1.0 Hackathon MVP
          </a>
        </div>
      </div>
    </header>
  );
}
