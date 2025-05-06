const multer = require('multer');
const path = require('path');

const upload = multer({
    dest: 'temps/',
    fileFilter: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname).toLowerCase();
        cb(null, fileExtension === '.png');
    }
});

module.exports = upload;
