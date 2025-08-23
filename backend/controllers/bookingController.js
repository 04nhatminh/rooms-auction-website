// controllers/bookingController.js
const productModel = require('../models/productModel'); // bạn đã dùng trong calendarController
const bookingModel = require('../models/bookingModel');

class BookingController {
  async place(req, res) {
    try {
      const {
        uid,
        userId,
        checkin,
        checkout,
        holdMinutes = 30, // default 30'
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
        end: end,
        holdMinutes
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

      // default
      return res.status(409).json({ ok: false, message: 'Không thể tạo giữ chỗ/đơn' });
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
}

module.exports = new BookingController();
