const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export const calendarApi = {
    checkAvailability: async (uid, { checkin, checkout, userId }, abortSignal = null) => {
        try {
            const fetchOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            };
            if (abortSignal) fetchOptions.signal = abortSignal;

            // Giữ nguyên route backend bạn đang có (/calendar/check)
            const url = `${API_BASE_URL}/calendar/check?uid=${encodeURIComponent(uid)}&checkin=${checkin}&checkout=${checkout}${userId ? `&userId=${userId}` : ''}`;

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

export default calendarApi;