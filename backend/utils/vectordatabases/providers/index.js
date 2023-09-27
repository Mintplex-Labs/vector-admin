function selectConnector(organizationConnector) {
  const {
    OrganizationConnection,
  } = require("../../../models/organizationConnection");
  const { type } = organizationConnector;

  if (!OrganizationConnection.supportedConnectors.includes(type))
    throw new Error("Unsupported connector for vector database.");
  if (organizationConnector.type === "chroma") {
    const { Chroma } = require("./chroma");
    return new Chroma(organizationConnector);
  }

  if (organizationConnector.type === "pinecone") {
    const { Pinecone } = require("./pinecone");
    return new Pinecone(organizationConnector);
  }

  if (organizationConnector.type === "qdrant") {
    const { QDrant } = require("./qdrant");
    return new QDrant(organizationConnector);
  }

  if (organizationConnector.type === "weaviate") {
    const { Weaviate } = require("./weaviate");
    return new Weaviate(organizationConnector);
  }

  throw new Error(
    "Could not find supported connector for vector database.",
    type
  );
}

module.exports = { selectConnector };
