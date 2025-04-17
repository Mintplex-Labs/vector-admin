const { Configuration, OpenAIApi } = require("openai");

class OpenAi {
  constructor(apiKey = "") {
    const basePath = process.env.OPENAI_BASE_PATH || "https://api.openai.com/v1";
    const modelName = process.env.OPENAI_MODEL_NAME || "text-embedding-ada-002";
    const config = new Configuration({
      apiKey,
      basePath,
    });
    const openai = new OpenAIApi(config);
    this.openai = openai;
    this.modelName = modelName;
  }

  async embedTextChunk(textChunk = "") {
    const {
      data: { data },
    } = await this.openai.createEmbedding({
      model: this.modelName,
      input: textChunk,
    });
    return data.length > 0 && data[0].hasOwnProperty("embedding")
      ? data[0].embedding
      : null;
  }

  async embedTextChunks(chunks = []) {
    const {
      data: { data },
    } = await this.openai.createEmbedding({
      model: this.modelName,
      input: chunks,
    });
    return data.length > 0 &&
      data.every((embd) => embd.hasOwnProperty("embedding"))
      ? data.map((embd) => embd.embedding)
      : null;
  }
}

module.exports = {
  OpenAi,
};
