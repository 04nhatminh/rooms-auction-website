const express = require('express');
const router = express.Router();

const demoRoutes = require('./demoRoutes');
const userRoutes = require('./userRoutes');

// Demo routes - điều hướng đến /demo
router.use('/api/demo', demoRoutes);

router.use('/user', userRoutes);



module.exports = router;
