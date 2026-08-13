import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, Brain, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

export default function TestResultsTable({ testResults, onDiagnose, loading }) {
  const [expandedIndex, setExpandedIndex] = useState(0);

  if (!testResults || !testResults.results) return null;

  const failedItems = testResults.results.filter(r => r.result === 'FAILED');

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-6 h-6 text-cyan-400" />
            API Test Results
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Executed endpoints against active background Node process.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20">
            {testResults.summary.passed} Passed
          </span>
          <span className="bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-lg border border-rose-500/20">
            {testResults.summary.failed} Failed
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/60 shadow-xl">
        <div className="grid grid-cols-12 bg-[#0d121f] px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800">
          <div className="col-span-4">Endpoint</div>
          <div className="col-span-2">Method</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Response Time</div>
          <div className="col-span-2 text-right">Result</div>
        </div>

        <div className="divide-y divide-gray-800/60">
          {testResults.results.map((r, idx) => {
            const isFailed = r.result === 'FAILED';
            const isExpanded = expandedIndex === idx;

            return (
              <div key={idx} className="transition">
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className={`grid grid-cols-12 px-4 py-3.5 items-center text-xs font-mono cursor-pointer hover:bg-gray-800/40 ${
                    isFailed ? 'bg-rose-950/10' : ''
                  }`}
                >
                  <div className="col-span-4 font-semibold text-white flex items-center gap-2">
                    {r.endpoint}
                    {isFailed && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 inline" />}
                  </div>
                  <div className="col-span-2">
                    <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-[10px] font-bold">
                      {r.method}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className={`font-bold ${isFailed ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="col-span-2 text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-500" />
                    {r.responseTimeMs}ms
                  </div>
                  <div className="col-span-2 text-right flex items-center justify-end gap-1.5">
                    {isFailed ? (
                      <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> FAILED
                      </span>
                    ) : (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> PASSED
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="bg-[#090d16] px-5 py-4 border-t border-gray-800 space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="font-semibold text-gray-300">Request: <code className="text-cyan-400">{r.method} {r.endpoint}</code></span>
                      <span>Response Status: <code className={isFailed ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>{r.status}</code></span>
                    </div>

                    {isFailed && r.errorDetails && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> Runtime Error: {r.errorDetails.message}
                        </div>

                        {r.stderr && (
                          <div className="bg-[#050811] p-3 rounded-lg border border-gray-800 font-mono text-[11px] text-gray-300 overflow-x-auto max-h-48">
                            <div className="text-gray-500 text-[10px] uppercase font-bold mb-1">Captured Server Error Log & Stack Trace</div>
                            <pre className="text-rose-300">{r.stderr || r.errorDetails.stackTrace}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trigger AI Diagnosis Action */}
      {failedItems.length > 0 && (
        <div className="p-4 rounded-xl glass-panel-glow flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              API Failure Detected ({failedItems[0].method} {failedItems[0].endpoint})
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Launch AI Doctor investigation agent to analyze source code and propose patch.
            </p>
          </div>
          <button
            disabled={loading}
            onClick={() => onDiagnose(failedItems[0].endpoint)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
          >
            <Brain className="w-4 h-4" />
            {loading ? 'AI Investigating Source Code...' : 'Investigate Failure with AI Doctor'}
          </button>
        </div>
      )}
    </div>
  );
}
