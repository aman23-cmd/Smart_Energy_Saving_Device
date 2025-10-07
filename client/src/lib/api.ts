const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({ message: res.statusText }))).message)
  return res.json()
}
