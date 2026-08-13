import React from 'react';
import { Server, FileCode, Route, Package, Play, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function AnalysisSummary({ analysis, onStartTest, loading }) {
  if (!analysis) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-cyan-400" />
            Project Analysis
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Detected Node.js structure, entry point, and API route declarations.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1.5 rounded-full border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4" />
          <span>Project Ready</span>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
            <Package className="w-3.5 h-3.5 text-cyan-400" /> Project Name
          </div>
          <div className="font-mono text-sm font-semibold text-white truncate">
            {analysis.projectName}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
            <Server className="w-3.5 h-3.5 text-blue-400" /> Framework
          </div>
          <div className="font-semibold text-sm text-cyan-400">
            {analysis.framework}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
            <FileCode className="w-3.5 h-3.5 text-violet-400" /> Entry File
          </div>
          <div className="font-mono text-sm font-semibold text-white truncate">
            {analysis.entryPoint}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <div className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
            <Route className="w-3.5 h-3.5 text-emerald-400" /> Routes Found
          </div>
          <div className="font-semibold text-sm text-emerald-400">
            {analysis.routes.length} Endpoints
          </div>
        </div>
      </div>

      {/* Discovered Routes */}
      <div className="p-5 rounded-xl bg-gray-900/60 border border-gray-800">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
          <Route className="w-4 h-4 text-cyan-400" /> Discovered API Endpoints
        </h4>
        <div className="divide-y divide-gray-800/80 border border-gray-800/80 rounded-lg overflow-hidden">
          {analysis.routes.map((r, i) => (
            <div key={i} className="px-4 py-3 bg-[#0d121f] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                  r.method === 'GET' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {r.method}
                </span>
                <span className="font-mono text-xs font-medium text-gray-200">{r.path}</span>
              </div>
              <span className="text-[11px] text-gray-500 font-mono">{r.file}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2 text-right">
        <button
          disabled={loading}
          onClick={onStartTest}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center gap-2 ml-auto shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          {loading ? 'Starting API & Testing...' : 'Start API Analysis & Test Endpoints'}
        </button>
      </div>
    </div>
  );
}
