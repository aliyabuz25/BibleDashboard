const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Yalnızca görsel dosyaları yüklenebilir!'));
};

const mediaFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const videoExts = ['.mp4', '.mov', '.webm', '.m4v', '.avi'];
  const subtitleExts = ['.srt', '.vtt', '.txt'];
  const allowedMime = [
    /^image\//,
    /^video\//,
    /^text\/plain$/,
    /^text\/vtt$/,
    /^application\/octet-stream$/
  ];

  const mimeOk = allowedMime.some((pattern) => pattern.test(file.mimetype));
  const extOk = imageExts.includes(ext) || videoExts.includes(ext) || subtitleExts.includes(ext);

  if (mimeOk || extOk) {
    return cb(null, true);
  }
  cb(new Error('Bu dosya türü yüklenemiyor. Lütfen görsel, video veya altyazı dosyası seçin.'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB limit
  fileFilter: imageFilter
});

const genericUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10GB limit for uploads
});

const mediaUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB limit for video uploads
  fileFilter: mediaFilter
});

upload.genericUpload = genericUpload;
upload.mediaUpload = mediaUpload;

module.exports = upload;
