const SIGNIN_URL = 'https://zone01normandie.org/api/auth/signin';
const TOKEN_KEY  = 'z01_jwt';

export async function login(identifier, password) {
  const credentials = btoa(`${identifier}:${password}`);
  const res = await fetch(SIGNIN_URL, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `Login failed (${res.status})`);
  }

  const token = await res.json();
  const jwt = typeof token === 'string' ? token : token.token ?? token.jwt ?? JSON.stringify(token);
  localStorage.setItem(TOKEN_KEY, jwt);
  return jwt;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function isTokenExpired() {
  const token = getToken();
  if (!token) return true;
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1]));
    return exp ? Date.now() / 1000 > exp : false;
  } catch {
    return true;
  }
}

export function isLoggedIn() {
  return !!getToken() && !isTokenExpired();
}

export function getUserIdFromToken() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub ?? payload['https://hasura.io/jwt/claims']?.['x-hasura-user-id'] ?? null;
  } catch {
    return null;
  }
}
