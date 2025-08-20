const SystemParametersModel = require('../models/systemParametersModel');
const pool = require('../config/database');

class SystemParametersController {
    static async getAllParameters(req, res) {
        try {
            const parameters = await SystemParametersModel.getAllParameters();
            return res.status(200).json({
                success: true,
                data: parameters
            });
        } catch (error) {
            console.error('Error in getAllParameters:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = SystemParametersController;
