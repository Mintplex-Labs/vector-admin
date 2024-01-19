import { API_BASE } from '@/utils/constants';
import { baseHeaders } from '@/utils/request';

const System = {
  hasSetting: async (
    label: string
  ): Promise<{ label: string; exists: boolean }> => {
    return fetch(`${API_BASE}/system/setting/${label}/exists`, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((e) => {
        console.error(e);
        return { label, exists: false, error: e.message };
      });
  },
  getSetting: async (label: string): Promise<{ label: string; value: any }> => {
    return fetch(`${API_BASE}/system/setting/${label}`, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((e) => {
        console.error(e);
        return { label, value: null, error: e.message };
      });
  },
  updateSettings: async (
    config = {}
  ): Promise<{ success: boolean; error: null | string }> => {
    return fetch(`${API_BASE}/system/update-settings`, {
      method: 'POST',
      cache: 'no-cache',
      body: JSON.stringify({ config }),
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },
  documentProcessorOnline: async () => {
    return fetch(`${API_BASE}/v1/document-processor/status`, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.ok)
      .then((res) => res)
      .catch((e) => {
        console.error(e);
        return false;
      });
  },
  acceptedDocumentTypes: async () => {
    return fetch(`${API_BASE}/v1/document-processor/filetypes`, {
      method: 'GET',
      cache: 'no-cache',
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res?.types)
      .catch((e) => {
        console.error(e);
        return null;
      });
  },
};

export default System;
