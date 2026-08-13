const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');
const { v4: uuidv4 } = require('uuid');

const BASE_TEMP_DIR = path.join(os.tmpdir(), 'api-doctor-workspaces');

// Ensure base temp directory exists
if (!fs.existsSync(BASE_TEMP_DIR)) {
  fs.mkdirSync(BASE_TEMP_DIR, { recursive: true });
}

class WorkspaceManager {
  /**
   * Creates a workspace from an uploaded zip file or buffer
   */
  static createFromZip(zipBufferOrPath) {
    const id = uuidv4();
    const workspaceDir = path.join(BASE_TEMP_DIR, id);
    const originalDir = path.join(workspaceDir, 'original');
    const patchedDir = path.join(workspaceDir, 'patched');

    fs.mkdirSync(originalDir, { recursive: true });

    // Safe extraction (Zip Slip protection)
    const zip = new AdmZip(zipBufferOrPath);
    const zipEntries = zip.getEntries();

    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      
      // Skip macOS metadata files (__MACOSX, .DS_Store)
      if (entry.entryName.includes('__MACOSX') || path.basename(entry.entryName).startsWith('._')) {
        continue;
      }

      const targetPath = path.normalize(path.join(originalDir, entry.entryName));
      if (!targetPath.startsWith(path.normalize(originalDir))) {
        throw new Error(`Security Violation: Zip entry '${entry.entryName}' attempts directory traversal outside destination.`);
      }

      const dirName = path.dirname(targetPath);
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
      }

      fs.writeFileSync(targetPath, entry.getData());
    }

    // Check if zip had a single wrapper root folder or nested package.json
    const effectiveOriginalDir = this.unwrapSingleFolder(originalDir);

    // Create identical patched copy
    this.copyDirectory(effectiveOriginalDir, patchedDir);

    this.linkNodeModules(effectiveOriginalDir, effectiveOriginalDir);
    this.linkNodeModules(effectiveOriginalDir, patchedDir);

    return {
      id,
      workspaceDir,
      originalDir: effectiveOriginalDir,
      patchedDir
    };
  }

  /**
   * Creates a demo workspace from local example folder
   */
  static createFromDirectory(sourceDir) {
    const id = `demo-${uuidv4().substring(0, 8)}`;
    const workspaceDir = path.join(BASE_TEMP_DIR, id);
    const originalDir = path.join(workspaceDir, 'original');
    const patchedDir = path.join(workspaceDir, 'patched');

    fs.mkdirSync(originalDir, { recursive: true });
    this.copyDirectory(sourceDir, originalDir);
    this.copyDirectory(originalDir, patchedDir);

    this.linkNodeModules(sourceDir, originalDir);
    this.linkNodeModules(sourceDir, patchedDir);

    return {
      id,
      workspaceDir,
      originalDir,
      patchedDir
    };
  }

  /**
   * Symlinks node_modules into target directory if missing
   */
  static linkNodeModules(sourceDir, targetDir) {
    const candidatePaths = [
      path.join(sourceDir, 'node_modules'),
      path.join(__dirname, '../../../node_modules'),
      path.join(__dirname, '../../../../node_modules'),
      path.join(__dirname, '../../../../examples/broken-express-api/node_modules'),
      path.resolve(process.cwd(), 'node_modules'),
      path.resolve(process.cwd(), 'backend/node_modules')
    ];

    const foundNodeModules = candidatePaths.find(p => fs.existsSync(p));
    const targetNodeModules = path.join(targetDir, 'node_modules');

    if (foundNodeModules && !fs.existsSync(targetNodeModules)) {
      try {
        fs.symlinkSync(foundNodeModules, targetNodeModules, 'junction');
      } catch (err) {
        // Ignored fallback
      }
    }
  }

  /**
   * Robustly locates the project root containing package.json or main entry
   */
  static unwrapSingleFolder(dirPath) {
    // 1. If package.json is at root, return dirPath
    if (fs.existsSync(path.join(dirPath, 'package.json'))) {
      return dirPath;
    }

    // 2. Search subdirectories (ignoring hidden files & __MACOSX)
    const entries = fs.readdirSync(dirPath).filter(e => !e.startsWith('.') && e !== '__MACOSX' && e !== 'node_modules');
    
    // Look for a child directory containing package.json
    for (const entry of entries) {
      const fullSubPath = path.join(dirPath, entry);
      if (fs.statSync(fullSubPath).isDirectory()) {
        if (fs.existsSync(path.join(fullSubPath, 'package.json'))) {
          return fullSubPath;
        }
      }
    }

    // 3. Fallback if single folder
    if (entries.length === 1) {
      const singlePath = path.join(dirPath, entries[0]);
      if (fs.statSync(singlePath).isDirectory()) {
        return singlePath;
      }
    }

    return dirPath;
  }

  /**
   * Recursively copies a directory
   */
  static copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === '__MACOSX') continue;

      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Clean up workspace
   */
  static cleanup(workspaceId) {
    const workspaceDir = path.join(BASE_TEMP_DIR, workspaceId);
    if (fs.existsSync(workspaceDir)) {
      try {
        fs.rmSync(workspaceDir, { recursive: true, force: true });
      } catch (err) {
        console.error(`Failed to clean up workspace ${workspaceId}:`, err.message);
      }
    }
  }
}

module.exports = WorkspaceManager;
