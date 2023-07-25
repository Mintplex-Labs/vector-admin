process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();
const JWT = require("jsonwebtoken");
const { User } = require("../../models/user");
const SECRET = process.env.JWT_SECRET;

function reqBody(request) {
  return typeof request.body === "string"
    ? JSON.parse(request.body)
    : request.body;
}

function queryParams(request) {
  return request.query;
}

function makeJWT(info = {}, expiry = "30d") {
  if (!SECRET) throw new Error("Cannot create JWT as JWT_SECRET is unset.");
  return JWT.sign(info, SECRET, { expiresIn: expiry });
}

function validSessionForUser(request, response, next) {
  const auth = request.header("Authorization");
  const email = request.header("requester-email");
  const token = auth ? auth.split(" ")[1] : null;

  // If no token present or no email
  if (!token || !email) {
    response.sendStatus(403).end();
    return;
  }

  // If the decode of the JWT fails totally.
  const valid = decodeJWT(token);
  if (!valid) {
    response.sendStatus(403).end();
    return;
  }

  // If the decoded JWT [email] prop does not match the requester header
  if (valid.email.toLowerCase() !== email.toLowerCase()) {
    response.sendStatus(403).end();
    return;
  }

  next();
}

async function userFromSession(request) {
  const auth = request.header("Authorization");
  const email = request.header("requester-email");
  const token = auth ? auth.split(" ")[1] : null;

  if (!token || !email) {
    return null;
  }

  const valid = decodeJWT(token);
  if (!valid) {
    return null;
  }

  const user = await User.get(`id = ${valid.id}`);
  return user;
}

function decodeJWT(jwtToken) {
  try {
    return JWT.verify(jwtToken, SECRET);
  } catch {}
  return null;
}

module.exports = {
  reqBody,
  userFromSession,
  validSessionForUser,
  queryParams,
  makeJWT,
  decodeJWT,
};
