const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Upload folder
const uploadPath = path.join(
  __dirname,
  "../uploads/properties"
);

// Create folder if it doesn't exist
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, {
    recursive: true,
  });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

// File validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      ),
      false
    );
  }
};

// Multer configuration
const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per image
    files: 10, // Maximum 10 images
  },
});

module.exports = upload;