const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export const searchApi = {
    // Tìm kiếm phòng với các tham số filter, pagination
    searchRooms: async (params = {}, abortSignal = null) => {
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

            // Tạo URL parameters từ object params
            const searchParams = new URLSearchParams();
            
            // Thêm các parameters từ params object
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                    // Nếu là array, chuyển thành string với dấu phay
                    if (Array.isArray(params[key])) {
                        if (params[key].length > 0) {
                            searchParams.append(key, params[key].join(','));
                        }
                    } else {
                        searchParams.append(key, params[key]);
                    }
                }
            });

            const response = await fetch(`${API_BASE_URL}/api/search/rooms?${searchParams.toString()}`, fetchOptions);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Search API request was aborted');
                throw error;
            }
            console.error('Error searching rooms:', error);
            throw error;
        }
    },

    // Tìm kiếm auctions với các tham số filter, pagination
    searchAuctions: async (params = {}, abortSignal = null) => {
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

            // Tạo URL parameters từ object params
            const searchParams = new URLSearchParams();
            
            // Thêm các parameters từ params object
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                    // Nếu là array, chuyển thành string với dấu phay
                    if (Array.isArray(params[key])) {
                        if (params[key].length > 0) {
                            searchParams.append(key, params[key].join(','));
                        }
                    } else {
                        searchParams.append(key, params[key]);
                    }
                }
            });

            const response = await fetch(`${API_BASE_URL}/api/search/auctions?${searchParams.toString()}`, fetchOptions);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Search auctions API request was aborted');
                throw error;
            }
            console.error('Error searching auctions:', error);
            throw error;
        }
    },

    // Helper method để build search parameters từ URL params và filters
    buildSearchParams: (urlParams, filters = {}, pagination = {}) => {
        const params = {};

        // Lấy thông tin từ URL search params
        const locationId = urlParams.get('locationId');
        const type = (urlParams.get('type') || '').toLowerCase();
        
        // Xác định province/district dựa trên type và locationId
        if (locationId && locationId !== 'None') {
            if (type === 'district') {
                params.district = locationId;
            } else {
                // Mặc định coi là province
                params.province = locationId;
            }
        }

        // Thông tin ngày check-in/check-out
        const checkinStr = urlParams.get('checkinDate');
        const checkoutStr = urlParams.get('checkoutDate');
        if (checkinStr && checkinStr !== 'None') {
            params.checkin = checkinStr;
        }
        if (checkoutStr && checkoutStr !== 'None') {
            params.checkout = checkoutStr;
        }

        // Số lượng khách
        const numAdults = parseInt(urlParams.get('numAdults') || 0);
        const numChildren = parseInt(urlParams.get('numChildren') || 0);
        const totalGuests = numAdults + numChildren;
        if (totalGuests > 0) {
            params.guests = totalGuests;
        }

        // Thêm filters từ Filtering component
        if (filters.priceRange) {
            if (filters.priceRange.min !== undefined && filters.priceRange.min > 0) {
                params.price_min = filters.priceRange.min;
            }
            if (filters.priceRange.max !== undefined && filters.priceRange.max < 10000000) {
                params.price_max = filters.priceRange.max;
            }
        }

        // Room types mapping từ ID sang tên
        if (filters.accommodationTypes && filters.accommodationTypes.length > 0) {
            // filters.accommodationTypes đã chứa ID (1,2,3,4,5,6,7)
            // nên chỉ cần truyền trực tiếp
            params.room_types = filters.accommodationTypes;
        }

        if (filters.rating) {
            params.rating = filters.rating;
        }

        // Sort handling từ sort mới (gộp popularity và price sort)
        if (filters.sort) {
            params.sort = filters.sort;
        }

        // Thêm pagination
        if (pagination.page) {
            params.page = pagination.page;
        }
        if (pagination.limit) {
            params.limit = pagination.limit;
        }

        return params;
    },

    // Helper method để build auction search parameters
    buildAuctionSearchParams: (urlParams, filters = {}, pagination = {}) => {
        const params = {};

        // Lấy thông tin từ URL search params
        const locationId = urlParams.get('locationId');
        const type = (urlParams.get('type') || '').toLowerCase();
        
        // Xác định province/district dựa trên type và locationId
        if (locationId && locationId !== 'None') {
            if (type === 'district') {
                params.district = locationId;
            } else {
                // Mặc định coi là province
                params.province = locationId;
            }
        }

        // Status mặc định là active
        params.status = 'active';

        // Thêm filters từ Filtering component
        if (filters.priceRange) {
            if (filters.priceRange.min !== undefined && filters.priceRange.min > 0) {
                params.price_min = filters.priceRange.min;
            }
            if (filters.priceRange.max !== undefined && filters.priceRange.max < 10000000) {
                params.price_max = filters.priceRange.max;
            }
        }

        // Room types mapping từ ID sang tên (tương tự như rooms)
        if (filters.accommodationTypes && filters.accommodationTypes.length > 0) {
            // filters.accommodationTypes đã chứa ID (1,2,3,4,5,6,7)
            // nên chỉ cần truyền trực tiếp
            params.room_types = filters.accommodationTypes;
        }

        if (filters.rating) {
            params.rating = filters.rating;
        }

        // Auction types từ filters
        if (filters.auctionTypes) {
            params.auction_types = filters.auctionTypes;
        }

        // Sort handling từ sort mới (gộp popularity và price sort)
        if (filters.sort) {
            params.sort = filters.sort;
        }

        // Thêm pagination
        if (pagination.page) {
            params.page = pagination.page;
        }
        if (pagination.limit) {
            params.limit = pagination.limit;
        }

        return params;
    }
};

export default searchApi;
