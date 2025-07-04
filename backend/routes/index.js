const express = require('express');
const router = express.Router();

const demoRoutes = require('./demoRoutes');

// Demo routes - điều hướng đến /demo
router.use('/api/demo', demoRoutes);

router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Hello',
    });
});

module.exports = router;
