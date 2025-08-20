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
}

module.exports = SystemParametersModel;
