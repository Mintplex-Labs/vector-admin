const { Telemetry } = require("../../../models/telemetry");
const { exactTextSearch } = require("./exactText");
const { metadataSearch } = require("./metadata");
const { semanticSearch } = require("./semantic");
const { vectorIdSearch } = require("./vectorId");

const SEARCH_METHODS = {
  semantic: semanticSearch,
  exactText: exactTextSearch,
  metadata: metadataSearch,
  vectorId: vectorIdSearch,
};

function validSearchMethod(method) {
  return Object.keys(SEARCH_METHODS).includes(method);
}

async function workspaceDocumentSearch(workspace, method, query) {
  try {
    if (!validSearchMethod(method))
      throw new Error(`Invalid search method ${method}`);
    await Telemetry.sendTelemetry("search_executed", { searchMethod: method });
    return await SEARCH_METHODS[method](workspace, decodeURIComponent(query));
  } catch (e) {
    console.error("Workspace document search", e.message);
    return { documents: [], error: e.message };
  }
}

module.exports = {
  workspaceDocumentSearch,
};
