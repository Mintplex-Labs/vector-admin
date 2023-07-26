function handleError(err = null) {
  if (!err) return;
  console.error("Failed to set table pragma", err);
}

async function preSave(_req, _res, args, next) {
  await args.db.client.query("PRAGMA foreign_keys = ON", handleError);
  next();
}

async function postSave(_req, _res, args, next) {
  await args.db.client.query("PRAGMA foreign_keys = ON", handleError);
  next();
}

async function preList(_req, _res, args, next) {
  await args.db.client.query("PRAGMA foreign_keys = ON", handleError);
  next();
}

module.exports = {
  preSave,
  postSave,
  preList,
};
