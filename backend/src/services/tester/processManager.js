const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');
const net = require('net');
const path = require('path');

class ProcessManager {
  /**
   * Finds an available open port in range
   */
  static async findAvailablePort(startPort = 5500, endPort = 6500) {
    for (let port = startPort; port <= endPort; port++) {
      const isFree = await new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(false));
        server.once('listening', () => {
          server.close(() => resolve(true));
        });
        try {
          server.listen({ port, host: '127.0.0.1', exclusive: true });
        } catch (e) {
          resolve(false);
        }
      });
      if (isFree) return port;
    }
    return Math.floor(Math.random() * (6500 - 5500)) + 5500;
  }

  /**
   * Starts the target application process in workspace directory
   */
  static async startServer(projectDir, entryPoint = 'server.js', timeoutMs = 8000) {
    const assignedPort = await this.findAvailablePort();
    const logs = [];
    const errors = [];

    const nodePath = [
      path.join(projectDir, 'node_modules'),
      path.join(projectDir, '..', 'node_modules'),
      path.join(__dirname, '../../../node_modules'),
      path.join(__dirname, '../../../../node_modules'),
      path.join(__dirname, '../../../../examples/broken-express-api/node_modules'),
      path.resolve(process.cwd(), 'node_modules'),
      path.resolve(process.cwd(), 'backend/node_modules'),
      process.env.NODE_PATH || ''
    ].filter(Boolean).join(path.delimiter);

    const env = {
      ...process.env,
      PORT: String(assignedPort),
      NODE_ENV: 'test',
      NODE_PATH: nodePath
    };

    const scriptPath = path.join(projectDir, entryPoint);

    // 1. Validate JavaScript syntax before spawning server process
    const { spawnSync } = require('child_process');
    if (fs.existsSync(scriptPath)) {
      const check = spawnSync('node', ['--check', scriptPath], { cwd: projectDir, env });
      if (check.status !== 0) {
        const syntaxErr = (check.stderr ? check.stderr.toString() : '') || (check.stdout ? check.stdout.toString() : '') || `Syntax error detected in ${entryPoint}`;
        errors.push(syntaxErr);
        return {
          port: assignedPort,
          child: null,
          logs: [],
          errors,
          isReady: false,
          startupError: syntaxErr,
          stop: () => {}
        };
      }
    }

    // 2. Spawn Node API server process
    const child = spawn('node', [scriptPath], {
      cwd: projectDir,
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    child.stdout.on('data', (data) => {
      const text = data.toString();
      logs.push(text);
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      errors.push(text);
    });

    child.on('error', (err) => {
      errors.push(`Child Process Spawn Error: ${err.message}`);
    });

    child.on('exit', (code, signal) => {
      if (code !== null && code !== 0) {
        errors.push(`Process exited prematurely with code ${code}${signal ? ` (Signal: ${signal})` : ''}`);
      }
    });

    let isTerminated = false;
    const cleanupProcess = () => {
      if (!isTerminated && child && !child.killed) {
        isTerminated = true;
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) child.kill('SIGKILL');
        }, 1000);
      }
    };

    // Wait until server is listening on assigned port or a fallback port extracted from logs
    const readyResult = await this.waitForServerReady(assignedPort, child, logs, errors, timeoutMs);
    const startupStderr = errors.join('\n') || logs.join('\n') || (readyResult.isReady ? '' : 'API Server startup timed out before listening.');

    return {
      port: readyResult.activePort || assignedPort,
      child,
      logs,
      errors,
      isReady: readyResult.isReady,
      startupError: startupStderr,
      stop: cleanupProcess
    };
  }

  /**
   * Polls assigned port and extracted log ports until HTTP/TCP connection succeeds
   */
  static async waitForServerReady(assignedPort, child, logs, errors, timeoutMs = 8000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      if (child.exitCode !== null) {
        // Process exited prematurely
        return { isReady: false, activePort: null };
      }

      // Collect candidate ports to probe: assignedPort + ports extracted from logs + fallback 3000, 8080, 5000
      const candidatePorts = new Set([assignedPort]);
      const fullLogText = `${logs.join('\n')} ${errors.join('\n')}`;

      // Extract port numbers from log strings (e.g. "port 3000", "listening at :8080", "localhost:3000")
      const portRegexes = [
        /(?:port|listening on|listening at|localhost:)\s*:?\s*(\d{4,5})/gi,
        /:(\d{4,5})\b/g
      ];

      for (const rx of portRegexes) {
        let m;
        while ((m = rx.exec(fullLogText)) !== null) {
          const parsedPort = parseInt(m[1], 10);
          if (parsedPort > 1000 && parsedPort < 65535) {
            candidatePorts.add(parsedPort);
          }
        }
      }

      // Common hardcoded fallbacks (avoid macOS AirPlay ports 5000 & 7000)
      candidatePorts.add(3000);
      candidatePorts.add(8080);

      for (const p of candidatePorts) {
        const connected = await this.checkTcpPort(p);
        if (connected) {
          return { isReady: true, activePort: p };
        }
      }

      await new Promise(res => setTimeout(res, 250));
    }

    return { isReady: false, activePort: null };
  }

  /**
   * Helper to check TCP connection to host/port
   */
  static checkTcpPort(port, host = '127.0.0.1') {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(500);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, host);
    });
  }
}

module.exports = ProcessManager;
