const { User } = require("../../../models/user");
const {
  userFromSession,
  reqBody,
  validSessionForUser,
} = require("../../../utils/http");

process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();

function userEndpoints(app) {
  if (!app) return;

  app.get(
    "/v1/users",
    [validSessionForUser],
    async function (request, response) {
      try {
        const user = await userFromSession(request);
        if (!user || user.role !== "admin") {
          response.sendStatus(403).end();
          return;
        }

        const users = await User.whereWithOrgs(`role != 'root'`);
        response.status(200).json({ users });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.delete(
    "/v1/users/:userId",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { userId } = request.params;
        const user = await userFromSession(request);
        if (!user || user.role !== "admin") {
          response.sendStatus(403).end();
          return;
        }

        if (user.id == userId) {
          response
            .status(200)
            .json({ success: false, error: "You cannot delete yourself." });
          return;
        }

        await User.delete(`id = ${userId}`);
        response.status(200).json({ success: true, error: null });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/user/new",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { email, password, role = "default" } = reqBody(request);
        const user = await userFromSession(request);
        if (!user || user.role !== "admin") {
          response.sendStatus(403).end();
          return;
        }

        const { user: newUser, message } = await User.create({
          email,
          password,
          role,
        });
        await User.addToAllOrgs(newUser.id);
        response.status(200).json({ success: !!newUser, error: message });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/v1/users/:userId",
    [validSessionForUser],
    async function (request, response) {
      try {
        const { userId } = request.params;
        const updates = reqBody(request);

        const user = await userFromSession(request);
        if (!user || user.role !== "admin") {
          response.sendStatus(403).end();
          return;
        }

        const { success, error } = await User.update(userId, updates);
        response.status(200).json({ success, error });
      } catch (e) {
        console.log(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );
}

module.exports = { userEndpoints };
