const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadLogo');
const generateApkController = require('../controllers/generateController');

router.post('/', upload.single('logoFile'), generateApkController);

module.exports = router;
