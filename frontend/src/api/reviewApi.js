const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export const reviewApi = {
    // Lấy nhiều đánh giá theo UIDs
    getBatchReviews: async (uids, abortSignal = null) => {
        try {
        if (!uids || !Array.isArray(uids) || uids.length === 0) {
            throw new Error('UIDs array is required and must not be empty');
        }

        const fetchOptions = {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uids }),
        };

        // Thêm AbortSignal nếu được cung cấp
        if (abortSignal) {
            fetchOptions.signal = abortSignal;
        }

        const response = await fetch(`${API_BASE_URL}/api/reviews/review-batch`, fetchOptions);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
        } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Review API request was aborted');
            throw error;
        }
        console.error('Error fetching batch reviews:', error);
        throw error;
        }
    },
};

export default reviewApi;