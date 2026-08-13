import React, { useState } from 'react';
import Header from './components/Header';
import WorkflowStepper from './components/WorkflowStepper';
import UploadZone from './components/UploadZone';
import AnalysisSummary from './components/AnalysisSummary';
import TestResultsTable from './components/TestResultsTable';
import AiDiagnosisCard from './components/AiDiagnosisCard';
import DiffViewer from './components/DiffViewer';
import VerificationCard from './components/VerificationCard';

import {
  uploadZip,
  loadDemo,
  analyzeProject,
  testProject,
  diagnoseProject,
  applyFix,
  verifyFix
} from './services/api';

export default function App() {
  const [step, setStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [workspaceId, setWorkspaceId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [relevantFiles, setRelevantFiles] = useState([]);
  const [diagnosis, setDiagnosis] = useState(null);
  const [fixResult, setFixResult] = useState(null);
  const [verification, setVerification] = useState(null);

  const updateStep = (newStep) => {
    setStep(newStep);
    setMaxReachedStep(prev => Math.max(prev, newStep));
  };

  const handleReset = () => {
    setStep(1);
    setMaxReachedStep(1);
    setLoading(false);
    setError(null);
    setWorkspaceId(null);
    setAnalysis(null);
    setTestResults(null);
    setRelevantFiles([]);
    setDiagnosis(null);
    setFixResult(null);
    setVerification(null);
  };

  const handleUpload = async (file) => {
    try {
      setLoading(true);
      setError(null);
      const res = await uploadZip(file);
      setWorkspaceId(res.workspaceId);
      
      const analysisRes = await analyzeProject(res.workspaceId);
      setAnalysis(analysisRes.analysis);
      updateStep(2);
    } catch (err) {
      setError(err.message || 'Failed to upload project');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await loadDemo();
      setWorkspaceId(res.workspaceId);

      const analysisRes = await analyzeProject(res.workspaceId);
      setAnalysis(analysisRes.analysis);
      updateStep(2);
    } catch (err) {
      setError(err.message || 'Failed to load demo project');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await testProject(workspaceId);
      setTestResults(res);
      updateStep(3);
    } catch (err) {
      setError(err.message || 'Failed to execute API tests');
    } finally {
      setLoading(false);
    }
  };

  const handleDiagnose = async (endpointPath) => {
    try {
      setLoading(true);
      setError(null);
      const res = await diagnoseProject(workspaceId, endpointPath);
      setDiagnosis(res.diagnosis);
      setRelevantFiles(res.relevantFiles || []);
      updateStep(4);
    } catch (err) {
      setError(err.message || 'AI Diagnosis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToFix = () => {
    updateStep(5);
  };

  const handleApplyFix = async () => {
    try {
      setLoading(true);
      setError(null);
      const patchRes = await applyFix(workspaceId, diagnosis);
      setFixResult(patchRes);

      try {
        const verifyRes = await verifyFix(workspaceId);
        setVerification(verifyRes.verification || verifyRes);
      } catch (vErr) {
        setVerification({
          verified: false,
          endpoint: diagnosis?.file || '/api',
          method: 'POST',
          before: { status: 500, result: 'FAILED', error: 'Pre-patch failure' },
          after: { status: 500, result: 'FAILED', responseTimeMs: 0 }
        });
      }
      updateStep(6);
    } catch (err) {
      setError(err.message || 'Failed to apply code fix');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-gray-100 font-sans">
      <Header onReset={handleReset} currentStep={step} />
      <WorkflowStepper
        currentStep={step}
        maxReachedStep={maxReachedStep}
        onSelectStep={(targetStep) => setStep(targetStep)}
      />

      <main className="flex-1 pb-16">
        {/* Global Error Alert */}
        {error && (
          <div className="max-w-4xl mx-auto px-4 mb-4">
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-sm flex items-center justify-between">
              <span>⚠️ Error: {error}</span>
              <button onClick={() => setError(null)} className="text-xs font-bold underline">Dismiss</button>
            </div>
          </div>
        )}

        {step === 1 && (
          <UploadZone
            onUpload={handleUpload}
            onDemo={handleDemo}
            loading={loading}
          />
        )}

        {step === 2 && (
          <AnalysisSummary
            analysis={analysis}
            onStartTest={handleStartTest}
            loading={loading}
          />
        )}

        {step === 3 && (
          <TestResultsTable
            testResults={testResults}
            onDiagnose={handleDiagnose}
            loading={loading}
          />
        )}

        {step === 4 && (
          <AiDiagnosisCard
            diagnosis={diagnosis}
            relevantFiles={relevantFiles}
            onProceedToFix={handleProceedToFix}
            loading={loading}
          />
        )}

        {step === 5 && (
          <DiffViewer
            diagnosis={diagnosis}
            fixResult={fixResult}
            onApplyFix={handleApplyFix}
            loading={loading}
          />
        )}

        {step === 6 && (
          <VerificationCard
            verification={verification}
            diagnosis={diagnosis}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="border-t border-gray-800/60 py-4 text-center text-xs text-gray-500 bg-[#070a12]">
        API Doctor — AI-Powered API Debugging & Repair Agent • Hackathon MVP Edition
      </footer>
    </div>
  );
}
