import { API_BASE } from '../utils/constants';
import { baseHeaders } from '../utils/request';

const Jobs = {
  kill: async (jobId: number) => {
    return fetch(`${API_BASE}/v1/jobs/${jobId}`, {
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
  retryJob: async (jobId: number) => {
    return fetch(`${API_BASE}/v1/jobs/${jobId}/retry`, {
      method: 'POST',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { job: null, error: e.message };
      });
  },
};

export default Jobs;
