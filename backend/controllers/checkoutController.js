// src/controllers/checkout.controller.js
const PaypalService = require('../services/paypalService');
const BookingModel = require('../models/bookingModel');
const PaymentMethodModel = require('../models/paymentMethodModel');
const PaymentModel = require('../models/paymentModel.js');

class CheckoutController {
  /**
   * Gộp 2 luồng:
   * - Nếu có methodId -> charge qua vault (S2S), không UI
   * - Nếu không có methodId -> tạo order để FE mở PayPal UI
   */  

  static async getBookingDetails(req, res) {
    const bookingId = req.params.bookingId;
    if(!bookingId) {
      return res.status(400).json({error: 'bookingId is required'});
    }
    try {
      const booking = await BookingModel.findBookingById(bookingId);
      return res.json({ ok: true, data: booking });
    } catch (error) {
      console.error('Error fetching booking:', error);
      return res.status(500).json({error: 'Failed to fetch booking details'});
    }
  };

  static async createOrderPaypal(req, res) {
      try {
        const { bookingId, methodId } = req.body;
        if (!bookingId) return res.status(400).json({ error: 'bookingId required' });

        const booking = await BookingModel.findBookingById(bookingId);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.BookingStatus !== 'pending') {
          return res.status(400).json({ error: 'Invalid booking status' });
        }

        if (booking.BookingStatus === 'confirmed') {
          return res.json({ ok: true, status: 'ALREADY_CONFIRMED' });
        }

        const amount = (req.body?.amount != null)     
        ? Number(req.body.amount)                      // USD từ FE (đã convert)
        : Number(booking.WinningPrice || 0);  
        if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

        // === Nhánh 1: Có methodId -> charge bằng vault (server-to-server) ===
        if (methodId) {
          const pm = await PaymentMethodModel.findById(methodId);
          if (!pm || pm.Provider !== 'PayPal' || !pm.Token) {
            return res.status(400).json({ error: 'Invalid PayPal payment method' });
          }

          // 1) Ghi log initiated
          await PaymentModel.insertInitiated(
            bookingId,
            booking.UserID,
            amount,
            process.env.CURRENCY || 'USD'
          );

          // 2) Tạo + capture bằng vault (không UI)
          const cap = await PaypalService.chargeWithVault(bookingId, amount, pm.Token);

          if (cap.status !== 'COMPLETED' || !cap.captureId) {
            await PaymentModel.updateFailedLatestByBooking(
              bookingId,
              `vault_capture_not_completed:${cap.status || 'unknown'}`
            );
            return res.status(400).json({ ok: false, error: 'Vault charge not completed' });
          }

          // 3) Cập nhật Payments + Booking
          await PaymentModel.updateCapturedByBooking(bookingId, cap.captureId);
          await BookingModel.updateBookingPaid(bookingId, methodId);

          return res.json({ ok: true, flow: 's2s_captured', captureId: cap.captureId });
        }

        // === Nhánh 2: Không có methodId -> tạo order để duyệt trên PayPal UI ===
        // 1) Log initiated trước khi tạo order
        await PaymentModel.insertInitiated(
          booking.BookingID,
          booking.UserID,
          amount,
          process.env.CURRENCY || 'USD'
        );

        // 2) Tạo order (KHÔNG gửi payment_source ở bước create)
        const orderID = await PaypalService.createOrder(bookingId, amount /* saveMethod bỏ qua ở create */);

        const approveUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${orderID}`;

        // FE dùng orderID để mở PayPal; sau approve sẽ gọi /capture
        return res.json({ ok: true, flow: 'approval_required', orderId: orderID, approveUrl });

      } catch (e) {
        const reason = String(e.message || 'start_checkout_error').slice(0, 250);
        if (req?.body?.bookingId) {
          try { await PaymentModel.updateFailedLatestByBooking(req.body.bookingId, reason); } catch {}
        }
        return res.status(500).json({ error: 'start failed' });
      }
    }

    /**
     * Capture sau khi buyer approve (UI flow).
     * Tại đây mới yêu cầu vault (saveMethod=true) để PayPal trả về vaultCustomerId nếu merchant được bật.
     */
    static async captureOrderPaypal(req, res) {
    try {
      const { bookingId, orderID } = req.body;
      if (!bookingId || !orderID) {
        return res.status(400).json({ error: 'bookingId & orderID required' });
      }

      // 0) Kiểm tra booking hợp lệ
      const booking = await BookingModel.findBookingById(bookingId);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });

      // 1) Capture — yêu cầu VAULT tại đây (saveMethod = true)
      const cap = await PaypalService.captureOrder(bookingId, orderID, /* saveMethod */ false);

      console.log('Paypal capture result:', cap);

      // if (cap.status !== 'APPROVED') {
      //   return res.status(400).json({ 
      //     ok: false, 
      //     error: 'Order not approved', 
      //     status: cap.status 
      //   });
      // }

      // 2) Nếu capture chưa hoàn tất => mark failed và trả lỗi
      if (cap.status !== 'COMPLETED' || !cap.captureId) {
        await PaymentModel.updateFailedLatestByBooking(
          bookingId,
          `capture_not_completed:${cap.status || 'unknown'}`
        );
        return res.status(400).json({ ok: false, error: 'Payment not completed' });
      }

      // 3) Lưu PaymentMethod
      //    - Nếu PayPal trả về vaultCustomerId => NHÁNH VAULT (dùng cho lần sau charge S2S không UI)
      //    - Nếu không có => NHÁNH FALLBACK (chỉ lưu để hiển thị trong UI)
      let methodId;
      if (cap.vaultCustomerId) {
        // NHÁNH 1: LƯU VAULT (Token = vaultCustomerId)
        methodId = await PaymentMethodModel.upsertPaypalVaultCustomer(
          booking.UserID,
          cap.vaultCustomerId,
          cap.payerEmail || null
        );
      } else {
        // NHÁNH 2: FALLBACK HIỂN THỊ (Token = payerId — KHÔNG dùng charge S2S)
        methodId = await PaymentMethodModel.upsertDisplayPaypalMethod(
          booking.UserID,
          cap.payerId,
          cap.payerEmail || null
        );
      }

      // 4) Ghi nhận Payment thực tế (captured) theo booking
      await PaymentModel.updateCapturedByBooking(bookingId, cap.captureId);

      // 5) Cập nhật Booking đã thanh toán + gắn PaymentMethodID
      await BookingModel.updateBookingPaid(bookingId, methodId);

      // 6) Trả kết quả
      return res.json({
        ok: true,
        captureId: cap.captureId
        //vaulted: !!cap.vaultCustomerId, // true nếu đã lưu vault thành công
      });

    } catch (e) {
      // Thất bại bất ngờ: ghi nhận "failed" cho bản ghi Payments mới nhất
      const reason = String(e.message || 'capture_error').slice(0, 250);
      if (req?.body?.bookingId) {
        try { await PaymentModel.updateFailedLatestByBooking(req.body.bookingId, reason); } catch {}
      }
      return res.status(500).json({ error: 'capture failed' });
    }
  }

  static async createOrderZaloPay(req, res) {
    try {
      console.log('Creating zalopay order for booking:', req.body.bookingId);
    }
    catch (error) {
      console.error('Error creating ZaloPay order:', error);
    }
  }

  static async captureOrderZaloPay(req,res) {
    try {
      console.log('Capturing zalopay order for booking:', req.body.bookingId);
    }
    catch (error) {
      console.error('Error capturing ZaloPay order:', error);
    }
  }
}

module.exports = CheckoutController;
