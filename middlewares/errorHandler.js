module.exports = (err, req, res, next) => {
    console.error(err.message);
    if (err.message.includes('Only PNG files are allowed')) {
        return res.status(400).json({ error: 'Only PNG files are allowed' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
};
