const fs = require("fs");
const path = require("path");

async function readJSON(filepath = null) {
  if (!fs.existsSync(filepath))
    throw new Error(`${filepath} does not exist in storage`);
  try {
    const rawData = fs.readFileSync(filepath, "utf-8");
    return JSON.parse(rawData);
  } catch (e) {
    console.error(e.message);
    throw new Error(`Could not read JSON data from ${filepath}`, e.message);
  }
}

async function fetchMetadata(filepath = null) {
  if (!fs.existsSync(filepath))
    throw new Error(`${filepath} does not exist in storage`);
  try {
    return fs.statSync(filepath);
  } catch (e) {
    console.error(e.message);
    throw new Error(`Could not read JSON data from ${filepath}`, e.message);
  }
}

async function deleteVectorCacheFile(digestFilename = null) {
  try {
    const filepath = path.resolve(
      __dirname,
      `../../storage/vector-cache/${digestFilename}.json`
    );
    if (!fs.existsSync(filepath)) return false;

    console.log(`Removing vector-cache file ${digestFilename}`);
    fs.rmSync(filepath);
    return true;
  } catch (e) {
    console.error(`deleteVectorCacheFile`, e.message);
    return false;
  }
}

// Searches the vector-cache folder for existing information so we dont have to re-embed a
// document and can instead push directly to vector db.
async function cachedVectorInformation(
  digestFilename = null,
  checkOnly = false
) {
  if (!digestFilename) return checkOnly ? false : { exists: false, chunks: [] };
  const file = path.resolve(
    __dirname,
    `../../storage/vector-cache/${digestFilename}.json`
  );
  const exists = fs.existsSync(file);

  if (checkOnly) return exists;
  if (!exists) return { exists, chunks: [] };

  console.log(
    `Cached vectorized results of ${digestFilename} found! Using cached data to save on embed costs.`
  );
  const rawData = fs.readFileSync(file, "utf8");
  return { exists: true, chunks: JSON.parse(rawData) };
}

// vectorData: pre-chunked vectorized data for a given file that includes the proper metadata and chunk-size limit so it can be iterated and dumped into Pinecone, etc
// digestFilename is the document title with `ws_<workspace_id>` all digested prepended to the title and hashed with v5.URL so each cache can be different between workspaces.
async function storeVectorResult(vectorData = [], digestFilename = null) {
  if (!digestFilename) return;

  const folder = path.resolve(__dirname, `../../storage/vector-cache`);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

  const writeTo = path.resolve(folder, `${digestFilename}.json`);
  fs.writeFileSync(writeTo, JSON.stringify(vectorData), "utf8");
  return;
}

module.exports = {
  readJSON,
  fetchMetadata,
  cachedVectorInformation,
  storeVectorResult,
  deleteVectorCacheFile,
};
