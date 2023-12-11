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

export const SEARCH_MODES = {
  exactText: {
    display: 'Fuzzy Text Search',
    placeholder: 'Find embedding via a fuzzy text match on your query.',
  },
  semantic: {
    display: 'Semantic Search',
    placeholder:
      'Search with natural language finding the most similar embedding by meaning. Use of this search will cost OpenAI credits to embed the query.',
  },
  metadata: {
    display: 'Metadata',
    placeholder:
      'Find embedding by exact key:value pair. Formatted as key:value_to_look_for',
  },
  vectorId: {
    display: 'Vector Id',
    placeholder: 'Find by a specific vector ID',
  },
};
