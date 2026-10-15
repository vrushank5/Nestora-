const fs = require("fs");
const multer = require("multer");
const path = require("path");

const uploadPath = path.join(__dirname, "../uploads/profiles");
fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadPath),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const fileFilter = (_req, file, callback) => {
  if (["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.mimetype)) {
    return callback(null, true);
  }
  return callback(new Error("Only JPG, JPEG, PNG and WEBP images are allowed"));
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
