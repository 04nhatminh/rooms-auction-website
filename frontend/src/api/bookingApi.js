const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export const bookingApi = {
  place: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/booking/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success === false || data?.ok === false) {
      const err = new Error(data?.message || 'Đặt chỗ thất bại');
      err.status = res.status;           // ví dụ: 409
      err.rawMessage = data?.message;    // giữ lại message gốc của BE
      throw err;
    }
    return data; // { ok, bookingId, holdExpiresAt }
  },
  
  buyNow: async ({ uid, userId, checkin, checkout }) => {
    const r = await fetch(`${API_BASE_URL}/api/booking/buy-now`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, userId, checkin, checkout }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.message || 'Thuê ngay thất bại');
    // kỳ vọng: { success:true, bookingId, holdExpiresAt? }
    return data;
  },

  // ADMIN APIs

  // Lấy danh sách tất cả bookings cho admin
  getAllBookingsForAdmin: async (page = 1, limit = 10) => {
    try {
      const fetchOptions = {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
      };

      const response = await fetch(`${API_BASE_URL}/admin/bookings?page=${page}&limit=${limit}`, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Booking API request was aborted');
        throw error;
      }
      console.error('Error fetching all bookings for admin:', error);
      throw error;
    }
  },

  // Lấy danh sách bookings theo status cho admin
  getAllBookingsByStatusForAdmin: async (status, page, limit, abortSignal = null) => {
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

      const response = await fetch(`${API_BASE_URL}/admin/bookings/status/${status}?page=${page}&limit=${limit}`, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Booking API request was aborted');
        throw error;
      }
      console.error('Error fetching all bookings by status for admin:', error);
      throw error;
    }
  },

  // Tìm kiếm booking theo ID
  searchBookingsByIdForAdmin: async (bookingId, abortSignal = null) => {
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

      const response = await fetch(`${API_BASE_URL}/admin/bookings/search/${bookingId}`, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Booking API request was aborted');
        throw error;
      }
      console.error('Error searching bookings by ID:', error);
      throw error;
    }
  },

  // Lấy chi tiết booking
  getBookingDetailsForAdmin: async (bookingId, abortSignal = null) => {
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

      const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}`, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Booking API request was aborted');
        throw error;
      }
      console.error('Error fetching booking details:', error);
      throw error;
    }
  },

  // Cập nhật booking
  updateBookingForAdmin: async (bookingId, updateData, abortSignal = null) => {
    try {
      const fetchOptions = {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      };

      // Thêm AbortSignal nếu được cung cấp
      if (abortSignal) {
        fetchOptions.signal = abortSignal;
      }

      const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}`, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Booking API request was aborted');
        throw error;
      }
      console.error('Error updating booking:', error);
      throw error;
    }
  }
};

export default bookingApi;
