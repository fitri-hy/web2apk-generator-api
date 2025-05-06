const path = require('path');

function setupEnvPath(androidSdk, gradlePath) {
    const isWin = process.platform === 'win32';
    const separator = isWin ? ';' : ':';

    process.env.ANDROID_HOME = androidSdk;
    process.env.PATH = [
        path.join(androidSdk, 'platform-tools'),
        path.join(androidSdk, 'cmdline-tools', 'latest', 'bin'),
        gradlePath,
        process.env.PATH
    ].join(separator);
}

module.exports = { setupEnvPath };
