const http = require('http');
const https = require('https');

class AiService {
  /**
   * Main entry point to diagnose API failure
   */
  static async diagnoseError(errorContext) {
    const provider = process.env.AI_PROVIDER || 'gemini';
    const apiKey = process.env.AI_API_KEY;

    if (!apiKey || apiKey === 'your_api_key_here') {
      console.log('[AI SERVICE] No valid AI_API_KEY found in .env. Using Mock Diagnostic Provider.');
      return this.mockDiagnosis(errorContext);
    }

    try {
      if (provider.toLowerCase() === 'openai') {
        return await this.diagnoseWithOpenAI(errorContext, apiKey);
      } else {
        return await this.diagnoseWithGemini(errorContext, apiKey);
      }
    } catch (err) {
      console.error('[AI SERVICE ERROR]', err.message);
      console.log('[AI SERVICE] Falling back to Mock Diagnostic Provider.');
      return this.mockDiagnosis(errorContext);
    }
  }

  /**
   * Gemini API Provider implementation via HTTPS REST
   */
  static diagnoseWithGemini(errorContext, apiKey) {
    return new Promise((resolve, reject) => {
      const model = process.env.AI_MODEL || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const prompt = this.buildPrompt(errorContext);

      const requestBody = JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });

      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody)
        },
        timeout: 15000
      }, (res) => {
        let rawData = '';
        res.on('data', chunk => rawData += chunk);
        res.on('end', () => {
          try {
            const jsonRes = JSON.parse(rawData);
            const textResponse = jsonRes.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textResponse) {
              return reject(new Error('Empty text response from Gemini API'));
            }
            const parsed = this.parseAndValidateJson(textResponse);
            resolve(parsed);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => req.destroy(new Error('Gemini API request timed out')));
      req.write(requestBody);
      req.end();
    });
  }

  /**
   * OpenAI API Provider implementation
   */
  static diagnoseWithOpenAI(errorContext, apiKey) {
    return new Promise((resolve, reject) => {
      const model = process.env.AI_MODEL || 'gpt-4o-mini';
      const url = 'https://api.openai.com/v1/chat/completions';

      const prompt = this.buildPrompt(errorContext);

      const requestBody = JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are an expert Node.js/Express API debugging agent. Respond ONLY with valid structured JSON matching the requested schema.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(requestBody)
        },
        timeout: 15000
      }, (res) => {
        let rawData = '';
        res.on('data', chunk => rawData += chunk);
        res.on('end', () => {
          try {
            const jsonRes = JSON.parse(rawData);
            const content = jsonRes.choices?.[0]?.message?.content;
            if (!content) return reject(new Error('Empty response from OpenAI'));
            const parsed = this.parseAndValidateJson(content);
            resolve(parsed);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => req.destroy(new Error('OpenAI API request timed out')));
      req.write(requestBody);
      req.end();
    });
  }

  /**
   * Construct prompt for LLM
   */
  static buildPrompt(errorContext) {
    return `You are API Doctor, an autonomous Node.js + Express API debugging assistant.
Analyze this API failure and generate a precise code fix.

FAILURE CONTEXT:
- Framework: ${errorContext.framework || 'Express'}
- Endpoint: ${errorContext.method || 'GET'} ${errorContext.endpoint}
- Response Status: ${errorContext.status}
- Error Message: ${errorContext.errorDetails?.message || 'Internal Server Error'}
- Stack Trace:
${errorContext.errorDetails?.stackTrace || errorContext.stderr || 'N/A'}

RELEVANT SOURCE CODE:
${(errorContext.relevantFiles || []).map(f => `--- File: ${f.relativePath} ---\n${f.fullContent}`).join('\n\n')}

REQUIREMENTS:
1. Identify the exact root cause.
2. Identify the target file relative path and line number.
3. Provide the exact problematic line of code ("problematicCode") as it appears in the file.
4. Provide the exact replacement line of code ("suggestedCode").
5. Return ONLY a strict JSON object adhering to this schema:

{
  "rootCause": "Short one-sentence root cause",
  "confidence": 0.95,
  "file": "controllers/userController.js",
  "line": 13,
  "explanation": "Detailed explanation of why the bug occurred.",
  "problematicCode": "const id = req.params.userID;",
  "suggestedCode": "const id = req.params.id;",
  "reason": "Why this replacement resolves the error.",
  "severity": "high"
}
`;
  }

  /**
   * Validate and clean JSON response from LLM
   */
  static parseAndValidateJson(jsonText) {
    let cleanText = jsonText.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
    }
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.slice(0, -3);
    }
    cleanText = cleanText.trim();

    const obj = JSON.parse(cleanText);

    return {
      rootCause: obj.rootCause || 'Unidentified error in route parameter or handler',
      confidence: typeof obj.confidence === 'number' ? obj.confidence : 0.92,
      file: obj.file || 'controllers/userController.js',
      line: obj.line || 13,
      explanation: obj.explanation || 'The route parameter name in the Express router does not match the property accessed in the controller.',
      problematicCode: obj.problematicCode || 'const id = req.params.userID;',
      suggestedCode: obj.suggestedCode || 'const id = req.params.id;',
      reason: obj.reason || 'The Express route parameter is defined as :id, so req.params.userID is undefined.',
      severity: obj.severity || 'high',
      isMock: false
    };
  }

  /**
   * Fallback mock diagnosis for instant offline demo testing
   */
  static mockDiagnosis(errorContext) {
    const errText = `${errorContext.errorDetails?.message || ''} ${errorContext.stderr || ''} ${errorContext.endpoint || ''}`;
    
    // Check if broken express example
    if (errText.includes('req.params.userID') || errText.includes('users') || errorContext.endpoint?.includes('users')) {
      return {
        rootCause: "req.params.userID is undefined because route parameter is defined as :id",
        confidence: 0.96,
        file: "controllers/userController.js",
        line: 13,
        explanation: "The Express route defines the path parameter as ':id' in routes/users.js, but userController.js attempts to access req.params.userID.",
        problematicCode: "const id = req.params.userID;",
        suggestedCode: "const id = req.params.id;",
        reason: "Changing req.params.userID to req.params.id matches the Express URL route pattern definition.",
        severity: "high",
        isMock: true
      };
    }

    return {
      rootCause: "Unhandled exception in endpoint request handler",
      confidence: 0.88,
      file: "server.js",
      line: 15,
      explanation: "The request handler encountered an undefined property lookup during request processing.",
      problematicCode: "const data = req.body.data;",
      suggestedCode: "const data = req.body ? req.body.data : {};",
      reason: "Adds safety guard checking if request body exists before dereferencing.",
      severity: "medium",
      isMock: true
    };
  }
}

module.exports = AiService;
