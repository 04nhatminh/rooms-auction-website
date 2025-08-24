const { geocode } = require('../models/geocodeModel');

async function getGeocode(req, res) {
    try {
        const q = (req.query.q || '').trim();
        if (!q) return res.status(400).json({ success: false, message: 'Missing q' });

        const result = await geocode(q);
        return res.json({ success: true, ...result });
    } catch (e) {
        console.error('[geocodeController] error:', e);
        return res.status(500).json({ success: false, message: e.message });
    }
}

module.exports = { getGeocode };
