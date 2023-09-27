const { DocumentVectors } = require("../../../models/documentVectors");
const {
  OrganizationConnection,
} = require("../../../models/organizationConnection");
const { SystemSettings } = require("../../../models/systemSettings");
const { WorkspaceDocument } = require("../../../models/workspaceDocument");
const { OpenAi } = require("../../openAi");
const { selectConnector } = require("../../vectordatabases/providers");

async function semanticSearch(workspace, query) {
  const connector = await OrganizationConnection.get({
    organization_id: Number(workspace.organization_id),
  });
  if (!connector)
    return { documents: [], error: "No connector found for org." };

  const openAiKey = (await SystemSettings.get({ label: "open_ai_api_key" }))
    ?.value;
  if (!openAiKey)
    return { documents: [], error: "No OpenAI key available to embed query." };

  const vectorDb = selectConnector(connector);
  const openai = new OpenAi(openAiKey);

  const queryVector = await openai.embedTextChunk(query);
  if (!queryVector) return { documents: [], error: "Failed to embed query." };

  // Execute Similarity search for vector DB provider so we can find inferred documents.
  const searchResults = await vectorDb.similarityResponse(
    workspace.slug,
    queryVector
  );

  // From similarity search we can find all document vector DB items to infer their associated
  // document record.
  const searchString = searchResults.vectorIds
    .map((vid) => `'${vid}'`)
    .join(",");
  const matchingDocumentVectors = await DocumentVectors.where(
    `vectorId IN (${searchString})`
  );
  const docDbIds = new Set();
  matchingDocumentVectors.forEach((record) => docDbIds.add(record.document_id));

  // Do a bulk query for all unique document ids we were able to find in previous step.
  const docDbIdString = Array.from(docDbIds)
    .map((id) => id)
    .join(",");
  const documents = await WorkspaceDocument.where(`id IN (${docDbIdString})`);

  return { documents, error: null };
}

module.exports = {
  semanticSearch,
};
