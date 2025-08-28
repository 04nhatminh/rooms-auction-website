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

    static async updateParameter(req, res) {
        try {
            const { paramName } = req.params;
            const { ParamValue } = req.body;

            console.log('Updating parameter:', paramName, 'with value:', ParamValue);

            // Validate input
            if (!paramName) {
                return res.status(400).json({
                    success: false,
                    message: 'ParamName is required'
                });
            }

            if (ParamValue === undefined || ParamValue === null) {
                return res.status(400).json({
                    success: false,
                    message: 'ParamValue is required'
                });
            }

            // Update parameter
            const result = await SystemParametersModel.updateParameter(paramName, ParamValue);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Parameter not found'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Parameter updated successfully',
                data: {
                    ParamName: paramName,
                    ParamValue: ParamValue
                }
            });
        } catch (error) {
            console.error('Error in updateParameter:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    static async getPaymentDeadlineTime(req, res) {
        try {
            const parameter = await SystemParametersModel.getPaymentDeadlineTime();
            return res.status(200).json({
                success: true,
                data: parameter
            });
        } catch (error) {
            console.error('Error in getPaymentDeadlineTime:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = SystemParametersController;
