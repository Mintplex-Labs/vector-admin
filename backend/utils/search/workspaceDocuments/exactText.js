const { fuzzyMatch } = require("..");
const { WorkspaceDocument } = require("../../../models/workspaceDocument");
const { readJSON } = require("../../storage");

async function findTextInDoc(wsDoc, query) {
  try {
    const data = await readJSON(WorkspaceDocument.vectorFilepath(wsDoc));

    for (const chunk of data) {
      if (!chunk.hasOwnProperty("metadata")) continue;
      for (const value of Object.values(chunk?.metadata)) {
        const valid = fuzzyMatch(query, String(value));
        if (valid) return wsDoc;
      }
    }

    return false;
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function exactTextSearch(workspace, query) {
  const workspaceDocs = await WorkspaceDocument.where(
    `workspace_id = ${workspace.id}`
  );
  const promises = [];

  for (const wsDoc of workspaceDocs) {
    promises.push(
      new Promise(async (resolve) => {
        resolve(await findTextInDoc(wsDoc, query));
      })
    );
  }

  const matches = (await Promise.all(promises)).filter((res) => res !== false);
  return { documents: matches, error: null };
}

module.exports = {
  exactTextSearch,
};
