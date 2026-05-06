const path = require("path");
const multer = require("multer");

// Student photos are stored locally so the system still works without internet.
const studentPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "public", "uploads", "students"));
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "-").toLowerCase();
    cb(null, `${Date.now()}-${safeName}`);
  },
});

function imageOnly(req, file, cb) {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"));
  }

  cb(null, true);
}

const uploadStudentPhoto = multer({
  storage: studentPhotoStorage,
  fileFilter: imageOnly,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = {
  uploadStudentPhoto,
};
