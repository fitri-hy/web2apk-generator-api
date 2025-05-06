const axios = require('axios');

async function checkImageUrl(imageUrl) {
    try {
        const response = await axios.head(imageUrl);
        return response.headers['content-type'].includes('image/png');
    } catch (err) {
        console.error('Error fetching image URL:', err);
        return false;
    }
}

module.exports = { checkImageUrl };
