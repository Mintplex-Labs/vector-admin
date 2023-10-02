import { Tiktoken } from "@dqbd/tiktoken/lite";
import cl100k_base from "@dqbd/tiktoken/encoders/cl100k_base.json";

type IValidEmbeddingModels = 'cl100k_base';
export const MAX_TOKENS = {
  cl100k_base: 8192, // https://platform.openai.com/docs/guides/embeddings/second-generation-models
};

export function countLLMTokens(input: string) {
  const encoding = new Tiktoken(
    cl100k_base.bpe_ranks,
    cl100k_base.special_tokens,
    cl100k_base.pat_str
  );
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
