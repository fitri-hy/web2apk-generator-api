const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const axios = require('axios');
const { checkImageUrl } = require('../utils/imageUtils');
const { cleanupTempFiles } = require('../utils/fileUtils');
const { setupEnvPath } = require('../utils/envSetup');
const { OUTPUT_DIR, TEMPLATE_DIR, ANDROID_SDK_PATH, GRADLE_PATH } = require('../config/paths');

const router = express.Router();

const upload = multer({
    dest: 'temps/',
    fileFilter: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname).toLowerCase();
        cb(null, fileExtension === '.png');
    }
});

router.post('/', upload.single('logoFile'), async (req, res) => {
    const { appName, url, logoUrl } = req.body;

    if (!appName || !url) {
        return res.status(400).json({ error: 'appName and url are required' });
    }

    const id = uuidv4();
    const buildDir = path.join(__dirname, `../build-${id}`);
    const apkOutputPath = path.join(OUTPUT_DIR, `${appName}-${id}.apk`);

    fs.cpSync(TEMPLATE_DIR, buildDir, { recursive: true });

    const html = `
        <!DOCTYPE html>
        <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="margin:0; padding:0;">
            <iframe src="${url}" style="width:100%; height:100vh; border:none;"></iframe>
        </body>
        </html>`;

    fs.writeFileSync(path.join(buildDir, 'www', 'index.html'), html);

    const configPath = path.join(buildDir, 'config.xml');
    let config = fs.readFileSync(configPath, 'utf8');
    config = config.replace(/<name>.*<\/name>/, `<name>${appName}</name>`);
    fs.writeFileSync(configPath, config);

    const logoDir = path.join(buildDir, 'platforms/android/app/src/main/res/mipmap');
    const logoPath = path.join(logoDir, 'logo_launcher.png');
    fs.mkdirSync(logoDir, { recursive: true });

    try {
        if (req.file) {
            const uploadedPath = path.join(__dirname, '../', req.file.path);
            fs.copyFileSync(uploadedPath, logoPath);
            fs.unlinkSync(uploadedPath);
        } else if (logoUrl) {
            const isPng = await checkImageUrl(logoUrl);
            if (isPng) {
                const logoRes = await axios.get(logoUrl, { responseType: 'arraybuffer' });
                fs.writeFileSync(logoPath, logoRes.data);
            } else {
                cleanupTempFiles(buildDir);
                return res.status(400).json({ error: 'Logo URL must be a PNG image' });
            }
        }

        if (fs.existsSync(logoPath)) {
            const manifestPath = path.join(buildDir, 'platforms/android/app/src/main/AndroidManifest.xml');
            if (fs.existsSync(manifestPath)) {
                let manifest = fs.readFileSync(manifestPath, 'utf8');
                manifest = manifest.replace(/android:icon="[^"]+"/, 'android:icon="@mipmap/logo_launcher"');
                fs.writeFileSync(manifestPath, manifest);
            }
        }
    } catch (err) {
        cleanupTempFiles(buildDir);
        return res.status(500).json({ error: 'Failed to set logo', details: err.message });
    }

    setupEnvPath(ANDROID_SDK_PATH, GRADLE_PATH);

    const { exec } = require('child_process');
    exec(`cd ${buildDir} && cordova build android`, (err, stdout, stderr) => {
        if (err) {
            cleanupTempFiles(buildDir);
            return res.status(500).json({ error: 'Build failed', details: stderr });
        }

        const apkPath = path.join(buildDir, 'platforms/android/app/build/outputs/apk/debug/app-debug.apk');

        if (!fs.existsSync(apkPath)) {
            cleanupTempFiles(buildDir);
            return res.status(500).json({ error: 'APK not found after build' });
        }

        fs.renameSync(apkPath, apkOutputPath);
        cleanupTempFiles(buildDir);

        return res.json({
            message: 'APK generated',
            downloadUrl: `http://localhost:8800/download/${path.basename(apkOutputPath)}`
        });
    });
});

module.exports = router;
