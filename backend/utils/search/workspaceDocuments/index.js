// export type ISearchTypes = 'semantic' | 'exactText' | 'metadata' | 'vectorId';
const { exactTextSearch } = require("./exactText");

const SEARCH_METHODS = {
  semantic: () => {
    return { documents: [], error: "unsupported" };
  },
  exactText: exactTextSearch,
  metadata: () => {
    return { documents: [], error: "unsupported" };
  },
  vectorId: () => {
    return { documents: [], error: "unsupported" };
  },
};

function validSearchMethod(method) {
  return Object.keys(SEARCH_METHODS).includes(method);
}

async function workspaceDocumentSearch(workspace, method, query) {
  try {
    if (!validSearchMethod(method))
      throw new Error(`Invalid search method ${method}`);
    return await SEARCH_METHODS[method](workspace, query);
  } catch (e) {
    console.error("Workspace document search", e.message);
    return { documents: [], error: e.message };
  }
}

module.exports = {
  workspaceDocumentSearch,
};
