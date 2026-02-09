const API_BASE = "http://localhost:8000";

function authHeaders(token) {
  return token ? { Authorization: token } : {};
}

async function request(path, options = {}) {
  const { headers: optHeaders, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: { "Content-Type": "application/json", ...optHeaders },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export function initiateOAuth(provider, redirectTo) {
  return request("/auth/oauth", {
    method: "POST",
    body: JSON.stringify({ provider, redirect_to: redirectTo }),
  });
}

export function exchangeCodeForSession(code) {
  return request(`/auth/oauth/callback?code=${encodeURIComponent(code)}`);
}

export function getUser(accessToken) {
  return request(`/auth/user?access_token=${encodeURIComponent(accessToken)}`);
}

export function refreshToken(refreshTokenStr) {
  return request("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshTokenStr }),
  });
}

export function signOut(accessToken) {
  return request("/auth/sign-out", {
    method: "POST",
    body: JSON.stringify({ access_token: accessToken }),
  });
}

export function connectIntegration(integration, accessToken) {
  return request(`/auth/connect/${integration}`, {
    method: "POST",
    headers: authHeaders(accessToken),
  });
}

export function listConnections(accessToken) {
  return request("/auth/connections", {
    headers: authHeaders(accessToken),
  });
}

export function listSources(integration, accessToken) {
  return request(`/schema/${integration}/sources`, {
    headers: authHeaders(accessToken),
  });
}

export function getSchema(integration, sourceId, accessToken) {
  return request(
    `/schema/${integration}?source_id=${encodeURIComponent(sourceId)}`,
    { headers: authHeaders(accessToken) }
  );
}

export function generateQuestions(integration, sourceId, accessToken) {
  return request(`/agent/${integration}/onboarding/questions`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ source_id: sourceId }),
  });
}

export function configureSchema(
  integration,
  sourceId,
  userAnswers,
  accessToken
) {
  return request(`/agent/${integration}/onboarding/configure`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ source_id: sourceId, user_answers: userAnswers }),
  });
}

export function processVideo(integration, youtubeUrl, sourceId, accessToken) {
  return request(`/agent/${integration}/process`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ youtube_url: youtubeUrl, source_id: sourceId }),
  });
}
