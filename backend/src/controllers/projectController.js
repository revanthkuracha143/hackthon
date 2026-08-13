const path = require('path');
const WorkspaceManager = require('../services/workspace/workspaceManager');
const ProjectAnalyzer = require('../services/analyzer/projectAnalyzer');
const ProcessManager = require('../services/tester/processManager');
const ApiTester = require('../services/tester/apiTester');
const CodeAnalyzer = require('../services/analyzer/codeAnalyzer');
const AiService = require('../services/ai/aiService');
const FixerService = require('../services/fixer/fixerService');

// In-memory workspace session storage
const sessionStore = new Map();

class ProjectController {
  /**
   * Upload ZIP project
   */
  static async uploadZip(req, res) {
    try {
      if (!req.file && !req.body.fileBuffer) {
        return res.status(400).json({ error: 'No ZIP file provided.' });
      }

      const zipBuffer = req.file ? req.file.buffer : Buffer.from(req.body.fileBuffer, 'base64');
      const session = WorkspaceManager.createFromZip(zipBuffer);

      sessionStore.set(session.id, {
        ...session,
        analysis: null,
        lastTestResults: null,
        diagnosis: null,
        fix: null,
        verification: null
      });

      res.json({
        success: true,
        workspaceId: session.id,
        message: 'Project uploaded and extracted successfully.'
      });
    } catch (err) {
      console.error('[UPLOAD ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to extract ZIP' });
    }
  }

  /**
   * Load Demo project
   */
  static async loadDemo(req, res) {
    try {
      const demoPath = path.join(__dirname, '../../../examples/broken-express-api');
      const session = WorkspaceManager.createFromDirectory(demoPath);

      sessionStore.set(session.id, {
        ...session,
        analysis: null,
        lastTestResults: null,
        diagnosis: null,
        fix: null,
        verification: null,
        isDemo: true
      });

      res.json({
        success: true,
        workspaceId: session.id,
        message: 'Demo project loaded successfully.'
      });
    } catch (err) {
      console.error('[DEMO LOAD ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to load demo project' });
    }
  }

  /**
   * Analyze project structure
   */
  static async analyzeProject(req, res) {
    try {
      const { id } = req.params;
      const session = sessionStore.get(id);
      if (!session) {
        return res.status(404).json({ error: 'Workspace session not found' });
      }

      const analysis = ProjectAnalyzer.analyze(session.originalDir);
      session.analysis = analysis;

      res.json({
        success: true,
        workspaceId: id,
        analysis
      });
    } catch (err) {
      console.error('[ANALYZE ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to analyze project' });
    }
  }

  /**
   * Test API endpoints on original directory
   */
  static async testProject(req, res) {
    let serverInstance = null;
    try {
      const { id } = req.params;
      const session = sessionStore.get(id);
      if (!session) {
        return res.status(404).json({ error: 'Workspace session not found' });
      }

      const analysis = session.analysis || ProjectAnalyzer.analyze(session.originalDir);
      session.analysis = analysis;

      // Start Node API server
      serverInstance = await ProcessManager.startServer(session.originalDir, analysis.entryPoint);
      
      // If server failed to start, convert startup failure into a diagnostic test result
      if (!serverInstance.isReady) {
        serverInstance.stop();
        const startupStderr = serverInstance.errors.join('') || serverInstance.logs.join('') || 'Process exited prematurely before listening.';
        const firstLine = startupStderr.split('\n').filter(Boolean)[0] || 'API Server startup timed out or crashed on boot.';

        const startupFailedResult = {
          endpoint: analysis.routes[0] ? analysis.routes[0].path : '/server-startup',
          method: 'STARTUP',
          status: 500,
          responseTimeMs: 0,
          result: 'FAILED',
          responseBody: { error: 'Server Startup Failed', message: firstLine },
          logs: serverInstance.logs.join(''),
          stderr: serverInstance.errors.join(''),
          errorDetails: {
            httpStatus: 500,
            message: `Server startup failed: ${firstLine}`,
            rawBody: startupStderr,
            stackTrace: startupStderr
          }
        };

        session.lastTestResults = [startupFailedResult];

        return res.json({
          success: true,
          workspaceId: id,
          summary: { total: 1, passed: 0, failed: 1 },
          results: [startupFailedResult],
          serverStartupFailed: true
        });
      }

      const baseUrl = `http://127.0.0.1:${serverInstance.port}`;
      const testResults = await ApiTester.testEndpoints(baseUrl, analysis.routes, serverInstance);

      // Stop process
      serverInstance.stop();

      session.lastTestResults = testResults;

      const failedCount = testResults.filter(r => r.result === 'FAILED').length;
      const passedCount = testResults.filter(r => r.result === 'PASSED').length;

      res.json({
        success: true,
        workspaceId: id,
        summary: {
          total: testResults.length,
          passed: passedCount,
          failed: failedCount
        },
        results: testResults
      });
    } catch (err) {
      if (serverInstance) serverInstance.stop();
      console.error('[TEST ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to execute API tests' });
    }
  }

  /**
   * Diagnose a failed test using AI
   */
  static async diagnoseProject(req, res) {
    try {
      const { id } = req.params;
      const { endpointPath } = req.body;
      const session = sessionStore.get(id);

      if (!session || !session.lastTestResults) {
        return res.status(400).json({ error: 'No test results available to diagnose.' });
      }

      const failedResult = session.lastTestResults.find(r => r.result === 'FAILED' && (!endpointPath || r.endpoint === endpointPath))
                           || session.lastTestResults.find(r => r.result === 'FAILED');

      if (!failedResult) {
        return res.status(400).json({ error: 'No failed endpoint found to diagnose.' });
      }

      // Analyze source code to find relevant files & snippets
      const relevantFiles = CodeAnalyzer.findRelevantFiles(
        session.originalDir,
        failedResult,
        session.analysis ? session.analysis.routes : []
      );

      const errorContext = {
        framework: session.analysis ? session.analysis.framework : 'Express',
        endpoint: failedResult.endpoint,
        method: failedResult.method,
        status: failedResult.status,
        errorDetails: failedResult.errorDetails,
        logs: failedResult.logs,
        stderr: failedResult.stderr,
        relevantFiles
      };

      const diagnosis = await AiService.diagnoseError(errorContext);

      session.diagnosis = diagnosis;
      session.failedEndpoint = failedResult;

      res.json({
        success: true,
        workspaceId: id,
        failedEndpoint: failedResult,
        relevantFiles: relevantFiles.map(f => ({ relativePath: f.relativePath, errorLine: f.errorLine, snippet: f.snippet })),
        diagnosis
      });
    } catch (err) {
      console.error('[DIAGNOSE ERROR]', err);
      res.status(500).json({ error: err.message || 'AI Diagnosis failed' });
    }
  }

  /**
   * Apply AI generated fix to temporary patched workspace
   */
  static async applyFix(req, res) {
    try {
      const { id } = req.params;
      const session = sessionStore.get(id);
      if (!session || !session.diagnosis) {
        return res.status(400).json({ error: 'No AI diagnosis available to apply fix.' });
      }

      const fixPayload = req.body.fix || session.diagnosis;
      const result = FixerService.applyFix(session.patchedDir, fixPayload);

      session.fix = result;

      res.json({
        success: true,
        workspaceId: id,
        result
      });
    } catch (err) {
      console.error('[APPLY FIX ERROR]', err);
      res.status(400).json({ success: false, error: err.message || 'Failed to apply code fix' });
    }
  }

  /**
   * Verify fix by running process in patched directory and retesting
   */
  static async verifyFix(req, res) {
    let serverInstance = null;
    try {
      const { id } = req.params;
      const session = sessionStore.get(id);
      if (!session) {
        return res.status(404).json({ error: 'Workspace session not found' });
      }

      const failedEndpoint = session.failedEndpoint;
      if (!failedEndpoint) {
        return res.status(400).json({ error: 'No previous failed endpoint to verify.' });
      }

      const analysis = session.analysis || ProjectAnalyzer.analyze(session.patchedDir);

      // Start patched API server
      serverInstance = await ProcessManager.startServer(session.patchedDir, analysis.entryPoint);
      if (!serverInstance.isReady) {
        serverInstance.stop();
        const fallbackVerification = {
          verified: false,
          endpoint: failedEndpoint.endpoint,
          method: failedEndpoint.method,
          before: {
            status: failedEndpoint.status,
            result: failedEndpoint.result,
            error: failedEndpoint.errorDetails ? failedEndpoint.errorDetails.message : 'Error'
          },
          after: {
            status: 500,
            result: 'FAILED',
            responseTimeMs: 0,
            responseBody: { error: 'Patched server failed to start' }
          }
        };

        session.verification = fallbackVerification;

        return res.json({
          success: true,
          workspaceId: id,
          verified: false,
          message: 'Patched server failed to start',
          verification: fallbackVerification
        });
      }

      const baseUrl = `http://127.0.0.1:${serverInstance.port}`;
      const afterResult = await ApiTester.testSingleEndpoint(
        baseUrl,
        { method: failedEndpoint.method, path: failedEndpoint.endpoint },
        serverInstance
      );

      serverInstance.stop();

      const verified = afterResult.result === 'PASSED';

      const verificationData = {
        verified,
        endpoint: failedEndpoint.endpoint,
        method: failedEndpoint.method,
        before: {
          status: failedEndpoint.status,
          result: failedEndpoint.result,
          error: failedEndpoint.errorDetails ? failedEndpoint.errorDetails.message : 'Error'
        },
        after: {
          status: afterResult.status,
          result: afterResult.result,
          responseTimeMs: afterResult.responseTimeMs,
          responseBody: afterResult.responseBody
        }
      };

      session.verification = verificationData;

      res.json({
        success: true,
        workspaceId: id,
        verified,
        verification: verificationData
      });
    } catch (err) {
      if (serverInstance) serverInstance.stop();
      console.error('[VERIFY ERROR]', err);
      res.status(500).json({ error: err.message || 'Verification process failed' });
    }
  }

  /**
   * Get workspace session status
   */
  static async getStatus(req, res) {
    const { id } = req.params;
    const session = sessionStore.get(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      workspaceId: id,
      hasAnalysis: !!session.analysis,
      hasTestResults: !!session.lastTestResults,
      hasDiagnosis: !!session.diagnosis,
      hasFix: !!session.fix,
      hasVerification: !!session.verification
    });
  }
}

module.exports = ProjectController;
