export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.arda.nargothrond.xyz'
  : 'http://localhost:8080';

export const ENDPOINTS = {
  users: `${API_BASE_URL}/users`,
  albums: `${API_BASE_URL}/albums`,
} as const;
