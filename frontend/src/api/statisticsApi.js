const API_BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Helper function để gọi API với authentication
const apiCall = async (url, options = {}) => {
    const fetchOptions = {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
    };

    const response = await fetch(`${API_BASE_URL}${url}`, fetchOptions);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
};

// API functions cho admin statistics
export const statisticsApi = {
    // Lấy thống kê tổng quan dashboard
    getDashboardStats: async () => {
        return apiCall('/admin/dashboard/stats');
    },

    // Lấy thống kê doanh thu theo thời gian
    getRevenueStats: async (period = 'month', year = new Date().getFullYear()) => {
        return apiCall(`/admin/dashboard/revenue?period=${period}&year=${year}`);
    },

    // Lấy thống kê khách hàng
    getCustomerStats: async () => {
        return apiCall('/admin/dashboard/customers');
    },

    // Lấy thống kê sản phẩm
    getProductStats: async () => {
        return apiCall('/admin/dashboard/products');
    },

    // Lấy thống kê booking theo thời gian
    getBookingStats: async (period = 'month', year = new Date().getFullYear()) => {
        return apiCall(`/admin/dashboard/bookings?period=${period}&year=${year}`);
    },

    // Lấy thống kê bids theo thời gian
    getBidsStats: async (period = 'month', year = new Date().getFullYear()) => {
        return apiCall(`/admin/dashboard/bids?period=${period}&year=${year}`);
    },

    // Lấy tất cả thống kê cùng lúc
    getAllStats: async () => {
        try {
            const [dashboard, customers, products] = await Promise.all([
                statisticsApi.getDashboardStats(),
                statisticsApi.getCustomerStats(),
                statisticsApi.getProductStats()
            ]);

            return {
                success: true,
                data: {
                    dashboard: dashboard.data,
                    customers: customers.data,
                    products: products.data
                }
            };
        } catch (error) {
            console.error('Error fetching all stats:', error);
            throw error;
        }
    }
};

export default statisticsApi;
