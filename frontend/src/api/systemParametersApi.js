const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export const systemParametersApi = {
    getPaymentDeadlineTime: async (abortSignal = null) => {
        const r = await fetch(`${API_BASE_URL}/api/system-parameters/get-payment-deadline-time`, {
            method: 'GET', headers: { 'Content-Type': 'application/json' },
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.message || 'Lấy thông tin quy định thời gian thanh toán thất bại.');
        return data;
    },

    // Lấy nhiều tham số hệ thống theo UIDs
    getAllParameters: async (abortSignal = null) => {
        try {
            const fetchOptions = {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            // Thêm AbortSignal nếu được cung cấp
            if (abortSignal) {
                fetchOptions.signal = abortSignal;
            }

            const response = await fetch(`${API_BASE_URL}/api/system-parameters/get-parameters`, fetchOptions);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('System Parameters API request was aborted');
                throw error;
            }
            console.error('Error fetching system parameters:', error);
            throw error;
        }
    },

    // Cập nhật thông số hệ thống
    updateParameter: async (paramName, paramValue, abortSignal = null) => {
        try {
            const fetchOptions = {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ParamValue: paramValue })
            };

            // Thêm AbortSignal nếu được cung cấp
            if (abortSignal) {
                fetchOptions.signal = abortSignal;
            }

            const response = await fetch(`${API_BASE_URL}/api/system-parameters/update-parameter/${paramName}`, fetchOptions);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Update Parameter API request was aborted');
                throw error;
            }
            console.error('Error updating system parameter:', error);
            throw error;
        }
    }
};

export default systemParametersApi;