const { Organization } = require("../../../models/organization");
const {
  OrganizationWorkspace,
} = require("../../../models/organizationWorkspace");
const { RagTest } = require("../../../models/ragTest");
const { reqBody } = require("../../http");
const { promptToVector } = require("../utils");

async function createRagTest(user, request, response) {
  const { orgSlug } = request.params;
  const {
    settings: {
      frequency,
      workspaceId,
      topK,
      prompt,
      promptType = "text",
      embeddings,
    },
  } = reqBody(request);

  const organization = await Organization.getWithOwner(user.id, {
    slug: orgSlug,
  });
  if (!organization) {
    response.status(200).json({ test: null, error: "No org found." });
    return;
  }

  console.log(workspaceId);
  const workspace = await OrganizationWorkspace.get({
    id: Number(workspaceId),
    organization_id: organization.id,
  });
  if (!workspace) {
    response.status(200).json({ test: null, error: "No workspace found." });
    return;
  }

  const { queryVector, error } = await promptToVector(prompt, promptType);
  if (error) {
    response.status(200).json({
      test: null,
      error,
    });
    return;
  }

  if (!queryVector || queryVector?.length === 0) {
    response.status(200).json({
      test: null,
      error: "Failed to embed or parse input data.",
    });
    return;
  }

  const { test: newRagTest } = await RagTest.create(
    {
      frequencyType: frequency,
      promptText: promptType === "text" ? prompt : null,
      promptVector: queryVector,
      topK: Number(topK),
      comparisons: embeddings,
    },
    organization.id,
    workspace.id
  );
  response.status(200).json({
    test: newRagTest,
    error: null,
  });
  return;
}

module.exports = {
  createRagTest,
};
