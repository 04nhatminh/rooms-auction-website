const express = require('express');
const router = express.Router();

const demoRoutes = require('./demoRoutes');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const productRoutes = require('./productRoutes');
const imageRoutes = require('./imageRoutes');
const reviewRoutes = require('./reviewRoutes');


// Demo routes - điều hướng đến /demo
router.use('/api/demo', demoRoutes);
router.use('/api/products', productRoutes);
router.use('/api/images', imageRoutes);
router.use('/api/reviews', reviewRoutes);
router.use('/', authRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);

router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Hello',
    });
});

module.exports = router;
