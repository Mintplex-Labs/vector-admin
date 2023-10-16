const prisma = require("../utils/prisma");

const Notification = {
  create: async function (organizationId = 0, notificationData = {}) {
    try {
      const {
        textContent = "",
        symbol = null,
        link = null,
        target = null,
      } = notificationData;
      const notification = await prisma.organization_notifications.create({
        data: {
          organization_id: Number(organizationId),
          textContent,
          symbol,
          link,
          target,
        },
      });

      if (!notification) {
        await db.close();
        console.error("FAILED TO CREATE NOTIFICATION.");
        return { notification: null, message: "Could not create notification" };
      }

      return { notification, message: null };
    } catch (e) {
      console.error(e.message);
      return null;
    }
  },

  get: async function (clause = {}) {
    try {
      const notification = await prisma.organization_notifications.findFirst({
        where: clause,
      });
      return notification ? { ...notification } : null;
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
      const workspaces = await prisma.organization_notifications.findMany({
        where: clause,
        ...(limit !== null ? { take: limit } : {}),
        ...(offset !== null ? { skip: offset } : {}),
        ...(orderBy !== null ? { orderBy } : {}),
      });
      return workspaces;
    } catch (e) {
      console.error(e.message);
      return 0;
    }
  },

  count: async function (clause = {}) {
    try {
      const count = await prisma.organization_notifications.count({
        where: clause,
      });
      return count;
    } catch (e) {
      console.error(e.message);
      return 0;
    }
  },

  delete: async function (clause = {}) {
    try {
      await prisma.organization_notifications.deleteMany({ where: clause });
      return true;
    } catch (e) {
      console.error(e.message);
      return false;
    }
  },

  markSeenForOrg: async function (organizationId = 0) {
    const unseenNotifications = await this.where({
      organization_id: Number(organizationId),
      seen: false,
    });
    const notificationIds = unseenNotifications.map((notif) => notif.id);
    await prisma.organization_notifications.updateMany({
      where: {
        id: {
          in: notificationIds,
        },
      },
      data: {
        seen: true,
        lastUpdatedAt: new Date(),
      },
    });
  },
};

module.exports.Notification = Notification;
