const multer = require('multer');
const path = require('path');

function makeImageUpload() {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    const cloudinary = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const storage = new CloudinaryStorage({
      cloudinary,
      params: { folder: 'romera', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] },
    });
    return multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
  }
  const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, unique + path.extname(file.originalname));
    },
  });
  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only images are allowed'));
    },
  });
}

function makeDocUpload() {
  const ALLOWED_MIME = [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    const cloudinary = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const storage = new CloudinaryStorage({
      cloudinary,
      params: (req, file) => ({
        folder: 'romera/docs',
        resource_type: file.mimetype.startsWith('image/') ? 'image' : 'raw',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx'],
      }),
    });
    return multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
  }

  const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, unique + path.extname(file.originalname));
    },
  });
  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
      else cb(new Error('Unsupported file type'));
    },
  });
}

const upload     = makeImageUpload();
const uploadDocs = makeDocUpload();

module.exports = upload;
module.exports.uploadDocs = uploadDocs;
