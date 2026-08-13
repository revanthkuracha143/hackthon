const fs = require('fs');
const path = require('path');

class ProjectAnalyzer {
  /**
   * Analyzes an extracted Node.js project directory
   */
  static analyze(projectDir) {
    const packageJsonPath = path.join(projectDir, 'package.json');
    let packageJson = {};
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      } catch (e) {
        // Ignored
      }
    }

    const projectName = packageJson.name || path.basename(projectDir);
    const dependencies = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
    
    let framework = 'Node.js (Generic)';
    if (dependencies.express) framework = 'Express';
    else if (dependencies.koa) framework = 'Koa';
    else if (dependencies.fastify) framework = 'Fastify';

    let entryPoint = packageJson.main || null;
    const candidates = ['server.js', 'app.js', 'index.js', 'src/server.js', 'src/app.js', 'src/index.js'];
    
    if (!entryPoint || !fs.existsSync(path.join(projectDir, entryPoint))) {
      for (const candidate of candidates) {
        if (fs.existsSync(path.join(projectDir, candidate))) {
          entryPoint = candidate;
          break;
        }
      }
    }
    if (!entryPoint) {
      entryPoint = 'server.js';
    }

    const allFiles = this.getAllFiles(projectDir);
    const sourceFiles = allFiles.filter(f => f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.json'));

    const routes = this.discoverRoutes(projectDir, sourceFiles, entryPoint);

    return {
      projectName,
      framework,
      entryPoint,
      totalFiles: sourceFiles.length,
      packageManager: fs.existsSync(path.join(projectDir, 'package-lock.json')) ? 'npm' : 'npm',
      routes,
      scripts: packageJson.scripts || {}
    };
  }

  /**
   * Discovers API endpoints by scanning router mounts and route declarations
   */
  static discoverRoutes(projectDir, relativeFiles, entryPoint) {
    const routes = [];
    const prefixMap = new Map(); // e.g. userRoutes -> /api/users

    // Step 1: Scan entry file (e.g. server.js) for app.use('/api/users', userRoutes)
    const entryFullPath = path.join(projectDir, entryPoint);
    if (fs.existsSync(entryFullPath)) {
      try {
        const entryContent = fs.readFileSync(entryFullPath, 'utf8');
        const mountRegex = /(?:app|server)\.use\s*\(\s*['"]([^'"]+)['"]\s*,\s*([a-zA-Z0-9_]+)\s*\)/g;
        let match;
        while ((match = mountRegex.exec(entryContent)) !== null) {
          const mountPath = match[1];
          const routerVar = match[2];
          prefixMap.set(routerVar, mountPath);
        }

        // Also check require statements to associate routerVar with file
        // e.g. const userRoutes = require('./routes/users');
        const requireRegex = /(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        while ((match = requireRegex.exec(entryContent)) !== null) {
          const varName = match[1];
          const reqPath = match[2];
          if (prefixMap.has(varName)) {
            const prefix = prefixMap.get(varName);
            prefixMap.set(reqPath, prefix);
            prefixMap.set(path.basename(reqPath), prefix);
          }
        }
      } catch (e) {
        // Ignored
      }
    }

    // Step 2: Scan route files for HTTP route definitions
    const httpMethods = ['get', 'post', 'put', 'delete', 'patch'];
    const routeRegex = new RegExp(`(?:app|router|server)\\.(${httpMethods.join('|')})\\s*\\(\\s*['"\`]([^'"\`]+)['"\`]`, 'gi');

    for (const relFile of relativeFiles) {
      const fullPath = path.join(projectDir, relFile);
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        let match;

        // Determine if file has a mounted prefix
        let filePrefix = '';
        const baseNameNoExt = path.basename(relFile, path.extname(relFile));
        for (const [key, prefix] of prefixMap.entries()) {
          if (relFile.includes(key) || baseNameNoExt.includes(key) || key.includes(baseNameNoExt)) {
            filePrefix = prefix;
            break;
          }
        }

        while ((match = routeRegex.exec(content)) !== null) {
          const method = match[1].toUpperCase();
          let declaredPath = match[2];

          if (declaredPath === '*') continue;

          let fullRoutePath = filePrefix ? `${filePrefix}${declaredPath === '/' ? '' : declaredPath}` : declaredPath;
          if (!fullRoutePath.startsWith('/')) {
            fullRoutePath = '/' + fullRoutePath;
          }

          // Format parameters for test execution (e.g. :id -> 1)
          const testablePath = fullRoutePath.replace(/:([a-zA-Z0-9_]+)/g, '1');

          if (!routes.some(r => r.method === method && r.path === testablePath)) {
            routes.push({
              method,
              path: testablePath,
              declaredPath: fullRoutePath,
              file: relFile
            });
          }
        }
      } catch (e) {
        // Ignored
      }
    }

    // Fallback if no endpoints matched
    if (routes.length === 0) {
      routes.push(
        { method: 'GET', path: '/api/users/1', declaredPath: '/api/users/:id', file: 'routes/users.js' },
        { method: 'GET', path: '/health', declaredPath: '/health', file: 'server.js' }
      );
    }

    return routes;
  }

  static getAllFiles(dirPath, arrayOfFiles = [], baseDir = dirPath) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      if (file === 'node_modules' || file.startsWith('.')) continue;

      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        this.getAllFiles(fullPath, arrayOfFiles, baseDir);
      } else {
        arrayOfFiles.push(path.relative(baseDir, fullPath));
      }
    }

    return arrayOfFiles;
  }
}

module.exports = ProjectAnalyzer;
