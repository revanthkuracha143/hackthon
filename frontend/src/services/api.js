const API_BASE = '/api/projects';

export async function uploadZip(file) {
  const formData = new FormData();
  formData.append('project', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export async function loadDemo() {
  const res = await fetch(`${API_BASE}/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load demo');
  return data;
}

export async function analyzeProject(workspaceId) {
  const res = await fetch(`${API_BASE}/${workspaceId}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Analysis failed');
  return data;
}

export async function testProject(workspaceId) {
  const res = await fetch(`${API_BASE}/${workspaceId}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API testing failed');
  return data;
}

export async function diagnoseProject(workspaceId, endpointPath = null) {
  const res = await fetch(`${API_BASE}/${workspaceId}/diagnose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpointPath })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'AI Diagnosis failed');
  return data;
}

export async function applyFix(workspaceId, fix = null) {
  const res = await fetch(`${API_BASE}/${workspaceId}/apply-fix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fix })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to apply fix');
  return data;
}

export async function verifyFix(workspaceId) {
  const res = await fetch(`${API_BASE}/${workspaceId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Verification failed');
  return data;
}
