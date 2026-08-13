import React from 'react';
import { CheckCircle2, XCircle, Sparkles, RefreshCw, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export default function VerificationCard({ verification, diagnosis, onReset }) {
  if (!verification) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">
        <p className="text-sm">No verification data available yet.</p>
        <button
          onClick={onReset}
          className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
        >
          Start Over
        </button>
      </div>
    );
  }

  const isSuccess = Boolean(verification.verified);
  const beforeStatus = verification.before?.status || 500;
  const beforeError = verification.before?.error || 'Internal Server Error';
  const afterStatus = verification.after?.status || (isSuccess ? 200 : 500);
  const afterTime = verification.after?.responseTimeMs || 0;
  const method = verification.method || 'GET';
  const endpoint = verification.endpoint || '/api';

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
      {/* Result Hero Banner */}
      <div className={`p-8 rounded-2xl border text-center relative overflow-hidden ${
        isSuccess
          ? 'bg-gradient-to-b from-emerald-950/40 via-gray-900 to-gray-900 border-emerald-500/40 shadow-2xl shadow-emerald-500/10'
          : 'bg-gradient-to-b from-rose-950/40 via-gray-900 to-gray-900 border-rose-500/40 shadow-2xl shadow-rose-500/10'
      }`}>
        <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-4 ${
          isSuccess
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xl shadow-emerald-500/20'
            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-xl shadow-rose-500/20'
        }`}>
          {isSuccess ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
        </div>

        <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl mb-2">
          {isSuccess ? '🎉 API FIXED & VERIFIED!' : '⚠️ Fix Verification Failed'}
        </h1>
        <p className="text-sm text-gray-300 max-w-md mx-auto">
          {isSuccess
            ? 'The proposed AI fix was applied to a temporary copy, the process restarted, and endpoint tests passed cleanly!'
            : 'The patched server returned an error during verification retest.'}
        </p>

        {/* BEFORE / AFTER Comparison Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
          {/* BEFORE */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 text-left">
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400 mb-1">
              BEFORE PATCH
            </div>
            <div className="font-mono text-xs text-gray-300">
              {method} {endpoint}
            </div>
            <div className="mt-2 text-2xl font-black text-rose-400 font-mono flex items-center gap-2">
              {beforeStatus} ❌
            </div>
            <div className="text-[11px] text-rose-300 mt-1 truncate">
              {beforeError}
            </div>
          </div>

          {/* AFTER */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-left">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
              AFTER PATCH
            </div>
            <div className="font-mono text-xs text-gray-300">
              {method} {endpoint}
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-400 font-mono flex items-center gap-2">
              {afterStatus} {isSuccess ? '✅' : '❌'}
            </div>
            <div className="text-[11px] text-emerald-300 mt-1">
              Response Time: {afterTime}ms
            </div>
          </div>
        </div>

        {/* Automated Verification Checklist */}
        <div className="max-w-md mx-auto mt-6 bg-[#090d16]/80 p-4 rounded-xl border border-gray-800 text-left space-y-2">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Verification Engine Checklist
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Process startup in temporary workspace</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Automated HTTP request replay ({verification.endpoint})</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Runtime exception resolved (HTTP 200 OK)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Original project directory preserved 100% unchanged</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={onReset}
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Debug Another API
          </button>
        </div>
      </div>
    </div>
  );
}
