import { ISearchTypes } from '../pages/DocumentView/FragmentList/SearchView';
import { API_BASE } from '../utils/constants';
import { baseHeaders } from '../utils/request';

const Document = {
  get: async (id: string | number) => {
    return fetch(`${API_BASE}/v1/document/${id}`, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res?.document || null)
      .catch((e) => {
        console.error(e);
        return null;
      });
  },
  metadatas: async (id: string, vectorIds: string[]) => {
    return fetch(`${API_BASE}/v1/document/${id}/metadatas`, {
      method: 'POST',
      cache: 'no-cache',
      body: JSON.stringify({ vectorIds }),
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((e) => {
        console.error(e);
        return null;
      });
  },
  fragments: async (id: string, page: number = 1, pageSize: number = 10) => {
    return fetch(
      `${API_BASE}/v1/document/${id}/fragments?page=${page}&pageSize=${pageSize}`,
      {
        method: 'GET',
        cache: 'no-cache',
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .then((res) => {
        return {
          fragments: res?.fragments || [],
          totalFragments: res?.totalFragments || 0,
        };
      })
      .catch((e) => {
        console.error(e);
        return {
          fragments: [],
          totalFragments: 0,
        };
      });
  },
  deleteFragment: async (id: string | number) => {
    return fetch(`${API_BASE}/v1/document/${id}/fragment`, {
      method: 'DELETE',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },
  updateFragment: async (id: string | number, newText: string) => {
    return fetch(`${API_BASE}/v1/document/${id}/fragment`, {
      method: 'POST',
      cache: 'no-cache',
      body: JSON.stringify({ newText }),
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },
  delete: async (id: string | number) => {
    return fetch(`${API_BASE}/v1/document/${id}`, {
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
  clone: async (id: string | number, toWorkspaceId: null | string | number) => {
    return fetch(`${API_BASE}/v1/document/${id}/clone`, {
      method: 'POST',
      cache: 'no-cache',
      body: JSON.stringify({ toWorkspaceId }),
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },
  searchEmbeddings: async (
    documentId: number,
    method: ISearchTypes,
    query: string
  ): Promise<{ documents: object[] }> => {
    const searchEndpoint = new URL(
      `${API_BASE}/v1/documents/${documentId}/search-embeddings`
    );
    searchEndpoint.searchParams.append('method', method);
    searchEndpoint.searchParams.append('q', encodeURIComponent(query));
    return await fetch(searchEndpoint, {
      method: 'GET',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res?.fragments || [])
      .catch((e) => {
        console.error(e.message);
        return [];
      });
  },
};

export default Document;
