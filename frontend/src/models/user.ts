import { API_BASE } from '../utils/constants';
import { baseHeaders } from '../utils/request';

const User = {
  login: async (email: string, password: string) => {
    let error;
    const { user, valid, token } = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      cache: 'no-cache',
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then((res) => {
        error = res?.message || '[001] Failed to authenticate';
        debugger
        return res;
      })
      .catch((e) => {
        console.error(e);
        error = '[002] Failed to authenticate';
        return { user: null, token: null, valid: false };
      });

    if (!valid) return { user: null, token: null, error };
    debugger
    return { user, token, error: null };
  },
  createAccount: async (email: string, password: string) => {
    let error;
    const { user, valid, token } = await fetch(
      `${API_BASE}/auth/create-account`,
      {
        method: 'POST',
        cache: 'no-cache',
        body: JSON.stringify({ email, password }),
      }
    )
      .then((res) => res.json())
      .then((res) => {
        error = res?.message || '[001] Failed to create account';
        return res;
      })
      .catch((e) => {
        console.error(e);
        error = '[002] Failed to create account';
        return { user: null, token: null, valid: false };
      });

    if (!valid) return { user: null, token: null, error };
    return { user, token, error: null };
  },
  transferRootOwnership: async (email: string, password: string) => {
    let error;
    const { user, valid, token } = await fetch(
      `${API_BASE}/auth/transfer-root`,
      {
        method: 'POST',
        cache: 'no-cache',
        body: JSON.stringify({ email, password }),
      }
    )
      .then((res) => res.json())
      .then((res) => {
        error = res?.message || '[001] Failed to create account';
        return res;
      })
      .catch((e) => {
        console.error(e);
        error = '[002] Failed to create account';
        return { user: null, token: null, valid: false };
      });

    if (!valid) return { user: null, token: null, error };
    return { user, token, error: null };
  },
  organizations: async () => {
    const organizations = await fetch(`${API_BASE}/v1/orgs`, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res?.organizations || [])
      .catch((e) => {
        console.error(e);
        return [];
      });

    return organizations;
  },
  all: async () => {
    const users = await fetch(`${API_BASE}/v1/users`, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res?.users || [])
      .catch((e) => {
        console.error(e);
        return [];
      });

    return users;
  },
  delete: async (userId: string | number) => {
    return await fetch(`${API_BASE}/v1/users/${userId}`, {
      method: 'DELETE',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },
  create: async (formData: object) => {
    return await fetch(`${API_BASE}/v1/user/new`, {
      method: 'POST',
      cache: 'no-cache',
      body: JSON.stringify(formData),
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },
  update: async (userId: string | number, formData: object) => {
    return await fetch(`${API_BASE}/v1/users/${userId}`, {
      method: 'POST',
      cache: 'no-cache',
      body: JSON.stringify(formData),
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },
};

export default User;
