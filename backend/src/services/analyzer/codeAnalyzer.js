const fs = require('fs');
const path = require('path');

class CodeAnalyzer {
  /**
   * Identifies relevant source files and extracts snippets based on error and route info
   */
  static findRelevantFiles(projectDir, failedResult, knownRoutes = []) {
    const relevant = [];
    const stackTrace = failedResult.errorDetails ? failedResult.errorDetails.stackTrace : '';
    const endpoint = failedResult.endpoint;

    // 1. Check stack trace for references to project files
    const fileMatches = stackTrace.match(/([a-zA-Z0-9_\-/.]+\.js):(\d+):(\d+)/g) || [];
    for (const match of fileMatches) {
      const parts = match.split(':');
      const relPath = parts[0];
      const lineNum = parseInt(parts[1], 10);

      const fullPath = path.join(projectDir, relPath);
      if (fs.existsSync(fullPath) && !relPath.includes('node_modules')) {
        this.addRelevantFile(relevant, projectDir, relPath, lineNum);
      }
    }

    // 2. Check route table for matching endpoint
    const routeInfo = knownRoutes.find(r => r.path === endpoint || endpoint.startsWith(r.path.replace(/:[a-zA-Z0-9_]+/g, '')));
    if (routeInfo && routeInfo.file) {
      this.addRelevantFile(relevant, projectDir, routeInfo.file);
    }

    // 3. Scan project for controllers/routes if list is still empty
    if (relevant.length === 0) {
      const candidates = ['controllers/userController.js', 'routes/users.js', 'server.js', 'app.js', 'index.js'];
      for (const cand of candidates) {
        if (fs.existsSync(path.join(projectDir, cand))) {
          this.addRelevantFile(relevant, projectDir, cand);
        }
      }
    }

    return relevant;
  }

  static addRelevantFile(relevantArray, projectDir, relativePath, errorLine = null) {
    // Avoid duplicate additions
    if (relevantArray.some(r => r.relativePath === relativePath)) return;

    const fullPath = path.join(projectDir, relativePath);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      let snippet = content;
      if (errorLine && lines.length > 30) {
        const start = Math.max(0, errorLine - 15);
        const end = Math.min(lines.length, errorLine + 15);
        snippet = lines.slice(start, end).join('\n');
      }

      relevantArray.push({
        relativePath,
        errorLine,
        fullContent: content,
        snippet
      });
    } catch (e) {
      // Skip unreadable files
    }
  }
}

module.exports = CodeAnalyzer;
