const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export const auctionApi = {
    // Lấy auction theo province và status
    getAuctionsByProvinceStatus: async (provinceCode, status, limit, abortSignal = null) => {
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
                    'Content-Type': 'application/json',
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
                    'Content-Type': 'application/json',
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

    previewCreate: async ({ productUid, checkin, checkout }) => {
        const r = await fetch(`${API_BASE_URL}/api/auction/preview`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productUid, checkin, checkout }),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.message || 'Không preview được phiên đấu giá');
        return data;
    },

    createAuction: async ({ productUid, userId, checkin, checkout }) => {
        const r = await fetch(`${API_BASE_URL}/api/auction/create`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productUid, userId, checkin, checkout }),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.message || 'Tạo phiên đấu giá thất bại');
        return data;
    },

    getByUid: async (auctionUid, abortSignal = null) => {
        const opts = { method: 'GET', headers: { 'Content-Type':'application/json' } };
        if (abortSignal) opts.signal = abortSignal;
        try {
            const r = await fetch(`${API_BASE_URL}/api/auction/by-uid/${auctionUid}`, opts);
            const data = await r.json().catch(()=> ({}));
            if (!r.ok) throw new Error(data.message || 'Không tải được phiên đấu giá');
            return data; // { success:true, data:{ auction, room, fullHistory } }
        } catch (err) {
            // Bỏ qua AbortError
            if (err.name === 'AbortError') {
                throw err;
            }
            throw err;
        }
    },

    bid: async (auctionUid, { userId, amount, checkin, checkout }) => {
        const r = await fetch(`${API_BASE_URL}/api/auction/${auctionUid}/bid`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, amount, checkin, checkout }),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.message || 'Đặt giá thất bại');
        return data;
    },

    // Kết thúc phiên đấu giá
    endAuction: async (auctionUid) => {
        const r = await fetch(`${API_BASE_URL}/api/auction/${auctionUid}/end`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.message || 'Không thể kết thúc phiên');
        return data;
    },
};

export default auctionApi;