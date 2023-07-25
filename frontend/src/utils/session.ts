import { API_BASE } from './constants';
import { baseHeaders } from './request';

// Checks current localstorage and validates the session based on that.
export default async function validateSessionTokenForUser() {
  const isValidSession = await fetch(`${API_BASE}/v1/valid-session-token`, {
    method: 'GET',
    cache: 'default',
    headers: baseHeaders(),
  })
    .then((res) => res.status === 200)
    .catch(() => false);

  return isValidSession;
}
