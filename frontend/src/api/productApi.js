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

    // Tạo sản phẩm mới (Admin)
    createProduct: async (productData, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/room/admin/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    },

    // Lấy danh sách sản phẩm (Admin)
    getProducts: async (page = 1, limit = 10, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/room/admin/list?page=${page}&limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    },

    // Tìm kiếm sản phẩm theo UID (Admin)
    searchProductsByUID: async (uid, page = 1, limit = 10, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/room/admin/search?uid=${uid}&page=${page}&limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error searching products by UID:', error);
            throw error;
        }
    },

    // Cập nhật sản phẩm (Admin)
    updateProduct: async (productId, productData, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/room/admin/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    },

    // Xóa sản phẩm (Admin)
    deleteProduct: async (productId, token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/room/admin/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    },

    // Lấy danh sách loại bất động sản
    getPropertyTypes: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/room/properties/types`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching property types:', error);
            throw error;
        }
    },

    // Lấy danh sách loại phòng
    getRoomTypes: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/room/room-types`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching room types:', error);
            throw error;
        }
    },

    // Lấy danh sách amenity groups
    getAmenityGroups: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/room/amenity-groups`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching amenity groups:', error);
            throw error;
        }
    },

    // Lấy danh sách amenities
    getAmenities: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/room/amenities`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching amenities:', error);
            throw error;
        }
    },
};

export default productApi;