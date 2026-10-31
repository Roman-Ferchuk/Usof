const multer = require('multer');
const fs = require('fs');

// The extension comes from the checked MIME type, never from the client's file name
// (otherwise "x.html" with an image MIME type would be served as a page from our origin).
const EXTENSIONS = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

const ensureDirExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/misc';

        if (file.fieldname === 'avatar') {
            uploadPath = 'uploads/avatars';
        } else if (file.fieldname === 'images') {
            uploadPath = 'uploads/images';
        }

        ensureDirExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = EXTENSIONS[file.mimetype] || '';
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG and WEBP are allowed.'), false);
    }
};

const limits = {
    fileSize: 5 * 1024 * 1024
};

const upload = multer({
    storage,
    fileFilter,
    limits
});

module.exports = upload;