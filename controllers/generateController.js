const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { exec } = require('child_process');

const { checkImageUrl } = require('../utils/imageUtils');
const { cleanupTempFiles } = require('../utils/fileUtils');
const { setupEnvPath } = require('../utils/envSetup');
const { sanitizePackageName } = require('../utils/StringSanitized');
const logoManifest = require('../utils/logoManifest');
const template = require('../utils/template');
const { OUTPUT_DIR, TEMPLATE_DIR, ANDROID_SDK_PATH, GRADLE_PATH } = require('../config/paths');

const generateApkController = async (req, res) => {
    const { appName, url, logoUrl } = req.body;

    if (!appName || !url) {
        return res.status(400).json({ error: 'appName and url are required' });
    }

    const id = uuidv4();
    const buildDir = path.join(__dirname, `../build-${id}`);
    const sanitizedAppName = sanitizePackageName(appName);
    const apkOutputPath = path.join(OUTPUT_DIR, `${sanitizedAppName}-${id}.apk`);
    fs.cpSync(TEMPLATE_DIR, buildDir, { recursive: true });

    const sanitizedId = `com.ias.dev.${sanitizedAppName}`;
    
    const html = template(url);
    fs.writeFileSync(path.join(buildDir, 'www', 'index.html'), html);

    const configPath = path.join(buildDir, 'config.xml');
    let config = fs.readFileSync(configPath, 'utf8');
    config = config.replace(/<name>.*<\/name>/, `<name>${appName}</name>`);
    config = config.replace(/id="[^"]+"/, `id="${sanitizedId}"`);
    fs.writeFileSync(configPath, config);

    setupEnvPath(ANDROID_SDK_PATH, GRADLE_PATH);

    exec(`cd ${buildDir} && cordova platform rm android`, (removeErr) => {
        if (removeErr) {
            cleanupTempFiles(buildDir);
            return res.status(500).json({ error: 'Failed to remove Android platform' });
        }

        exec(`cd ${buildDir} && cordova platform add android`, async (addErr) => {
            if (addErr) {
                cleanupTempFiles(buildDir);
                return res.status(500).json({ error: 'Failed to add Android platform' });
            }

            try {
                await logoManifest(req, buildDir, logoUrl);
            } catch (logoErr) {
                cleanupTempFiles(buildDir);
                return res.status(400).json({ error: logoErr.message });
            }

            exec(`cd ${buildDir} && cordova build android`, (buildErr) => {
                if (buildErr) {
                    cleanupTempFiles(buildDir);
                    return res.status(500).json({ error: 'Build failed' });
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
    });
};

module.exports = generateApkController;
