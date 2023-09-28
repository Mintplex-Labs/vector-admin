function handleError(err = null) {
  if (!err) return;
  console.error("Failed to set table pragma", err);
}

async function preSave(_req, _res, args, next) {
  next();
}

async function postSave(_req, _res, args, next) {
  next();
}

async function preList(_req, _res, args, next) {
  next();
}

module.exports = {
  preSave,
  postSave,
  preList,
};
