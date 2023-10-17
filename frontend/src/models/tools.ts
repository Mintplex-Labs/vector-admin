import { API_BASE } from '../utils/constants';
import { baseHeaders } from '../utils/request';

const Tools = {
  migrateOrg: async (
    slug: string,
    config = {}
  ): Promise<{ success: boolean; message: null | string }> => {
    return fetch(`${API_BASE}/v1/tools/org/${slug}/migrate`, {
      method: 'POST',
      cache: 'no-cache',
      body: JSON.stringify({ ...config }),
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((e) => {
        console.error(e);
        return { success: false, message: e.message };
      });
  },
  resetOrg: async (
    slug: string
  ): Promise<{ success: boolean; message: null | string }> => {
    return fetch(`${API_BASE}/v1/tools/org/${slug}/reset`, {
      method: 'POST',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((e) => {
        console.error(e);
        return { success: false, message: e.message };
      });
  },
  ragTests: async (
    slug: string
  ): Promise<{ ragTests: []; message: null | string }> => {
    return fetch(`${API_BASE}/v1/tools/org/${slug}/rag-tests`, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { ragTests: [], message: e.message };
      });
  },
  newRAGTest: async (
    slug: string,
    settings: object
  ): Promise<{ test: object | null; error: null | string }> => {
    return fetch(`${API_BASE}/v1/tools/org/${slug}/rag-tests/create`, {
      method: 'POST',
      cache: 'no-cache',
      headers: baseHeaders(),
      body: JSON.stringify({ settings }),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { test: null, error: e.message };
      });
  },

  // Generic Uitls
  workspaceSimilaritySearch: async (
    orgSlug: string,
    input: string,
    inputType: 'vector' | 'text' = 'text',
    workspaceId: number,
    topK: number = 3
  ): Promise<{ results: []; error: null | string }> => {
    return fetch(
      `${API_BASE}/v1/tools/org/${orgSlug}/workspace-similarity-search`,
      {
        method: 'POST',
        cache: 'no-cache',
        headers: baseHeaders(),
        body: JSON.stringify({
          topK,
          input,
          inputType,
          workspaceId,
        }),
      }
    )
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { results: [], error: e.message };
      });
  },
};

export default Tools;
