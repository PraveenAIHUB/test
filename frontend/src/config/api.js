/**
 * API base URL for backend.
 * Empty string = same origin (use when frontend is served from backend or via proxy).
 * Set VITE_API_BASE_URL in .env for dev (e.g. http://localhost:3000) if not using Vite proxy.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const API_URL = API_BASE ? `${API_BASE}/api` : '/api';
