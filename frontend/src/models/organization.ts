import { API_BASE } from '../utils/constants';
import { baseHeaders } from '../utils/request';

const Organization = {
  documentPageSize: 10,
  workspacePageSize: 10,
  create: async (orgName: string) => {
    let error;
    const organization = await fetch(`${API_BASE}/v1/org/create`, {
      method: 'POST',
      cache: 'no-cache',
      headers: baseHeaders(),
      body: JSON.stringify({ orgName }),
    })
      .then((res) => res.json())
      .then((res) => {
        error = res?.error || '[001] Failed to create organization.';
        return res.organization;
      })
      .catch((e) => {
        console.error(e);
        error = '[002] Failed to create organization.';
        return null;
      });

    if (!organization) return { organization: null, error };
    return { organization, error: null };
  },
  bySlug: async (slug: string) => {
    const organization = await fetch(`${API_BASE}/v1/org/${slug}`, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res?.organization)
      .catch((e) => {
        console.error(e);
        return null;
      });

    return { organization };
  },
  all: async () => {
    return await fetch(`${API_BASE}/v1/orgs/all`, {
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
  },
  stats: async (slug: string, metric: string) => {
    return fetch(`${API_BASE}/v1/org/${slug}/statistics/${metric}`, {
      method: 'GET',
      headers: baseHeaders(),
    }).then((res) => res.json());
  },
  documents: async (slug: string) => {
    return fetch(`${API_BASE}/v1/org/${slug}/documents`, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res?.documents || [])
      .catch((e) => {
        console.error(e);
        return [];
      });
  },
  workspaces: async (slug: string, page: number, pageSize?: number) => {
    return fetch(`${API_BASE}/v1/org/${slug}/workspaces?page=${page}&pageSize=${pageSize || Organization.workspacePageSize}`, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res?.workspaces || [])
      .catch((e) => {
        console.error(e);
        return [];
      });
  },
  apiKey: async (slug: string) => {
    return fetch(`${API_BASE}/v1/org/${slug}/api-key`, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res?.apiKey || null)
      .catch((e) => {
        console.error(e);
        return null;
      });
  },
  connector: async (slug: string) => {
    return fetch(`${API_BASE}/v1/org/${slug}/connection`, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res?.connector || null)
      .catch((e) => {
        console.error(e);
        return null;
      });
  },
  addConnector: async (
    slug: string,
    config = {}
  ): Promise<{ connector: any; error: null | string }> => {
    return fetch(`${API_BASE}/v1/org/${slug}/add-connection`, {
      method: 'POST',
      cache: 'no-cache',
      body: JSON.stringify({ config }),
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((e) => {
        console.error(e);
        return { connector: null, error: e.message };
      });
  },
  updateConnector: async (
    slug: string,
    config = {}
  ): Promise<{ connector: any; error: null | string }> => {
    return fetch(`${API_BASE}/v1/org/${slug}/update-connection`, {
      method: 'POST',
      cache: 'no-cache',
      body: JSON.stringify({ config }),
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((e) => {
        console.error(e);
        return { connector: null, error: e.message };
      });
  },
  syncConnector: async (
    slug: string,
    connectorId: number
  ): Promise<{ job: any; error: null | string }> => {
    return fetch(`${API_BASE}/v1/org/${slug}/connector/${connectorId}/sync`, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((e) => {
        console.error(e);
        return { job: null, error: e.message };
      });
  },
  connectorCommand: async (
    slug: string,
    command: string,
    params: object = {}
  ): Promise<any> => {
    return fetch(`${API_BASE}/v1/org/${slug}/connector/${command}`, {
      method: 'POST',
      cache: 'no-cache',
      body: JSON.stringify(params),
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((e) => {
        console.error(e);
        return { result: null, error: e.message };
      });
  },
  jobs: async (slug: string) => {
    return fetch(`${API_BASE}/v1/org/${slug}/jobs`, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res.jobs || [])
      .catch((e) => {
        console.error(e);
        return [];
      });
  },
};

export default Organization;
