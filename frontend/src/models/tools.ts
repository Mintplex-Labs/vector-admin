import { API_BASE } from '../utils/constants';
import { baseHeaders } from '../utils/request';
import { IOrganization } from './organization';
import { IWorkspace } from './workspace';

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
  ): Promise<{ ragTests: IRagTest[]; message: null | string }> => {
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
  ragTest: async (
    slug: string,
    testId: string | number
  ): Promise<{
    test: IRagTest;
    runs: IRagTestRun[];
    message: null | string;
  }> => {
    return fetch(`${API_BASE}/v1/tools/org/${slug}/rag-tests/${testId}`, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { test: [], runs: [], message: e.message };
      });
  },
  newRAGTest: async (
    slug: string,
    settings: object
  ): Promise<{ test: IRagTest | null; error: null | string }> => {
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
  runRagTest: async (
    test: IRagTest
  ): Promise<{ job: object | null; error: null | string }> => {
    return fetch(
      `${API_BASE}/v1/tools/org/${test.organization.slug}/rag-tests/${test.id}/run`,
      {
        method: 'POST',
        cache: 'no-cache',
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { job: null, error: e.message };
      });
  },
  deleteRagTest: async (test: IRagTest): Promise<boolean> => {
    return fetch(
      `${API_BASE}/v1/tools/org/${test.organization.slug}/rag-tests/${test.id}`,
      {
        method: 'DELETE',
        cache: 'no-cache',
        headers: baseHeaders(),
      }
    )
      .then((res) => res.ok)
      .catch((e) => {
        console.error(e);
        return false;
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

export interface IRagEmbedding {
  vectorId: string;
  metadata: object;
  score: number;
}
export interface IRagTestRun {
  id: number;
  status: 'running' | 'failed' | 'complete' | 'alert';
  result: object;
  createdAt: string;
}
export interface IRagTest {
  id: number;
  promptText?: string;
  promptVector: number[];
  comparisons: IRagEmbedding[];
  frequencyType: 'demand' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  topK: number;
  lastRun?: string;
  workspace: IWorkspace;
  organization: IOrganization;
  organization_rag_test_runs: IRagTestRun[];
  createdAt: string;
}
