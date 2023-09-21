const {
  OrganizationConnection,
} = require("../../../models/organizationConnection");
const { Chroma } = require("./chroma");
const { Pinecone } = require("./pinecone");
const { QDrant } = require("./qdrant");

function selectConnector(organizationConnector) {
  const { type } = organizationConnector;

  if (!OrganizationConnection.supportedConnectors.includes(type))
    throw new Error("Unsupported connector for vector database.");
  if (organizationConnector.type === "chroma") {
    return new Chroma(organizationConnector);
  }

  if (organizationConnector.type === "pinecone") {
    return new Pinecone(organizationConnector);
  }

  if (organizationConnector.type === "qdrant") {
    return new QDrant(organizationConnector);
  }

  throw new Error(
    "Could not find supported connector for vector database.",
    type
  );
}

module.exports = { selectConnector };
