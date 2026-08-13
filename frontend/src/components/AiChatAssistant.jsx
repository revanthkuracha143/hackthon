import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Send, Sparkles, CheckCircle2, ArrowRight, Wrench, AlertTriangle, Code2 } from 'lucide-react';

export default function AiChatAssistant({
  diagnosis,
  failedEndpoint,
  onApplyFix,
  onProceedToFix,
  loading
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (diagnosis) {
      const initialMsgs = [
        {
          id: 1,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `🚨 **API Error Detected!**\n\nI intercepted a failure on \`${failedEndpoint?.method || 'GET'} ${failedEndpoint?.endpoint || '/api'}\` returning **HTTP ${failedEndpoint?.status || 500}**.`
        },
        {
          id: 2,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'diagnosis',
          diagnosis
        },
        {
          id: 3,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'action_prompt',
          text: '🤖 **Would you like me to automatically make these changes into your project and re-verify the API?**'
        }
      ];
      setMessages(initialMsgs);
    }
  }, [diagnosis, failedEndpoint]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: userText
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Process user input conversational response
    setTimeout(() => {
      const lower = userText.toLowerCase();
      let botResponse = {};

      if (lower.includes('yes') || lower.includes('apply') || lower.includes('fix') || lower.includes('change') || lower.includes('do it')) {
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: '⚡ Executing automatic fix on workspace and starting verification process...'
        };
        handleAutoApply();
      } else if (lower.includes('explain') || lower.includes('why')) {
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `💡 **Detailed Explanation:**\n${diagnosis?.explanation || 'The error occurs because the request parameters do not align with the router parameter definitions.'}\n\nReplacing \`${diagnosis?.problematicCode}\` with \`${diagnosis?.suggestedCode}\` aligns the controller with Express router specifications.`
        };
      } else {
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `I am ready to modify **${diagnosis?.file || 'the target file'}** to replace:\n\`${diagnosis?.problematicCode}\` ➔ \`${diagnosis?.suggestedCode}\`.\n\nClick **"Automatically Apply Fix"** below or reply "yes" to apply changes into the project!`
        };
      }

      setMessages(prev => [...prev, botResponse]);
    }, 600);
  };

  const handleAutoApply = async () => {
    setIsApplying(true);
    if (onApplyFix) {
      await onApplyFix();
    }
    setIsApplying(false);
  };

  return (
    <div className="bg-[#0b101d] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/5 overflow-hidden flex flex-col h-[580px]">
      {/* Chatbot Header */}
      <div className="bg-[#0d1527] px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-wide">API Doctor AI Assistant</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Autonomous Debugging & Repair Bot</p>
          </div>
        </div>
        <div className="text-xs font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
          Gemini AI Active
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="flex items-start max-w-[88%] gap-2.5">
              {msg.sender === 'bot' && (
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`p-4 rounded-2xl ${
                msg.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-tr-none font-medium'
                  : 'bg-[#111827] text-gray-200 border border-gray-800 rounded-tl-none space-y-3'
              }`}>
                {msg.text && (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>
                )}

                {/* Diagnosis Summary Card */}
                {msg.type === 'diagnosis' && msg.diagnosis && (
                  <div className="bg-[#090e1a] p-3.5 rounded-xl border border-cyan-500/30 space-y-2.5 text-xs font-mono">
                    <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Root Cause
                    </div>
                    <div className="text-gray-200 font-sans font-semibold">
                      {msg.diagnosis.rootCause}
                    </div>

                    <div className="pt-2 border-t border-gray-800 grid grid-cols-1 gap-2">
                      <div>
                        <span className="text-gray-500 text-[10px]">TARGET FILE:</span>
                        <div className="text-cyan-300 font-bold">{msg.diagnosis.file} (Line {msg.diagnosis.line})</div>
                      </div>

                      <div className="bg-rose-950/30 p-2 rounded border border-rose-500/20">
                        <span className="text-rose-400 text-[10px] block font-bold">CURRENT BROKEN CODE:</span>
                        <code className="text-rose-300">{msg.diagnosis.problematicCode}</code>
                      </div>

                      <div className="bg-emerald-950/30 p-2 rounded border border-emerald-500/20">
                        <span className="text-emerald-400 text-[10px] block font-bold">SUGGESTED REPLACEMENT:</span>
                        <code className="text-emerald-300">{msg.diagnosis.suggestedCode}</code>
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive Action Prompt Buttons */}
                {msg.type === 'action_prompt' && (
                  <div className="pt-2 flex flex-wrap gap-2.5">
                    <button
                      disabled={loading || isApplying}
                      onClick={handleAutoApply}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                    >
                      <Wrench className="w-4 h-4" />
                      {isApplying || loading ? 'Applying Fix & Retesting...' : '⚡ Automatically Make Changes & Verify'}
                    </button>

                    {onProceedToFix && (
                      <button
                        onClick={onProceedToFix}
                        className="px-3.5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-xs flex items-center gap-1.5 border border-gray-700 transition"
                      >
                        <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                        Preview Diff
                      </button>
                    )}
                  </div>
                )}

                <div className="text-[10px] text-gray-500 text-right mt-1">
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-[#0d1527] border-t border-gray-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI assistant or type 'yes' to apply changes automatically..."
          className="flex-1 bg-[#070b14] border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl transition disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
