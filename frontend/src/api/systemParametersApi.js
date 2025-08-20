const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export const systemParametersApi = {
    // Lấy nhiều tham số hệ thống theo UIDs
    getAllParameters: async (abortSignal = null) => {
        try {
            const fetchOptions = {
                method: 'GET',
                headers: {
                'Content-Type': 'application/json',
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
    }
};

export default systemParametersApi;