import React, { useState, useRef } from 'react';
import { UploadCloud, Play, Sparkles, FolderArchive, ArrowRight } from 'lucide-react';

export default function UploadZone({ onUpload, onDemo, loading }) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.zip')) {
        onUpload(file);
      } else {
        alert('Please upload a valid .zip file containing your Node.js API project.');
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl mb-4">
          Your API is broken.<br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">
            Let AI find out why and fix it.
          </span>
        </h1>
        <p className="text-base text-gray-400 max-w-2xl mx-auto">
          Upload a Node.js + Express project ZIP file. API Doctor will run your API in an isolated workspace, capture HTTP 500 / 4xx errors, pinpoint the bug, apply an AI patch, and verify the fix automatically.
        </p>
      </div>

      {/* Main Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
          dragActive
            ? 'border-cyan-400 bg-cyan-950/20 scale-[1.01]'
            : 'border-gray-800 hover:border-gray-700 bg-gray-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleChange}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center mb-4">
          <FolderArchive className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-semibold text-white mb-2">
          Upload your Node.js API Project
        </h3>
        <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
          Drag and drop your project <code className="bg-gray-800 text-cyan-300 px-1.5 py-0.5 rounded text-xs">.zip</code> archive here or click browse below.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            Browse Project ZIP
          </button>

          <span className="text-gray-600 font-medium text-xs">OR</span>

          <button
            disabled={loading}
            onClick={onDemo}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-cyan-500/30 text-white font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Try Demo API (30-Sec Test)
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <p className="text-[11px] text-gray-500 mt-6">
          🔒 Uploaded code executes in a throwaway isolated temporary directory. Original ZIP is never modified.
        </p>
      </div>

      {/* Feature Pills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="p-4 rounded-xl border border-gray-800/80 bg-gray-900/30">
          <div className="text-cyan-400 font-semibold text-sm mb-1">1. Isolated Execution</div>
          <p className="text-xs text-gray-400">Spawns child processes on isolated local ports with automatic timeouts.</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-800/80 bg-gray-900/30">
          <div className="text-cyan-400 font-semibold text-sm mb-1">2. AI Root Cause</div>
          <p className="text-xs text-gray-400">Analyzes stack traces, code snippets, and returns structured JSON fixes.</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-800/80 bg-gray-900/30">
          <div className="text-cyan-400 font-semibold text-sm mb-1">3. Instant Retest</div>
          <p className="text-xs text-gray-400">Applies patch to temporary copy & verifies status changes from 500 ❌ to 200 ✅.</p>
        </div>
      </div>
    </div>
  );
}
