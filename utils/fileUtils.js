const fs = require('fs');
const path = require('path');

function cleanupTempFiles(buildDir) {
    try {
        fs.rmSync(buildDir, { recursive: true, force: true });
        fs.rmSync(path.join(__dirname, '../temps'), { recursive: true, force: true });
    } catch (err) {
        console.error('Error cleaning up temporary files:', err.message);
    }
}

module.exports = { cleanupTempFiles };
