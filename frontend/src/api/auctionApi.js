const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export const auctionApi = {
    // Lấy auction theo province và status
    getAuctionsByProvinceStatus: async (provinceCode, status, limit, abortSignal = null) => {
        try {
            const fetchOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            };

            // Thêm AbortSignal nếu được cung cấp
            if (abortSignal) {
                fetchOptions.signal = abortSignal;
            }

            const response = await fetch(`${API_BASE_URL}/api/auction/province/${provinceCode}?status=${status}&limit=${limit}`, fetchOptions);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Auction API request was aborted');
                throw error;
            }
            console.error('Error fetching auctions:', error);
            throw error;
        }
    },

    // Lấy auction theo district và status
    getAuctionsByDistrictStatus: async (districtCode, status, limit, abortSignal = null) => {
        try {
            const fetchOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            };

            // Thêm AbortSignal nếu được cung cấp
            if (abortSignal) {
                fetchOptions.signal = abortSignal;
            }

            const response = await fetch(`${API_BASE_URL}/api/auction/district/${districtCode}?status=${status}&limit=${limit}`, fetchOptions);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Auction API request was aborted');
                throw error;
            }
            console.error('Error fetching auctions:', error);
            throw error;
        }
    },

    // Lấy thông tin chi tiết auction
    getAuctionDetails: async (auctionId, abortSignal = null) => {
        try {
            const fetchOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            };

            // Thêm AbortSignal nếu được cung cấp
            if (abortSignal) {
                fetchOptions.signal = abortSignal;
            }

            const response = await fetch(`${API_BASE_URL}/api/auction/${auctionId}`, fetchOptions);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Auction API request was aborted');
                throw error;
            }
            console.error('Error fetching auction details:', error);
            throw error;
        }
    },

    // Lấy các auctions ending soon
    getEndingSoonAuctions: async (limit, abortSignal = null) => {
        try {
            const fetchOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            };

            // Thêm AbortSignal nếu được cung cấp
            if (abortSignal) {
                fetchOptions.signal = abortSignal;
            }

            const response = await fetch(`${API_BASE_URL}/api/auction/ending-soon?limit=${limit}`, fetchOptions);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Auction API request was aborted');
                throw error;
            }
            console.error('Error fetching ending soon auctions:', error);
            throw error;
        }
    },

    // Lấy các auctions hot (featured)
    getFeaturedAuctions: async (limit, abortSignal = null) => {
        try {
            const fetchOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            };

            // Thêm AbortSignal nếu được cung cấp
            if (abortSignal) {
                fetchOptions.signal = abortSignal;
            }

            const response = await fetch(`${API_BASE_URL}/api/auction/featured?limit=${limit}`, fetchOptions);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Auction API request was aborted');
                throw error;
            }
            console.error('Error fetching featured auctions:', error);
            throw error;
        }
    },

    // Lấy các auctions mới nhất
    getNewestAuctions: async (limit, abortSignal = null) => {
        try {
            const fetchOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            };

            // Thêm AbortSignal nếu được cung cấp
            if (abortSignal) {
                fetchOptions.signal = abortSignal;
            }

            const response = await fetch(`${API_BASE_URL}/api/auction/newest?limit=${limit}`, fetchOptions);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Auction API request was aborted');
                throw error;
            }
            console.error('Error fetching newest auctions:', error);
            throw error;
        }
    },

    // Lấy danh sách tất cả auctions cho admin
    getAllAuctionsForAdmin: async (page = 1, limit = 10) => {
        try {
            const fetchOptions = {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
            };

            const response = await fetch(`${API_BASE_URL}/admin/auctions?page=${page}&limit=${limit}`, fetchOptions);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Auction API request was aborted');
                throw error;
            }
            console.error('Error fetching all auctions for admin:', error);
            throw error;
        }
    },

    // Lấy danh sách tất cả auctions theo status cho admin
    getAllAuctionsByStatusForAdmin: async (status, page, limit, abortSignal = null) => {
        try {
            const fetchOptions = {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
            };

            // Thêm AbortSignal nếu được cung cấp
            if (abortSignal) {
                fetchOptions.signal = abortSignal;
            }

            const response = await fetch(`${API_BASE_URL}/admin/auctions/status/${status}?page=${page}&limit=${limit}`, fetchOptions);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Auction API request was aborted');
                throw error;
            }
            console.error('Error fetching all auctions by status for admin:', error);
            throw error;
        }
    },

    // Tìm kiếm auction theo UID
    searchAuctionsByUID: async (uid, abortSignal = null) => {
        try {
            const fetchOptions = {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
            };

            // Thêm AbortSignal nếu được cung cấp
            if (abortSignal) {
                fetchOptions.signal = abortSignal;
            }

            const response = await fetch(`${API_BASE_URL}/admin/auctions/search/${uid}`, fetchOptions);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Auction API request was aborted');
                throw error;
            }
            console.error('Error searching auctions by UID:', error);
            throw error;
        }
    },

    // Xóa auction
    deleteAuction: async (auctionId, abortSignal = null) => {
        try {
            const fetchOptions = {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
            };

            // Thêm AbortSignal nếu được cung cấp
            if (abortSignal) {
                fetchOptions.signal = abortSignal;
            }

            const response = await fetch(`${API_BASE_URL}/admin/auctions/${auctionId}`, fetchOptions);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Auction API request was aborted');
                throw error;
            }
            console.error('Error deleting auction:', error);
            throw error;
        }
    }

};

export default auctionApi;