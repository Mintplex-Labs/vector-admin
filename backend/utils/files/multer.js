function setupMulter() {
  const multer = require("multer");

  // Handle File uploads for auto-uploading.
  const storage = multer.diskStorage({
    destination: function (_, _, cb) {
      const path = require("path");
      const uploadOutput = path.resolve(
        __dirname,
        `../../../document-processor/hotdir`
      );
      cb(null, uploadOutput);
    },
    filename: function (_, file, cb) {
      cb(null, file.originalname);
    },
  });
  const upload = multer({
    storage,
    fileFilter: function (req, file, callback) {
      // Solve the problem of garbled Chinese names
      file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");
      callback(null, true);
    },
  });
  return { handleUploads: upload };
}

module.exports = {
  setupMulter,
};
