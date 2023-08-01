import { API_BASE } from '../utils/constants';
import { baseHeaders } from '../utils/request';

const Workspace = {
  documentPageSize: 10,
  createNew: async (orgSlug: string, workspaceName: string) => {
    let error;
    const workspace = await fetch(
      `${API_BASE}/v1/org/${orgSlug}/new-workspace`,
      {
        method: 'POST',
        cache: 'no-cache',
        headers: baseHeaders(),
        body: JSON.stringify({ workspaceName }),
      }
    )
      .then((res) => res.json())
      .then((res) => {
        error = res?.error || '[001] Failed to create workspace.';
        return res.workspace;
      })
      .catch((e) => {
        console.error(e);
        error = '[002] Failed to create workspace.';
        return null;
      });

    if (!workspace) return { organization: null, error };
    return { workspace, error: null };
  },
  createAndImport: async (orgSlug: string, workspaceName: string) => {
    let error;
    const workspace = await fetch(
      `${API_BASE}/v1/org/${orgSlug}/import-workspace`,
      {
        method: 'POST',
        cache: 'no-cache',
        headers: baseHeaders(),
        body: JSON.stringify({ workspaceName }),
      }
    )
      .then((res) => res.json())
      .then((res) => {
        error = res?.error || '[001] Failed to import workspace.';
        return res.workspace;
      })
      .catch((e) => {
        console.error(e);
        error = '[002] Failed to import workspace.';
        return null;
      });

    if (!workspace) return { organization: null, error };
    return { workspace, error: null };
  },
  bySlug: async (slug: string, workspaceSlug: string) => {
    const workspace = await fetch(
      `${API_BASE}/v1/org/${slug}/workspace/${workspaceSlug}`,
      {
        method: 'GET',
        cache: 'no-cache',
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .then((res) => res?.workspace)
      .catch((e) => {
        console.error(e);
        return null;
      });

    return workspace;
  },
  stats: async (orgSlug: string, slug: string, metric: string) => {
    return fetch(
      `${API_BASE}/v1/org/${orgSlug}/workspace/${slug}/statistics/${metric}`,
      {
        method: 'GET',
        headers: baseHeaders(),
      }
    ).then((res) => res.json());
  },
  documents: async (
    orgSlug: string,
    workspaceSlug: string,
    page: number = 1,
    pageSize?: number
  ) => {
    return fetch(
      `${API_BASE}/v1/org/${orgSlug}/workspace/${workspaceSlug}/documents?page=${page}&pageSize=${
        pageSize || Workspace.documentPageSize
      }`,
      {
        method: 'GET',
        cache: 'no-cache',
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { documents: [], totalDocuments: 0 };
      });
  },
  delete: async (orgSlug: string, workspaceSlug: string) => {
    return fetch(`${API_BASE}/v1/org/${orgSlug}/workspace/${workspaceSlug}`, {
      method: 'DELETE',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.ok)
      .catch((e) => {
        console.error(e);
        return false;
      });
  },
  uploadFile: async function (
    orgSlug: string,
    workspaceSlug: string,
    formData: FormData
  ) {
    const response = await fetch(
      `${API_BASE}/v1/org/${orgSlug}/workspace/${workspaceSlug}/upload`,
      {
        method: 'POST',
        body: formData,
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .then((res) => res)
      .catch((e) => {
        console.error(e.message);
        return { success: false, error: e.message };
      });
    return response;
  },
  syncConnector: async (
    orgSlug: string,
    workspaceSlug: string,
    connectorId: number
  ): Promise<{ job: any; error: null | string }> => {
    return fetch(
      `${API_BASE}/v1/org/${orgSlug}/connector/${connectorId}/sync/${workspaceSlug}`,
      {
        method: 'GET',
        cache: 'no-cache',
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .then((res) => res)
      .catch((e) => {
        console.error(e);
        return { job: null, error: e.message };
      });
  },
  clone: async (
    orgSlug: string,
    workspaceSlug: string,
    newWorkspaceName: string | null = null
  ): Promise<{ success: boolean; error: null | string }> => {
    return await fetch(
      `${API_BASE}/v1/org/${orgSlug}/workspace/${workspaceSlug}/clone`,
      {
        method: 'POST',
        body: JSON.stringify({ newWorkspaceName }),
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .then((res) => res)
      .catch((e) => {
        console.error(e.message);
        return { success: false, error: e.message };
      });
  },
};

export default Workspace;
