const path = require('path');
const ProjectAnalyzer = require('../src/services/analyzer/projectAnalyzer');

describe('ProjectAnalyzer', () => {
  const sampleDir = path.join(__dirname, '../../examples/broken-express-api');

  test('should analyze Express project correctly', () => {
    const analysis = ProjectAnalyzer.analyze(sampleDir);
    expect(analysis.framework).toBe('Express');
    expect(analysis.entryPoint).toBe('server.js');
    expect(analysis.routes.length).toBeGreaterThan(0);
    expect(analysis.routes.some(r => r.path === '/api/users/1' || r.declaredPath === '/api/users/:id')).toBe(true);
  });
});
