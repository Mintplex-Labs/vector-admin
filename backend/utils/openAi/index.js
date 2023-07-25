const { Configuration, OpenAIApi } = require("openai");
class OpenAi {
  constructor(apiKey = "") {
    const config = new Configuration({ apiKey });
    const openai = new OpenAIApi(config);
    this.openai = openai;
  }

  async embedTextChunk(textChunk = "") {
    const {
      data: { data },
    } = await this.openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: textChunk,
    });
    return data.length > 0 && data[0].hasOwnProperty("embedding")
      ? data[0].embedding
      : null;
  }
}

module.exports = {
  OpenAi,
};
