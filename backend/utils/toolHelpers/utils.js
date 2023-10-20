const { SystemSettings } = require("../../models/systemSettings");
const { OpenAi } = require("../openAi");

async function promptToVector(input, type = "text") {
  if (input.length === 0)
    return { queryVector: null, error: "No input data to embed." };
  if (type === "vector")
    return {
      queryVector: typeof input === "string" ? JSON.parse(input) : input,
      error: null,
    };

  const openAiKey = (await SystemSettings.get({ label: "open_ai_api_key" }))
    ?.value;

  if (!openAiKey)
    return {
      queryVector: null,
      error: "No embedding API key set - cannot embed text data.",
    };

  const openai = new OpenAi(openAiKey);
  const queryVector = await openai.embedTextChunk(input);
  return { queryVector, error: null };
}

module.exports = {
  promptToVector,
};
