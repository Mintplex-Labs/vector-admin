export const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://127.0.0.1:3001/api';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'VDMS';
export const STORE_USER = 'vdms_user';
export const STORE_TOKEN = 'vdms_authToken';
export const SUPPORTED_VECTOR_DBS = [
  'pinecone',
  'chroma',
  'qdrant',
  'weaviate',
];
