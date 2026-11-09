// The waiter: every call from React to the server goes through here.
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  health: () => request('/health'),
  skills: () => request('/skills'),
  chat: (body) => request('/chat', { method: 'POST', body }),
  resources: ({ search = '', category = '' } = {}) =>
    request(`/resources?${new URLSearchParams({ search, category })}`),
  addResource: (body) => request('/resources', { method: 'POST', body }),
};
