import React from 'react';
import { Brain, FileCode, CheckCircle, AlertOctagon, ArrowRight, ShieldAlert, Sparkles, Layers } from 'lucide-react';

export default function AiDiagnosisCard({ diagnosis, relevantFiles, onProceedToFix, loading }) {
  if (!diagnosis) return null;

  const confidencePct = Math.round((diagnosis.confidence || 0.95) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl glass-panel-glow relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-4 mb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-cyan-500/20 text-cyan-400 text-xs font-bold uppercase px-2.5 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5" /> AI Investigation Complete
              </span>
              {diagnosis.isMock && (
                <span className="bg-gray-800 text-gray-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-gray-700">
                  Demo Mode AI
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mt-2">
              Root Cause Identified
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[11px] text-gray-400 uppercase font-semibold">Confidence Score</div>
              <div className="text-xl font-black text-cyan-400 font-mono">{confidencePct}%</div>
            </div>
            <div className="text-right border-l border-gray-800 pl-4">
              <div className="text-[11px] text-gray-400 uppercase font-semibold">Severity</div>
              <span className="bg-rose-500/20 text-rose-400 text-xs font-bold uppercase px-2.5 py-0.5 rounded border border-rose-500/30">
                {diagnosis.severity || 'HIGH'}
              </span>
            </div>
          </div>
        </div>

        {/* Root Cause Box */}
        <div className="bg-[#090d16]/90 p-4 rounded-xl border border-gray-800 space-y-2 mb-5">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-rose-400" /> Root Cause Statement
          </div>
          <p className="text-base font-semibold text-white font-mono bg-rose-950/20 p-3 rounded-lg border border-rose-500/20">
            "{diagnosis.rootCause}"
          </p>
        </div>

        {/* Affected File & Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="bg-[#090d16]/70 p-4 rounded-xl border border-gray-800/80">
            <div className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-cyan-400" /> Affected Target File
            </div>
            <div className="font-mono text-sm font-bold text-cyan-300">
              {diagnosis.file} <span className="text-gray-400 font-normal">Line {diagnosis.line}</span>
            </div>
          </div>

          <div className="bg-[#090d16]/70 p-4 rounded-xl border border-gray-800/80">
            <div className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-violet-400" /> Inspected Files
            </div>
            <div className="text-xs text-gray-300">
              {(relevantFiles || []).map(f => f.relativePath).join(', ') || diagnosis.file}
            </div>
          </div>
        </div>

        {/* AI Rationale */}
        <div className="bg-[#090d16]/70 p-4 rounded-xl border border-gray-800/80 space-y-2 mb-5">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Diagnostic Explanation
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            {diagnosis.explanation}
          </p>
        </div>

        {/* Action Button */}
        <div className="text-right pt-2">
          <button
            disabled={loading}
            onClick={onProceedToFix}
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center gap-2 ml-auto shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
          >
            Review Code Fix & Diff
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
