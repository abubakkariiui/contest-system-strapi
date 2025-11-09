const API_BASE =
  (import.meta.env.VITE_API_URL || 'http://localhost:1337').replace(/\/$/, '');

const buildUrl = (path) => {
  if (!path.startsWith('/')) {
    return `${API_BASE}/${path}`;
  }
  return `${API_BASE}${path}`;
};

const parseResponse = async (response) => {
  const raw = await response.text();
  let data = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (error) {
      console.warn('Failed to parse JSON response', error);
    }
  }

  if (!response.ok) {
    const message =
      data?.error?.message || data?.message || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.details = data?.error?.details || data;
    throw error;
  }

  return data;
};

const normalizeEntity = (input) => {
  if (Array.isArray(input)) {
    return input.map((value) => normalizeEntity(value));
  }

  if (input && typeof input === 'object') {
    if (Object.prototype.hasOwnProperty.call(input, 'data') && input.data !== undefined) {
      return normalizeEntity(input.data);
    }

    if (
      Object.prototype.hasOwnProperty.call(input, 'id') &&
      Object.prototype.hasOwnProperty.call(input, 'attributes')
    ) {
      return {
        id: input.id,
        ...normalizeEntity(input.attributes),
      };
    }

    const normalized = {};
    for (const [key, value] of Object.entries(input)) {
      normalized[key] = normalizeEntity(value);
    }
    return normalized;
  }

  return input;
};

const unwrapResponse = (payload) => {
  if (!payload) {
    return payload;
  }

  const { data, meta, ...rest } = payload;

  if (data === undefined) {
    return normalizeEntity(rest);
  }

  const normalizedData = normalizeEntity(data);
  return {
    data: normalizedData,
    meta,
  };
};

export const apiFetch = async (path, { method = 'GET', body, token, headers } = {}) => {
  let response;
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error('Network request failed. Please check your connection.');
  }

  const parsed = await parseResponse(response);
  return unwrapResponse(parsed);
};

export const loginRequest = ({ identifier, password }) =>
  apiFetch('/api/auth/local', {
    method: 'POST',
    body: { identifier, password },
  });

export const registerRequest = ({ username, email, password }) =>
  apiFetch('/api/auth/local/register', {
    method: 'POST',
    body: { username, email, password },
  });

export const getCurrentUser = (token) =>
  apiFetch('/api/users/me?populate=role', {
    token,
  });

export const getContests = (token) =>
  apiFetch('/api/contests', { token }).then((payload) => payload?.data || []);

export const getContest = (id, token) =>
  apiFetch(`/api/contests/${id}`, { token }).then((payload) => payload?.data || null);

export const joinContest = (id, token) =>
  apiFetch(`/api/contests/${id}/join`, {
    method: 'POST',
    token,
  }).then((payload) => payload?.data || null);

export const submitContest = (id, token, answers) =>
  apiFetch(`/api/contests/${id}/submit`, {
    method: 'POST',
    token,
    body: { answers },
  }).then((payload) => payload?.data || null);

export const getLeaderboard = (id, token) =>
  apiFetch(`/api/contests/${id}/leaderboard`, {
    token,
  }).then((payload) => payload?.data || []);

export const getHistory = (token) =>
  apiFetch('/api/me/contests/history', { token }).then((payload) => payload?.data || []);

export const getInProgress = (token) =>
  apiFetch('/api/me/contests/in-progress', { token }).then(
    (payload) => payload?.data || []
  );

export const getPrizes = (token) =>
  apiFetch('/api/me/prizes', { token }).then((payload) => payload?.data || []);
