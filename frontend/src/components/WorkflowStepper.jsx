import React from 'react';
import { Upload, FileCode, Play, Brain, Wrench, CheckCircle2 } from 'lucide-react';

const steps = [
  { id: 1, name: 'Upload', icon: Upload },
  { id: 2, name: 'Analysis', icon: FileCode },
  { id: 3, name: 'Test API', icon: Play },
  { id: 4, name: 'AI Diagnosis', icon: Brain },
  { id: 5, name: 'Code Fix', icon: Wrench },
  { id: 6, name: 'Verified', icon: CheckCircle2 },
];

export default function WorkflowStepper({ currentStep, maxReachedStep = 1, onSelectStep }) {
  return (
    <div className="w-full bg-[#0d1322] border-b border-gray-800/60 py-3.5 px-4 mb-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isUnlocked = step.id <= maxReachedStep;

          return (
            <React.Fragment key={step.id}>
              <div
                onClick={() => isUnlocked && onSelectStep && onSelectStep(step.id)}
                className={`flex items-center space-x-2 transition ${
                  isUnlocked ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-60'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition ${
                    isCompleted
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : isCurrent
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-sm shadow-cyan-500/30'
                      : 'bg-gray-800/80 text-gray-500 border border-gray-700/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span
                  className={`text-xs hidden sm:inline-block font-medium ${
                    isCurrent
                      ? 'text-cyan-400 font-semibold'
                      : isCompleted || isUnlocked
                      ? 'text-gray-300'
                      : 'text-gray-500'
                  }`}
                >
                  {step.name}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 sm:mx-4 transition-colors ${
                    currentStep > step.id ? 'bg-cyan-500/80' : 'bg-gray-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
