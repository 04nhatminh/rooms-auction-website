const pool = require('../config/database');

class SystemParametersModel {
    static async getAllParameters() {
        try {
            const query = `
                SELECT ParamName, ParamValue
                FROM SystemParameters
            `;
            const [parameters] = await pool.execute(query);
            console.log(`Fetched system parameters:`, parameters);
            return parameters;
        } catch (error) {
            console.error('Error fetching system parameters:', error);
            throw error;
        }
    }

    static async updateParameter(paramName, paramValue) {
        try {
            const query = `
                UPDATE SystemParameters 
                SET ParamValue = ?
                WHERE ParamName = ?
            `;
            const [result] = await pool.execute(query, [paramValue, paramName]);
            console.log(`Updated parameter ${paramName} with value:`, paramValue);
            return result;
        } catch (error) {
            console.error('Error updating system parameter:', error);
            throw error;
        }
    }

    static async getPaymentDeadlineTime() {
        try {
            const query = `
                SELECT ParamValue
                FROM SystemParameters
                WHERE ParamName = 'PaymentDeadlineTime'
                LIMIT 1
            `;
            const [rows] = await pool.execute(query);
            if (rows.length > 0) {
            return rows[0];
            }
            return null; // không có record
        } catch (error) {
            console.error('Error fetching PaymentDeadlineTime parameter:', error);
            throw error;
        }
    }
}

module.exports = SystemParametersModel;
