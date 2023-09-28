const { fuzzyMatch } = require("..");
const { DocumentVectors } = require("../../../models/documentVectors");
const { WorkspaceDocument } = require("../../../models/workspaceDocument");
const { readJSON } = require("../../storage");

async function findKeyValueInDoc(wsDoc, query) {
  try {
    const fragmentIds = [];
    const data = await readJSON(WorkspaceDocument.vectorFilepath(wsDoc));
    const [keyToFind, valueToFind] = query.split(":");

    for (const chunk of data) {
      if (!chunk.hasOwnProperty("metadata")) continue;
      for (const [key, value] of Object.entries(chunk?.metadata)) {
        const validKey = fuzzyMatch(keyToFind, key);
        if (!validKey) continue;
        const match = fuzzyMatch(valueToFind, String(value));
        if (match) fragmentIds.push(chunk.vectorDbId);
      }
    }

    return fragmentIds;
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function metadataSearch(document, query) {
  const matchingVectorIds = await findKeyValueInDoc(document, query);
  if (matchingVectorIds.length === 0) return { fragments: [], error: null };

  const queryString = matchingVectorIds.map((vid) => `'${vid}'`).join(",");
  const fragments = await DocumentVectors.where(
    { vectorId: { in: queryString } },
    100
  );
  return { fragments, error: null };
}

module.exports = {
  metadataSearch,
};
