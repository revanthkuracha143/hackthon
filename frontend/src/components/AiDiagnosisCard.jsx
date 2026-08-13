import React from 'react';
import { Brain, FileCode, AlertOctagon, ArrowRight, Sparkles, Layers } from 'lucide-react';
import AiChatAssistant from './AiChatAssistant';

export default function AiDiagnosisCard({
  diagnosis,
  relevantFiles,
  failedEndpoint,
  onApplyFix,
  onProceedToFix,
  loading
}) {
  if (!diagnosis) return null;

  const confidencePct = Math.round((diagnosis.confidence || 0.95) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl glass-panel-glow relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-4 mb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-cyan-500/20 text-cyan-400 text-xs font-bold uppercase px-2.5 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5" /> AI Diagnosis & Chatbot Assistant
              </span>
              {diagnosis.isMock && (
                <span className="bg-gray-800 text-gray-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-gray-700">
                  Demo Mode AI
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mt-2">
              Root Cause Identified & Repair Assistant Ready
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

        {/* AI Chatbot Assistant Section */}
        <AiChatAssistant
          diagnosis={diagnosis}
          failedEndpoint={failedEndpoint}
          onApplyFix={onApplyFix}
          onProceedToFix={onProceedToFix}
          loading={loading}
        />
      </div>
    </div>
  );
}
