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

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            overscroll-behavior-y: auto;
            margin: 0;
            padding: 0;
        }

        #pull-area {
            position: fixed;
            left: 0;
            width: 100%;
            transition: top 0.3s ease-out;
        }

        #pull-area.visible {
            top: 0;
        }

        .loading-bar {
            height: 2px;
            width: 0;
            transition: width 1s ease-out;
        }

        .refresh-message {
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        }

        #pull-area.visible .refresh-message {
            opacity: 1;
        }
    </style>
</head>
<body>
    <div id="pull-area" class="text-center z-50">
		<div id="loading-bar" class="loading-bar bg-blue-500"></div>
    </div>

    <div class="content">
        <div class="fixed top-0 left-0 w-full z-40 h-4 bg-transparent"></div>
        <iframe src="${url}" class="h-screen w-full border-none" id="iframe"></iframe>
    </div>

    <script>
        const pullArea = document.getElementById('pull-area');
        const loadingBar = document.getElementById('loading-bar');
        const refreshMessage = document.querySelector('.refresh-message');
        let touchstartY = 0;

        document.addEventListener('touchstart', function(e) {
            touchstartY = e.touches[0].clientY;
        });

        document.addEventListener('touchmove', function(e) {
            const touchY = e.touches[0].clientY;
            const touchDiff = touchY - touchstartY;

            if (touchDiff > 0 && window.scrollY === 0) {
                pullArea.classList.add('visible');
                e.preventDefault();
                
                const progress = Math.min(touchDiff / 200, 1) * 100;
                loadingBar.style.width = progress + '%';
            }
        });

        document.addEventListener('touchend', function() {
            if (pullArea.classList.contains('visible')) {
                loadingBar.style.width = '100%';
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }
        });
    </script>
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
