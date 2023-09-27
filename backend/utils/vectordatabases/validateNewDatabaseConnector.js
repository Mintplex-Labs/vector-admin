const {
  OrganizationConnection,
} = require("../../models/organizationConnection");
const { Pinecone } = require("./providers/pinecone");

async function validateNewDatabaseConnector(organization, config) {
  const { type, settings } = config;
  if (!OrganizationConnection.supportedConnectors.includes(type))
    return { connector: null, error: "Unsupported vector database type." };

  var statusCheck = { valid: false, message: null };
  if (type === "chroma") {
    const { valid, message } = await validateChroma(settings);
    statusCheck = { valid, message };
  } else if (type === "pinecone") {
    const { valid, message } = await validatePinecone(settings);
    statusCheck = { valid, message };
  } else if (type === "qdrant") {
    const { valid, message } = await validateQDrant(settings);
    statusCheck = { valid, message };
  } else if (type === "weaviate") {
    const { valid, message } = await validateWeaviate(settings);
    statusCheck = { valid, message };
  }

  if (!statusCheck.valid)
    return { connector: null, error: statusCheck.message };

  const connector = await OrganizationConnection.create(
    organization.id,
    type,
    settings
  );
  return { connector, error: null };
}

async function validateChroma({
  instanceURL,
  authToken = null,
  authTokenHeader = null,
}) {
  const { ChromaClient } = require("chromadb");
  const options = { path: instanceURL };

  if (!!authToken) {
    if (!authTokenHeader)
      return {
        valid: false,
        message: "Auth token set but no request header set - set a header!",
      };
    options.fetchOptions = {};
    options.fetchOptions.headers = { [authTokenHeader]: authToken };
  }

  try {
    const client = new ChromaClient(options);
    await client.heartbeat(); // Will abort if no connection is possible.
    return { valid: true, message: null };
  } catch (e) {
    return {
      valid: false,
      message:
        e.message ||
        "Could not connect to Chroma instance with those credentials.",
    };
  }
}

async function validatePinecone({ environment, index, apiKey }) {
  const { PineconeClient } = require("@pinecone-database/pinecone");
  try {
    const client = new PineconeClient();
    await client.init({
      apiKey,
      environment,
    });
    const { status } = await client.describeIndex({
      indexName: index,
    });

    if (!status.ready) throw new Error("Pinecone::Index not ready or found.");
    return { valid: true, message: null };
  } catch (e) {
    return { valid: false, message: e.message };
  }
}

async function validateQDrant({ clusterUrl, apiKey }) {
  const { QdrantClient } = require("@qdrant/js-client-rest");
  try {
    const client = new QdrantClient({
      url: clusterUrl,
      ...(apiKey ? { apiKey } : {}),
    });

    const online = (await client.api("cluster")?.clusterStatus())?.ok || false;
    if (!online) throw new Error("qDrant::Cluster not ready or found.");
    return { valid: true, message: null };
  } catch (e) {
    return { valid: false, message: e.message };
  }
}

async function validateWeaviate({ clusterUrl, apiKey }) {
  const { default: weaviate } = require("weaviate-ts-client");
  try {
    const weaviateUrl = new URL(clusterUrl);
    const options = {
      scheme: weaviateUrl.protocol?.replace(":", "") || "http",
      host: weaviateUrl?.host,
      ...(apiKey ? { apiKey: new weaviate.ApiKey(apiKey) } : {}),
    };

    const client = weaviate.client(options);
    const clusterReady = await client.misc.liveChecker().do();
    if (!clusterReady) throw new Error("Weaviate::Cluster not ready.");
    return { valid: true, message: null };
  } catch (e) {
    return { valid: false, message: e.message };
  }
}

module.exports = {
  validateNewDatabaseConnector,
  validateChroma,
  validatePinecone,
  validateQDrant,
  validateWeaviate,
};
