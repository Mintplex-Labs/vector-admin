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
};

export default Tools;
