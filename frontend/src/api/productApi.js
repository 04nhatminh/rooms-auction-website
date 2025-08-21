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

    getRoomByUID: async (uid, abortSignal = null) => {
    const opts = { method: 'GET', headers: { 'Content-Type': 'application/json' } };
    if (abortSignal) opts.signal = abortSignal;

    const res = await fetch(`${API_BASE_URL}/api/room/${uid}`, opts);
    if (!res.ok) {
      let errText = 'Request failed';
      try { const e = await res.json(); errText = e.message || errText; } catch {}
      throw new Error(errText);
    }
    return res.json(); // giả sử backend trả { data: {...} }
    },
};

export default productApi;