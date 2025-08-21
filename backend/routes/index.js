const express = require('express');
const router = express.Router();

const demoRoutes = require('./demoRoutes');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const productRoutes = require('./productRoutes');
const auctionRoutes = require('./auctionRoutes');
const imageRoutes = require('./imageRoutes');
const reviewRoutes = require('./reviewRoutes');
const locationRoutes = require('./locationRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const searchRoutes = require('./searchRoutes');
const systemParametersRoutes = require('./systemParametersRoutes');


// Demo routes - điều hướng đến /demo
router.use('/api/demo', demoRoutes);
router.use('/api/room', productRoutes);
router.use('/api/auction', auctionRoutes);
router.use('/api/images', imageRoutes);
router.use('/api/reviews', reviewRoutes);
router.use('/api/locations', locationRoutes);
router.use('/', authRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
router.use('/favorite', favoriteRoutes);
router.use('/api/search', searchRoutes);
router.use('/api/system-parameters', systemParametersRoutes);

router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Hello',
    });
});

module.exports = router;
