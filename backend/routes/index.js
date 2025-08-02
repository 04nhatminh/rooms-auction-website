const express = require('express');
const router = express.Router();

const demoRoutes = require('./demoRoutes');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');


// Demo routes - điều hướng đến /demo
router.use('/api/demo', demoRoutes);
router.use('/', authRoutes);
router.use('/user', userRoutes);



module.exports = router;
