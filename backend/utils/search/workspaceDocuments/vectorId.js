const { DocumentVectors } = require("../../../models/documentVectors");
const { WorkspaceDocument } = require("../../../models/workspaceDocument");

async function vectorIdSearch(_workspace, query) {
  const documentVector = await DocumentVectors.get(`vectorId = '${query}'`);
  if (!documentVector)
    return { documents: [], error: "No document vector found with that id." };

  const document = await WorkspaceDocument.get(
    `id = ${documentVector.document_id}`
  );
  if (!document)
    return { documents: [], error: "No document found with that vector id." };

  return { documents: [document], error: null };
}

module.exports = {
  vectorIdSearch,
};
