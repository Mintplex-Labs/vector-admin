// Sets up the base headers for all authenticated requests so that we are able to prevent

import { API_BASE, STORE_TOKEN, STORE_USER } from './constants';

// basic spoofing since a valid token is required and that cannot be spoofed
export function baseHeaders(
  providedEmail = null,
  providedToken = null
): HeadersInit {
  const email =
    providedEmail || JSON.parse(window.localStorage.getItem(STORE_USER)).email;
  const token = providedToken || window.localStorage.getItem(STORE_TOKEN);

  return {
    Authorization: token ? `Bearer ${token}` : null,
    'requester-email': email,
  };
}

// When in production or on docker we may use just /api
// as the API URL - which will not build a proper URL object
// because that requires a protocol, host, and optional path
export function getAPIUrlString() {
  try {
    return new URL(API_BASE).toString();
  } catch {}
  try {
    return new URL(`${window.location.origin}${API_BASE}`).toString();
  } catch {}
  try {
    return new URL(window.location.origin).toString();
  } catch {}
  return API_BASE || window.location.origin;
}

export function sleep(milliseconds = 1500) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
