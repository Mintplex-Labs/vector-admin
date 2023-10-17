const { Organization } = require("../../models/organization");
const {
  OrganizationConnection,
} = require("../../models/organizationConnection");
const { OrganizationWorkspace } = require("../../models/organizationWorkspace");
const { reqBody } = require("../http");
const { selectConnector } = require("../vectordatabases/providers");
const { promptToVector } = require("./utils");

async function workspaceSimilaritySearch(user, request, response) {
  const { orgSlug } = request.params;
  const { workspaceId, input, inputType = "text", topK = 3 } = reqBody(request);

  const organization = await Organization.getWithOwner(user.id, {
    slug: orgSlug,
  });
  if (!organization) {
    response.status(200).json({ results: [], error: "No org found." });
    return;
  }

  const workspace = await OrganizationWorkspace.get({
    id: workspaceId,
    organization_id: organization.id,
  });
  if (!workspace) {
    response.status(200).json({ results: [], error: "No workspace found." });
    return;
  }

  const connector = await OrganizationConnection.get({
    organization_id: Number(organization.id),
  });
  if (!connector) {
    response.status(200).json({
      results: [],
      error: "No vector database is connected to this organization.",
    });
    return;
  }

  const { queryVector, error } = await promptToVector(input, inputType);
  if (error) {
    response.status(200).json({
      results: [],
      error,
    });
    return;
  }

  if (!queryVector || queryVector?.length === 0) {
    response.status(200).json({
      results: [],
      error: "Failed to embed or parse input data.",
    });
    return;
  }

  const vectorDb = selectConnector(connector);
  const searchResults = await vectorDb.similarityResponse(
    workspace.fname,
    queryVector,
    topK
  );
  const results = searchResults.vectorIds.map((_, i) => {
    return {
      vectorId: searchResults.vectorIds[i],
      text: searchResults.contextTexts[i],
      metadata: searchResults.sourceDocuments[i],
      score: searchResults.scores[i],
    };
  });

  response.status(200).json({ results, error: null });
}

module.exports = {
  workspaceSimilaritySearch,
};
