const fs = require('fs');
const path = require('path');
const diff = require('diff');

class FixerService {
  /**
   * Applies proposed fix to the temporary patched workspace directory
   */
  static applyFix(patchedDir, fixPayload) {
    if (!fixPayload) {
      throw new Error('Fix payload is empty or invalid.');
    }

    let { file: relativePath, problematicCode, suggestedCode, line } = fixPayload;

    if (!relativePath) {
      throw new Error('Fix payload missing target file path.');
    }

    // Strip leading slashes to prevent absolute path override in path.join on POSIX/macOS
    let cleanRelativePath = relativePath.replace(/^[/\\]+/, '');
    let targetFilePath = path.join(patchedDir, cleanRelativePath);

    // If file doesn't exist at specified relative path, search workspace by basename
    if (!fs.existsSync(targetFilePath)) {
      const fileName = path.basename(cleanRelativePath);
      const foundPath = this.findFileByName(patchedDir, fileName);
      if (!foundPath) {
        throw new Error(`Target file '${cleanRelativePath}' does not exist in workspace.`);
      }
      targetFilePath = foundPath;
      cleanRelativePath = path.relative(patchedDir, foundPath);
    }

    let originalContent = fs.readFileSync(targetFilePath, 'utf8');

    // Normalize line endings
    originalContent = originalContent.replace(/\r\n/g, '\n');
    const cleanProblematic = (problematicCode || '').replace(/\r\n/g, '\n').trim();
    const cleanSuggested = (suggestedCode || '').replace(/\r\n/g, '\n').trim();

    let updatedContent = originalContent;

    if (cleanProblematic && originalContent.includes(cleanProblematic)) {
      // 1. Exact string match
      updatedContent = originalContent.replace(cleanProblematic, cleanSuggested);
    } else if (cleanProblematic) {
      const lines = originalContent.split('\n');
      // 2. Line-trimmed match
      const foundIndex = lines.findIndex(l => l.trim() === cleanProblematic);
      if (foundIndex !== -1) {
        lines[foundIndex] = lines[foundIndex].replace(lines[foundIndex].trim(), cleanSuggested);
        updatedContent = lines.join('\n');
      } else if (typeof line === 'number' && line > 0 && line <= lines.length) {
        // 3. Line number replacement fallback
        lines[line - 1] = cleanSuggested;
        updatedContent = lines.join('\n');
      } else {
        throw new Error(`Target code snippet '${cleanProblematic}' was not found in ${cleanRelativePath}. Cannot apply fix safely.`);
      }
    }

    // Save patched file
    fs.writeFileSync(targetFilePath, updatedContent, 'utf8');

    // Generate diff structure
    const diffResult = this.generateDiff(originalContent, updatedContent, cleanRelativePath);

    return {
      success: true,
      file: cleanRelativePath,
      diff: diffResult,
      originalContent,
      updatedContent
    };
  }

  /**
   * Helper to search directory recursively for a file by basename
   */
  static findFileByName(dir, fileName) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = this.findFileByName(fullPath, fileName);
        if (found) return found;
      } else if (entry.name === fileName) {
        return fullPath;
      }
    }

    return null;
  }

  /**
   * Generates structured visual line-by-line code diff
   */
  static generateDiff(oldStr, newStr, fileName) {
    const changes = diff.diffLines(oldStr, newStr);
    const structuredLines = [];

    let lineOld = 1;
    let lineNew = 1;

    for (const change of changes) {
      const lines = change.value.replace(/\n$/, '').split('\n');
      for (const line of lines) {
        if (change.added) {
          structuredLines.push({
            type: 'add',
            lineOld: null,
            lineNew: lineNew++,
            content: line
          });
        } else if (change.removed) {
          structuredLines.push({
            type: 'remove',
            lineOld: lineOld++,
            lineNew: null,
            content: line
          });
        } else {
          structuredLines.push({
            type: 'normal',
            lineOld: lineOld++,
            lineNew: lineNew++,
            content: line
          });
        }
      }
    }

    return {
      fileName,
      lines: structuredLines
    };
  }
}

module.exports = FixerService;
