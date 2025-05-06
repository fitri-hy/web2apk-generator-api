const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { checkImageUrl } = require('./imageUtils');

async function logoManifest(req, buildDir, logoUrl) {
    const logoDir = path.join(buildDir, 'platforms/android/app/src/main/res/mipmap');
    const logoPath = path.join(logoDir, 'logo_launcher.png');
    fs.mkdirSync(logoDir, { recursive: true });

    if (req.file) {
        const uploadedPath = path.join(__dirname, '../', req.file.path);
        fs.copyFileSync(uploadedPath, logoPath);
        fs.unlinkSync(uploadedPath);
    }

    else if (logoUrl) {
        const isPng = await checkImageUrl(logoUrl);
        if (isPng) {
            const logoRes = await axios.get(logoUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(logoPath, logoRes.data);
        } else {
            throw new Error('Logo URL must be a PNG image');
        }
    }

    const manifestPath = path.join(buildDir, 'platforms/android/app/src/main/AndroidManifest.xml');
    if (fs.existsSync(manifestPath)) {
        let manifest = fs.readFileSync(manifestPath, 'utf8');
        manifest = manifest.replace(/android:icon="[^"]+"/, 'android:icon="@mipmap/logo_launcher"');
        fs.writeFileSync(manifestPath, manifest);
    }
}

module.exports = logoManifest;
