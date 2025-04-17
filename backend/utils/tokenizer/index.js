const { getEncoding } = require("js-tiktoken");
const MAX_TOKENS = {
  cl100k_base: 8191, // https://platform.openai.com/docs/guides/embeddings/models
};

function countLLMTokens(input) {
  const encoding = getEncoding("cl100k_base");
  const tokens = encoding.encode(input);
  return { tokens, length: tokens.length };
}

// Check if an input is valid length for embedding - we add a buffer just for edge-case incongruencies in the JS port of TikToken.
function validEmbedding(input = "", buffer = 50, model = "cl100k_base") {
  const { tokens, length } = countLLMTokens(input);
  return { tokens, length, valid: length + buffer <= MAX_TOKENS[model] };
}

module.exports = {
  MAX_TOKENS,
  validEmbedding,
};
