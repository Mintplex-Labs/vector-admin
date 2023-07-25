import { getEncoding } from 'js-tiktoken';

type IValidEmbeddingModels = 'cl100k_base';
export const MAX_TOKENS = {
  cl100k_base: 8192, // https://platform.openai.com/docs/guides/embeddings/second-generation-models
};

export function countLLMTokens(input: string) {
  const encoding = getEncoding('cl100k_base');
  const tokens = encoding.encode(input);
  return { tokens, length: tokens.length };
}

// Check if an input is valid length for embedding - we add a buffer just for edge-case incongruencies in the JS port of TikToken.
export function validEmbedding(
  input: string,
  buffer: number = 50,
  model: IValidEmbeddingModels = 'cl100k_base'
) {
  const { tokens, length } = countLLMTokens(input);
  return { tokens, length, valid: length + buffer <= MAX_TOKENS[model] };
}
