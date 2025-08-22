// controllers/bookingController.js
const productModel = require('../models/productModel'); // bạn đã dùng trong calendarController
const bookingModel = require('../models/bookingModel');

class BookingController {
  // POST /api/bookings/place
  async place(req, res) {
    try {
      const { uid, userId, checkin, checkout, nights, unitPrice, currency = 'VND', provider = 'cash', holdMinutes = 30 } = req.body || {};
      if (!uid || !userId || !checkin || !checkout || !unitPrice) {
        return res.status(400).json({ message: 'Thiếu tham số' });
      }
      const productId = await productModel.findProductIdByUID(uid);
      if (!productId) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

      const out = await bookingModel.placeDraft({
        userId, productId, start: checkin, end: checkout,
        nights: nights || Math.max(1, Math.floor((new Date(checkout) - new Date(checkin)) / 86400000)),
        unitPrice, currency, provider, holdMinutes
      });

      return res.json({ ok: true, bookingId: out.bookingId, paymentId: out.paymentId, holdExpiresAt: out.holdExpiresAt });
    } catch (e) {
      console.error('[BookingController.place]', e);
      return res.status(409).json({ ok: false, message: e.message || 'Không thể tạo giữ chỗ/đơn' }); // 409 cho conflict
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
