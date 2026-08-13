const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const WorkspaceManager = require('../src/services/workspace/workspaceManager');

describe('WorkspaceManager', () => {
  const sampleDir = path.join(__dirname, '../../examples/broken-express-api');

  test('should create workspace from local directory', () => {
    const session = WorkspaceManager.createFromDirectory(sampleDir);
    expect(session.id).toBeDefined();
    expect(fs.existsSync(session.originalDir)).toBe(true);
    expect(fs.existsSync(session.patchedDir)).toBe(true);
    expect(fs.existsSync(path.join(session.originalDir, 'server.js'))).toBe(true);

    WorkspaceManager.cleanup(session.id);
  });

  test('should extract ZIP buffer and unwrap package.json directory properly even with __MACOSX present', () => {
    const zip = new AdmZip();
    zip.addLocalFile(path.join(sampleDir, 'server.js'), 'my-app');
    zip.addLocalFile(path.join(sampleDir, 'package.json'), 'my-app');
    zip.addFile('__MACOSX/._server.js', Buffer.from('junk data'));
    const zipBuffer = zip.toBuffer();

    const session = WorkspaceManager.createFromZip(zipBuffer);
    expect(session.id).toBeDefined();
    expect(fs.existsSync(path.join(session.originalDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(session.originalDir, 'server.js'))).toBe(true);

    WorkspaceManager.cleanup(session.id);
  });
});
