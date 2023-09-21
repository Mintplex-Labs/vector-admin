const {
  OrganizationConnection,
} = require("../../models/organizationConnection");
const {
  validateChroma,
  validatePinecone,
  validateQDrant,
} = require("./validateNewDatabaseConnector");

async function validateUpdatedDatabaseConnector(connector, config) {
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
  }

  if (!statusCheck.valid)
    return { connector: null, error: statusCheck.message };

  const updatedConnector = await OrganizationConnection.update(connector.id, {
    type,
    settings: JSON.stringify(settings),
  });
  return { connector: updatedConnector, error: null };
}

module.exports = {
  validateUpdatedDatabaseConnector,
};
