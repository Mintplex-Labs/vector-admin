// Sets up the base headers for all authenticated requests so that we are able to prevent

import { STORE_TOKEN, STORE_USER } from './constants';

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

export function sleep(milliseconds = 1500) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
