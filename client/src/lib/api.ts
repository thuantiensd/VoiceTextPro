// API utility functions with proper credentials handling
export async function apiRequest(url: string, options: RequestInit = {}) {
  const defaultOptions: RequestInit = {
    credentials: 'include', // Always include cookies for session
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, defaultOptions);
  return response;
}

export async function apiGet(url: string) {
  return apiRequest(url, { method: 'GET' });
}

export async function apiPost(url: string, data?: any) {
  return apiRequest(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiPatch(url: string, data?: any) {
  return apiRequest(url, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiDelete(url: string) {
  return apiRequest(url, { method: 'DELETE' });
} 