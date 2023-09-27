const prisma = require("../utils/prisma");

const SystemSettings = {
  supportedFields: [
    "allow_account_creation",
    "account_creation_domain_scope",
    "open_ai_api_key",
    "debug_username",
    "debug_pwd",
    "telemetry_id",
  ],
  privateField: ["open_ai_api_key"],
  get: async function (clause = {}) {
    try {
      const setting = await prisma.system_settings.findFirst({ where: clause });
      return setting || null;
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  where: async function (clause = {}, limit = null) {
    try {
      const settings = await prisma.system_settings.findMany({
        where: clause,
        ...(limit !== null ? { take: limit } : {}),
      });
      return settings;
    } catch (e) {
      console.error(e.message);
      return [];
    }
  },

  updateSettings: async function (updates = {}) {
    const validConfigKeys = Object.keys(updates).filter((key) =>
      this.supportedFields.includes(key)
    );

    for (const key of validConfigKeys) {
      const existingRecord = await this.get({ label: key });
      if (!existingRecord) {
        const value = updates[key] === null ? "" : String(updates[key]);
        const success = await prisma.system_settings.create({
          data: { label: key, value },
        });
        if (!success) {
          console.error("FAILED TO ADD SYSTEM CONFIG OPTION", message);
          return { success: false, error: message };
        }
      } else {
        const value = updates[key] === null ? "" : String(updates[key]);
        const success = await prisma.system_settings.update({
          where: { id: Number(existingRecord.id) },
          data: { label: key, value },
        });
        if (!success) {
          console.error("FAILED TO UPDATE SYSTEM CONFIG OPTION", message);
          return { success: false, error: message };
        }
      }
    }
    return { success: true, error: null };
  },
};

module.exports.SystemSettings = SystemSettings;
