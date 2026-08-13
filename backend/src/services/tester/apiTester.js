const http = require('http');

class ApiTester {
  /**
   * Tests a list of endpoints against running server port
   */
  static async testEndpoints(baseUrl, endpoints, serverInstance) {
    const results = [];

    for (const ep of endpoints) {
      const result = await this.testSingleEndpoint(baseUrl, ep, serverInstance);
      results.push(result);
    }

    return results;
  }

  /**
   * Tests a single HTTP endpoint
   */
  static testSingleEndpoint(baseUrl, endpoint, serverInstance) {
    return new Promise((resolve) => {
      const method = (endpoint.method || 'GET').toUpperCase();
      const pathStr = endpoint.path || '/';
      const fullUrl = `${baseUrl}${pathStr}`;

      const startTime = Date.now();
      const urlObj = new URL(fullUrl);

      const reqOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'API-Doctor-Tester/1.0'
        },
        timeout: 5000
      };

      const req = http.request(reqOptions, (res) => {
        let bodyText = '';
        res.on('data', chunk => bodyText += chunk);
        res.on('end', () => {
          const duration = Date.now() - startTime;
          const status = res.statusCode;
          const isSuccess = status >= 200 && status < 400;

          let parsedBody = bodyText;
          try {
            parsedBody = JSON.parse(bodyText);
          } catch (e) {
            // Keep raw text if not JSON
          }

          // Gather logs and stderr captured during request
          const stdoutLogs = serverInstance.logs.join('');
          const stderrLogs = serverInstance.errors.join('');

          resolve({
            endpoint: pathStr,
            method,
            status,
            responseTimeMs: duration,
            result: isSuccess ? 'PASSED' : 'FAILED',
            responseBody: parsedBody,
            logs: stdoutLogs,
            stderr: stderrLogs,
            errorDetails: isSuccess ? null : {
              httpStatus: status,
              message: parsedBody.message || parsedBody.error || `HTTP ${status} Response`,
              rawBody: bodyText,
              stackTrace: this.extractStackTrace(stderrLogs || bodyText)
            }
          });
        });
      });

      req.on('error', (err) => {
        const duration = Date.now() - startTime;
        const stdoutLogs = serverInstance.logs.join('');
        const stderrLogs = serverInstance.errors.join('');

        resolve({
          endpoint: pathStr,
          method,
          status: 500,
          responseTimeMs: duration,
          result: 'FAILED',
          responseBody: { error: err.message },
          logs: stdoutLogs,
          stderr: stderrLogs,
          errorDetails: {
            httpStatus: 500,
            message: err.message,
            rawBody: err.message,
            stackTrace: err.stack || stderrLogs
          }
        });
      });

      req.on('timeout', () => {
        req.destroy(new Error('Request timed out after 5000ms'));
      });

      req.end();
    });
  }

  /**
   * Helper to parse stack trace out of stderr or response text
   */
  static extractStackTrace(text) {
    if (!text) return '';
    const lines = text.split('\n');
    const stackLines = lines.filter(l => l.trim().startsWith('at ') || l.includes('Error:'));
    return stackLines.join('\n') || text;
  }
}

module.exports = ApiTester;
