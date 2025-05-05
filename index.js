const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const OUTPUT_DIR = path.join(__dirname, 'output');
const TEMPLATE_DIR = path.join(__dirname, 'app-template');

const ANDROID_SDK_PATH = 'C:\\Users\\MKG Atas\\AppData\\Local\\Android\\Sdk';
const GRADLE_PATH = path.join(__dirname, 'gradle-8.14', 'bin');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

app.post('/generate', async (req, res) => {
    const { appName, url } = req.body;

    if (!appName || !url) {
        return res.status(400).json({ error: 'appName and url are required' });
    }

    const id = uuidv4();
    const buildDir = path.join(__dirname, `build-${id}`);
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

    const isWin = process.platform === 'win32';
    const separator = isWin ? ';' : ':';

    process.env.ANDROID_HOME = ANDROID_SDK_PATH;
    process.env.PATH = [
        path.join(ANDROID_SDK_PATH, 'platform-tools'),
        path.join(ANDROID_SDK_PATH, 'cmdline-tools', 'latest', 'bin'),
        GRADLE_PATH,
        process.env.PATH
    ].join(separator);

    exec(`cd ${buildDir} && cordova build android`, (err, stdout, stderr) => {
        if (err) {
            console.error(stderr);
            return res.status(500).json({ error: 'Build failed', details: stderr });
        }

        const apkPath = path.join(buildDir, 'platforms/android/app/build/outputs/apk/debug/app-debug.apk');

        if (!fs.existsSync(apkPath)) {
            return res.status(500).json({ error: 'APK not found after build' });
        }

        fs.renameSync(apkPath, apkOutputPath);
        fs.rmSync(buildDir, { recursive: true, force: true });

        return res.json({
            message: 'APK generated',
            downloadUrl: `http://localhost:8800/download/${path.basename(apkOutputPath)}`
        });
    });
});

app.use('/download', express.static(OUTPUT_DIR));

app.listen(8800, () => {
    console.log('APK Generator running on http://localhost:8800');
});
