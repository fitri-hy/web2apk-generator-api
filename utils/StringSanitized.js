function sanitizePackageName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 40);
}

module.exports = {
    sanitizePackageName
};
