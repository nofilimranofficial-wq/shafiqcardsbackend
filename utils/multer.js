const multer = require('multer');
const path = require('path');

// -------------------------------------------------------
// Local Disk Storage Engine
// Files are saved to the Server/uploads directory.
// -------------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// -------------------------------------------------------
// File filter — reject unsupported types early
// -------------------------------------------------------
const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed: jpg, png, webp, mp4, mov`
      ),
      false
    );
  }
};

// -------------------------------------------------------
// Multer instance — 50 MB limit per file
// -------------------------------------------------------
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

module.exports = upload;
