const { DocumentVectors } = require("../../../models/documentVectors");

async function vectorIdSearch(_document, query) {
  const documentVector = await DocumentVectors.get({ vectorId: query });
  if (!documentVector)
    return { fragments: [], error: "No document vector found with that id." };
  return { fragments: [documentVector], error: null };
}

module.exports = {
  vectorIdSearch,
};
