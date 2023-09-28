const { fuzzyMatch } = require("..");
const { WorkspaceDocument } = require("../../../models/workspaceDocument");
const { readJSON } = require("../../storage");

async function findKeyValueInDoc(wsDoc, query) {
  try {
    const data = await readJSON(WorkspaceDocument.vectorFilepath(wsDoc));
    const [keyToFind, valueToFind] = query.split(":");

    for (const chunk of data) {
      if (!chunk.hasOwnProperty("metadata")) continue;
      for (const [key, value] of Object.entries(chunk?.metadata)) {
        const validKey = fuzzyMatch(keyToFind, key);
        if (!validKey) continue;
        const match = fuzzyMatch(valueToFind, String(value));
        if (match) return wsDoc;
      }
    }

    return false;
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function metadataSearch(workspace, query) {
  const workspaceDocs = await WorkspaceDocument.where({
    workspace_id: Number(workspace.id),
  });
  const promises = [];

  for (const wsDoc of workspaceDocs) {
    promises.push(
      new Promise(async (resolve) => {
        resolve(await findKeyValueInDoc(wsDoc, query));
      })
    );
  }

  const matches = (await Promise.all(promises)).filter((res) => res !== false);
  return { documents: matches, error: null };
}

module.exports = {
  metadataSearch,
};
