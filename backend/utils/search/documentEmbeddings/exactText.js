const { fuzzyMatch } = require("..");
const { DocumentVectors } = require("../../../models/documentVectors");
const { WorkspaceDocument } = require("../../../models/workspaceDocument");
const { readJSON } = require("../../storage");

async function findTextInDoc(wsDoc, query) {
  try {
    const fragmentIds = [];
    const data = await readJSON(WorkspaceDocument.vectorFilepath(wsDoc));

    for (const chunk of data) {
      if (!chunk.hasOwnProperty("metadata")) continue;
      for (const value of Object.values(chunk?.metadata)) {
        const valid = fuzzyMatch(query, String(value));
        if (valid) fragmentIds.push(chunk.vectorDbId);
      }
    }

    return fragmentIds;
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function exactTextSearch(document, query) {
  const matchingVectorIds = await findTextInDoc(document, query);
  if (matchingVectorIds.length === 0) return { fragments: [], error: null };

  const queryString = matchingVectorIds.map((vid) => vid);
  const fragments = await DocumentVectors.where(
    { vectorId: { in: queryString } },
    100
  );
  return { fragments, error: null };
}

module.exports = {
  exactTextSearch,
};
