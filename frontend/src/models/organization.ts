import { INotification } from '@/components/Notifications';
import { API_BASE } from '@/utils/constants';
import { baseHeaders, getAPIUrlString } from '@/utils/request';

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
  update: async (slug: string, updates: object = {}) => {
    return await fetch(`${API_BASE}/v1/org/${slug}`, {
      method: 'POST',
      cache: 'no-cache',
      body: JSON.stringify({ updates }),
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
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
  documents: async (slug: string, page: number = 1, pageSize?: number) => {
    return fetch(
      `${API_BASE}/v1/org/${slug}/documents?page=${page}&pageSize=${
        pageSize || Organization.documentPageSize
      }`,
      {
        method: 'GET',
        cache: 'no-cache',
        headers: baseHeaders(),
      }
    )
      .then((res) => {
        return res.json();
      })
      .catch((e) => {
        console.error(e);
        return { documents: [], totalDocuments: 0 };
      });
  },
  workspaces: async (
    slug: string,
    page: number,
    pageSize?: number,
    includeSlugs?: string[]
  ) => {
    const queryURL = new URL(`${getAPIUrlString()}/v1/org/${slug}/workspaces`);
    queryURL.searchParams.append('page', page || 1);
    queryURL.searchParams.append(
      'page',
      pageSize || Organization.workspacePageSize
    );
    if (!!includeSlugs)
      queryURL.searchParams.append('includeSlugs', includeSlugs.join(','));

    return fetch(queryURL, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { workspaces: [], totalWorkspaces: 0 };
      });
  },
  searchWorkspaces: async (
    slug: string,
    page: number,
    pageSize?: number,
    searchQuery?: string,
    includeSlugs?: string[]
  ) => {
    const queryURL = new URL(
      `${getAPIUrlString()}/v1/org/${slug}/workspaces/search`
    );
    queryURL.searchParams.append('page', `${page}`);
    queryURL.searchParams.append(
      'pageSize',
      `${pageSize || Organization.workspacePageSize}`
    );
    if (!!includeSlugs)
      queryURL.searchParams.append('includeSlugs', includeSlugs.join(','));
    if (!!searchQuery) queryURL.searchParams.append('searchTerm', searchQuery);

    return fetch(queryURL, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { workspacesResults: [], totalWorkspaces: 0 };
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
  vectorDBExists: async (slug: string, namespace: string | null) => {
    if (!namespace || !namespace?.length) return { match: null };
    return fetch(
      `${API_BASE}/v1/org/${slug}/namespace-search?name=${encodeURIComponent(
        namespace
      )}`,
      {
        method: 'GET',
        cache: 'no-cache',
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { match: null };
      });
  },
  deleteOrg: async (
    slug: string
  ): Promise<{ success: boolean; error: null | string }> => {
    return fetch(`${API_BASE}/v1/org/${slug}`, {
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
  notifications: async (
    slug: string
  ): Promise<{ notifications: INotification[] }> => {
    return fetch(`${API_BASE}/v1/org/${slug}/notifications`, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { notifications: [] };
      });
  },
  markNotificationsSeen: async (slug: string): Promise<boolean> => {
    return fetch(`${API_BASE}/v1/org/${slug}/notifications/mark-seen`, {
      method: 'POST',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.ok)
      .catch((e) => {
        console.error(e);
        return false;
      });
  },
};

export default Organization;
export interface IOrganization {
  id: number;
  name: string;
  slug: string;
  uuid: string;
  createdAt: string;
  lastUpdatedAt: string;
}
