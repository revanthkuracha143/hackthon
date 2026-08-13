import React from 'react';
import { Wrench, FileCode, CheckCircle, ShieldCheck, ArrowRight, MinusCircle, PlusCircle } from 'lucide-react';

export default function DiffViewer({ diagnosis, fixResult, onApplyFix, loading }) {
  if (!diagnosis) return null;

  const diffLines = fixResult?.result?.diff?.lines || null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-cyan-400" />
            Proposed Code Patch
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Target File: <code className="text-cyan-300 font-mono">{diagnosis.file}</code>
          </p>
        </div>
      </div>

      {/* Before / After Summary Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30">
          <div className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
            <MinusCircle className="w-4 h-4" /> BEFORE (Problematic Code)
          </div>
          <pre className="font-mono text-xs text-rose-200 bg-[#090d16] p-3 rounded-lg border border-gray-800 overflow-x-auto">
            {diagnosis.problematicCode}
          </pre>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4" /> AFTER (Proposed Code Fix)
          </div>
          <pre className="font-mono text-xs text-emerald-200 bg-[#090d16] p-3 rounded-lg border border-gray-800 overflow-x-auto">
            {diagnosis.suggestedCode}
          </pre>
        </div>
      </div>

      {/* Rationale */}
      <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-300">
        <span className="font-bold text-cyan-400 uppercase tracking-wider block mb-1">Why this fix works:</span>
        {diagnosis.reason}
      </div>

      {/* Line by line diff if applied or previewed */}
      {diffLines && (
        <div className="border border-gray-800 rounded-xl overflow-hidden bg-[#070b13]">
          <div className="bg-[#0f172a] px-4 py-2.5 text-xs font-mono font-semibold text-gray-300 border-b border-gray-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" /> File Diff: {diagnosis.file}
            </span>
            <span className="text-[10px] text-gray-500 uppercase">Unified Line Diff</span>
          </div>

          <div className="font-mono text-xs divide-y divide-gray-900 overflow-x-auto max-h-80 py-1">
            {diffLines.map((line, i) => (
              <div
                key={i}
                className={`flex px-4 py-1 whitespace-pre ${
                  line.type === 'add'
                    ? 'bg-emerald-950/40 text-emerald-300 font-semibold'
                    : line.type === 'remove'
                    ? 'bg-rose-950/40 text-rose-300 line-through opacity-80'
                    : 'text-gray-400'
                }`}
              >
                <span className="w-10 text-gray-600 select-none text-right pr-4 shrink-0">
                  {line.lineOld || ''}
                </span>
                <span className="w-10 text-gray-600 select-none text-right pr-4 shrink-0">
                  {line.lineNew || ''}
                </span>
                <span className="w-6 text-center select-none font-bold shrink-0">
                  {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                </span>
                <span className="flex-1">{line.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Safety Banner & Apply Action */}
      <div className="p-5 rounded-xl glass-panel flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Safety Lock Active
            </h4>
            <p className="text-xs text-gray-400">
              Fix will be applied strictly to an isolated temporary copy (<code className="text-cyan-300">workspace/patched</code>). Original project files remain 100% untouched.
            </p>
          </div>
        </div>

        <button
          disabled={loading}
          onClick={onApplyFix}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 shrink-0"
        >
          <Wrench className="w-4 h-4" />
          {loading ? 'Applying Fix & Restarting Process...' : 'Apply Fix & Verify API'}
        </button>
      </div>
    </div>
  );
}
