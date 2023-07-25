const {
  OrganizationConnection,
} = require("../../../models/organizationConnection");
const { Chroma } = require("./chroma");
const { Pinecone } = require("./pinecone");

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

  throw new Error(
    "Could not find supported connector for vector database.",
    type
  );
}

module.exports = { selectConnector };
