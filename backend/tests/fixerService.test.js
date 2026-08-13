const path = require('path');
const fs = require('fs');
const WorkspaceManager = require('../src/services/workspace/workspaceManager');
const FixerService = require('../src/services/fixer/fixerService');

describe('FixerService', () => {
  let session;

  beforeEach(() => {
    const sampleDir = path.join(__dirname, '../../examples/broken-express-api');
    session = WorkspaceManager.createFromDirectory(sampleDir);
  });

  afterEach(() => {
    WorkspaceManager.cleanup(session.id);
  });

  test('should apply code fix to patched workspace copy safely', () => {
    const fixPayload = {
      file: 'controllers/userController.js',
      problematicCode: 'const id = req.params.userID;',
      suggestedCode: 'const id = req.params.id;'
    };

    const result = FixerService.applyFix(session.patchedDir, fixPayload);
    expect(result.success).toBe(true);

    const patchedContent = fs.readFileSync(path.join(session.patchedDir, 'controllers/userController.js'), 'utf8');
    expect(patchedContent).toContain('const id = req.params.id;');

    // Original directory MUST remain unchanged!
    const originalContent = fs.readFileSync(path.join(session.originalDir, 'controllers/userController.js'), 'utf8');
    expect(originalContent).toContain('const id = req.params.userID;');
  });

  test('should handle file paths with leading slashes', () => {
    const fixPayload = {
      file: '/controllers/userController.js',
      problematicCode: 'const id = req.params.userID;',
      suggestedCode: 'const id = req.params.id;'
    };

    const result = FixerService.applyFix(session.patchedDir, fixPayload);
    expect(result.success).toBe(true);
  });

  test('should throw error if target code snippet does not exist and line fallback fails', () => {
    const badPayload = {
      file: 'controllers/userController.js',
      problematicCode: 'const nonExistentCode = 12345;',
      suggestedCode: 'const fixed = 1;',
      line: 999
    };

    expect(() => {
      FixerService.applyFix(session.patchedDir, badPayload);
    }).toThrow();
  });
});
