const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || '';
        const base = path.basename(file.originalname, ext).replace(/\s+/g, '-').slice(0, 50);
        cb(null, base + '-' + uniqueSuffix + ext);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        // Allow common deliverable types: pdf, images, video, docs
        const allowed = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|mp4|webm|mov|mp3|wav|png|jpe?g|gif|webp)$/i;
        const ext = path.extname(file.originalname);
        if (allowed.test(ext) || !ext) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed. Use PDF, documents, images, video, or archives.'));
        }
    },
});

module.exports = upload;
