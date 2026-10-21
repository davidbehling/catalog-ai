const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export function getToken() { return localStorage.getItem('maria_token'); }

export function saveSession(token: string, user: unknown) {
  localStorage.setItem('maria_token', token);
  localStorage.setItem('maria_user', JSON.stringify(user));
}

export function clearSession() { 
  localStorage.removeItem('maria_token'); 
  localStorage.removeItem('maria_user'); 
}

export function getUser() {
  const raw = localStorage.getItem('maria_user');

  return raw ? JSON.parse(raw) as { 
    id: string; 
    name: string; 
    email: string; 
    role: 'admin' | 'user'; 
    companyId: string; 
    companyName?: string 
  } : null;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, { 
    ...options, 
    headers: { 
      'Content-Type': 'application/json', 
      ...(token ? { Authorization: `Bearer ${token}` } : {}), 
      ...options.headers 
    } 
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Erro HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}
