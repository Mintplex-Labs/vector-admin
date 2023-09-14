const { DocumentVectors } = require("../../../models/documentVectors");
const { WorkspaceDocument } = require("../../../models/workspaceDocument");
const { readJSON } = require("../../storage");

// Dirty, but works fast for most cases. Wont be perfect but also not something we should rely
// heavily on for exact text searching.
function fuzzyMatch(pattern, str) {
  pattern = ".*" + pattern.split("").join(".*") + ".*";
  const re = new RegExp(pattern);
  return re.test(str);
}

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

  const queryString = matchingVectorIds.map((vid) => `'${vid}'`).join(",");
  const fragments = await DocumentVectors.where(`vectorId IN (${queryString})`);
  return { fragments, error: null };
}

module.exports = {
  exactTextSearch,
};
