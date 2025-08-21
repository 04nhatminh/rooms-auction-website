const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export const productApi = {
    // Lấy top rated products theo province code
    getTopRatedProducts: async (provinceCode, limit, abortSignal = null) => {
        try {
            const fetchOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            // Thêm AbortSignal nếu được cung cấp
            if (abortSignal) {
                fetchOptions.signal = abortSignal;
            }

            const response = await fetch(`${API_BASE_URL}/api/room/top-rated/province?provinceCode=${provinceCode}&limit=${limit}`, fetchOptions);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Product API request was aborted');
                throw error;
            }
            console.error('Error fetching top rated products:', error);
            throw error;
        }
    },

    getTopRatedProductsByDistrict: async (districtCode, limit, abortSignal = null) => {
        try {
            const fetchOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            // Thêm AbortSignal nếu được cung cấp
            if (abortSignal) {
                fetchOptions.signal = abortSignal;
            }

            const response = await fetch(`${API_BASE_URL}/api/room/top-rated/district?districtCode=${districtCode}&limit=${limit}`, fetchOptions);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Product API request was aborted');
                throw error;
            }
            console.error('Error fetching top rated products:', error);
            throw error;
        }
    },

    checkAvailability: async (uid, { checkin, checkout }, abortSignal = null) => {
        try {
            const fetchOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            };
            if (abortSignal) fetchOptions.signal = abortSignal;

            // Giữ nguyên route backend bạn đang có (/calendar/check)
            const url = `${API_BASE_URL}/calendar/check?uid=${encodeURIComponent(uid)}&checkin=${checkin}&checkout=${checkout}`;

            const response = await fetch(url, fetchOptions);
            if (!response.ok) {
            let errorData = {};
            try { errorData = await response.json(); } catch (_) {}
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
            console.log('Product API request was aborted');
            throw error;
            }
            console.error('Error checking availability:', error);
            throw error;
        }
    },
};

export default productApi;