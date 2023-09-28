const prisma = require("../utils/prisma");

const DocumentVectors = {
  createMany: async function (vectors = []) {
    try {
      if (vectors.length === 0) return;
      const inserts = vectors.map((vector) => {
        return {
          docId: vector.docId,
          vectorId: vector.vectorId,
          document_id: Number(vector.documentId),
          workspace_id: Number(vector.workspaceId),
          organization_id: Number(vector.organizationId),
        };
      });

      await prisma.document_vectors.createMany({
        data: inserts,
      });

      return;
    } catch (e) {
      console.error(e.message);
      return { organization: null, error: e.message };
    }
  },

  get: async function (clause = {}) {
    try {
      const vector = await prisma.document_vectors.findFirst({
        where: clause,
      });
      return vector ? { ...vector } : null;
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  where: async function (
    clause = {},
    limit = null,
    offset = null,
    orderBy = null
  ) {
    try {
      const vectors = await prisma.document_vectors.findMany({
        where: clause,
        ...(limit !== null ? { take: limit } : {}),
        ...(offset !== null ? { skip: offset } : {}),
        ...(orderBy !== null ? { orderBy } : {}),
      });
      return vectors;
    } catch (e) {
      console.error(e.message);
      return [];
    }
  },

  count: async function (clause = {}) {
    try {
      const count = await prisma.document_vectors.count({ where: clause });
      return count;
    } catch (e) {
      console.error(e.message);
      return 0;
    }
  },

  delete: async function (clause = {}) {
    try {
      await prisma.document_vectors.deleteMany({ where: clause });
      return true;
    } catch (e) {
      console.error(e.message);
      return false;
    }
  },
};

module.exports.DocumentVectors = DocumentVectors;
