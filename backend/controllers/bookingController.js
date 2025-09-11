// controllers/bookingController.js
const productModel = require('../models/productModel');
const bookingModel = require('../models/bookingModel');

class BookingController {
  async place(req, res) {
    try {
      const {
        uid,
        userId,
        checkin,
        checkout,
      } = req.body || {};

      // 1) Validate input tối thiểu
      if (!uid || !userId || !checkin || !checkout) {
        return res.status(400).json({ ok: false, message: 'Thiếu tham số' });
      }

      const start = new Date(checkin);
      const end   = new Date(checkout);
      if (isNaN(start) || isNaN(end)) {
        return res.status(400).json({ ok: false, message: 'Ngày không hợp lệ' });
      }
      if (end <= start) {
        return res.status(400).json({ ok: false, message: 'checkout phải lớn hơn checkin' });
      }

      // 2) Tìm ProductID từ UID
      const productId = await productModel.findProductIdByUID(uid);
      if (!productId) {
        return res.status(404).json({ ok: false, message: 'Không tìm thấy sản phẩm' });
      }

      // 3) Gọi model.placeDraft theo SP mới
      const out = await bookingModel.placeDraft({
        userId,
        productId,
        start: start,
        end: end
      });

      // 4) Trả về kết quả
      return res.json({
        ok: true,
        bookingId: out.bookingId,
        holdExpiresAt: out.holdExpiresAt
      });

    } catch (e) {
      console.error('[BookingController.place]', e);

      // Map 1 số lỗi thường gặp từ SP -> HTTP code phù hợp
      const msg = e?.message || '';
      if (msg.includes('Date range not available')) {
        return res.status(409).json({ ok: false, message: 'Khoảng ngày đã bị giữ/chặn hoặc trùng lịch' });
      }
      if (msg.includes('Cannot obtain product lock')) {
        // 423 Locked cho lock contention
        return res.status(423).json({ ok: false, message: 'Tài nguyên đang được xử lý, vui lòng thử lại' });
      }
      if (msg.includes('Reserved days mismatch')) {
        return res.status(409).json({ ok: false, message: 'Xung đột dữ liệu lịch, vui lòng thử lại' });
      }
      if (msg.includes('End>Start required')) {
        return res.status(400).json({ ok: false, message: 'checkout phải lớn hơn checkin' });
      }
      if (msg.includes('User account is locked')) {
        return res.status(423).json({ ok: false, message: 'Tài khoản người dùng hiện đang bị khóa' });
      }

      // default
      return res.status(409).json({ ok: false, message: 'Không thể tạo giữ chỗ/đơn' });
    }
  }

  async getUserTransactionHistory(req, res) {
      try {
          const userId = req.user.id;
          const items = await bookingModel.getUserTransactionHistory(userId);
          res.json({ success: true, items });
      } catch (e) {
          res.status(500).json({ success: false, message: e.message });
      }
  }

  // POST /api/payments/confirm
//   async confirmPayment(req, res) {
//     try {
//       const { uid, bookingId, providerTxn } = req.body || {};
//       if (!uid || !bookingId) return res.status(400).json({ message: 'Thiếu tham số' });

//       const productId = await productModel.findProductIdByUID(uid);
//       if (!productId) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

//       await bookingModel.confirmPaymentSuccess({ productId, bookingId, providerTxn });
//       return res.json({ ok: true });
//     } catch (e) {
//       console.error('[BookingController.confirmPayment]', e);
//       return res.status(409).json({ ok: false, message: e.message || 'Xác nhận thanh toán thất bại' });
//     }
//   }

  // POST /api/payments/fail
//   async paymentFail(req, res) {
//     try {
//       const { uid, bookingId, note } = req.body || {};
//       if (!uid || !bookingId) return res.status(400).json({ message: 'Thiếu tham số' });

//       const productId = await productModel.findProductIdByUID(uid);
//       if (!productId) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

//       await bookingModel.paymentFailedOrExpired({ productId, bookingId, note });
//       return res.json({ ok: true });
//     } catch (e) {
//       console.error('[BookingController.paymentFail]', e);
//       return res.status(409).json({ ok: false, message: e.message || 'Xử lý thất bại/thời hạn hết hiệu lực lỗi' });
//     }
//   }

  // ADMIN APIs

  // GET /admin/bookings - Lấy tất cả bookings cho admin
  async getAllBookingsForAdmin(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const bookings = await bookingModel.getAllBookingsForAdmin(offset, limit);
      const totalCount = await bookingModel.getTotalBookingsCount();
      
      return res.json({
        success: true,
        data: {
          items: bookings,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error('Error in getAllBookingsForAdmin:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // GET /admin/bookings/status/:status - Lấy bookings theo status
  async getBookingsByStatusForAdmin(req, res) {
    try {
      const { status } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const bookings = await bookingModel.getBookingsByStatusForAdmin(status, offset, limit);
      const totalCount = await bookingModel.getTotalBookingsCountByStatus(status);
      
      return res.json({
        success: true,
        data: {
          items: bookings,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error('Error in getBookingsByStatusForAdmin:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // GET /admin/bookings/search/:bookingId - Tìm kiếm booking theo ID
  async searchBookingsByIdForAdmin(req, res) {
    try {
      const { bookingId } = req.params;
      
      const bookings = await bookingModel.searchBookingsByIdForAdmin(bookingId);
      
      return res.json({
        success: true,
        data: {
          items: bookings,
          currentPage: 1,
          totalPages: 1,
          totalItems: bookings.length,
          itemsPerPage: bookings.length
        }
      });
    } catch (error) {
      console.error('Error in searchBookingsByIdForAdmin:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // GET /admin/bookings/:bookingId - Lấy chi tiết booking
  async getBookingDetailsForAdmin(req, res) {
    try {
      const { bookingId } = req.params;
      
      const booking = await bookingModel.getBookingDetailsForAdmin(bookingId);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      
      return res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      console.error('Error in getBookingDetailsForAdmin:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // PUT /admin/bookings/:bookingId - Cập nhật booking
  async updateBookingForAdmin(req, res) {
    try {
      const { bookingId } = req.params;
      // body: JSON.stringify({ BookingStatus: updateStatus })
      const updateStatus = req.body.BookingStatus;

      const result = await bookingModel.updateBookingForAdmin(bookingId, updateStatus);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      
      return res.json({
        success: true,
        message: 'Booking updated successfully'
      });
    } catch (error) {
      console.error('Error in updateBookingForAdmin:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new BookingController();
