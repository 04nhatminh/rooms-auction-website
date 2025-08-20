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
}

module.exports = SystemParametersModel;
