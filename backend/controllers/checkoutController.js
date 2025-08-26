// src/controllers/checkout.controller.js
const PaypalService = require('../services/paypalService');
const ZaloPayService = require('../services/zalopayService');
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

  /**
   * POST /api/payments/zalopay/create
   * body: { bookingId, amount }
   * Tạo đơn trên ZaloPay và tạo "initiated payment" (provider=ZALOPAY)
   */

  // controllers/... createOrderZaloPay
    static async createOrderZaloPay(req, res) {
      try {
        const { bookingId, amount } = req.body;
        if (!bookingId || !amount) return res.status(400).json({ ok:false, error:'Missing bookingId/amount' });

        // 0) Lấy booking để kiểm tra và lấy userId
        const booking = await BookingModel.findBookingById(bookingId);
        if (!booking) return res.status(404).json({ ok:false, error:'Booking not found' });
        if (booking.BookingStatus !== 'pending') {
          return res.status(400).json({ ok:false, error:'Invalid booking status' });
        }

        // 1) Tạo/đọc sẵn method ZaloPay cho user này (idempotent)
        const methodId = await PaymentMethodModel.upsertZaloPayMethod(booking.UserID);

        // 2) Ghi initiated cho đúng provider = ZALOPAY
        // Nếu bạn có hàm này:
        // await PaymentModel.insertInitiatedForProvider(bookingId, booking.UserID, amount, 'VND', 'ZALOPAY');
        // Nếu chưa có, sửa insertInitiated để nhận thêm provider; tạm thời:
        await PaymentModel.insertInitiated(bookingId, booking.UserID, amount, 'VND');

        // 3) Tạo đơn trên ZaloPay
        const returnUrl = `${BASE_URL}/checkout/return/zalopay`;
        const callbackUrl = `${BACKEND_URL}/api/webhooks/zalopay`;

        const zaloOrder = await ZaloPayService.createOrder({
          bookingId,
          amount,
          description: `Payment for booking #${bookingId}`,
          returnUrl,
          callbackUrl,
          // lồng methodId để tham khảo khi cần
          // service sẽ JSON.stringify embed_data, ở đó có {redirecturl, bookingId, methodId}
          methodId
        });

        return res.json({ ok:true, zalo: zaloOrder });
      } catch (err) {
        console.error('[ZaloPayController] createOrder error:', err.message);
        try { await PaymentModel.updateFailedLatestByBooking(req.body?.bookingId, err.message); } catch {}
        return res.status(500).json({ ok:false, error:'Cannot create ZaloPay order' });
      }
    }


  /**
   * GET /api/payments/zalopay/return
   * ZaloPay redirect về sau khi user thanh toán (client-side có thể gọi để confirm)
   * ZaloPay thường trả về app_trans_id, status…
   */
  static async handleReturnZaloPay(req, res) {
    try {
      const { app_trans_id, status } = req.query || {};
      const bookingId = app_trans_id?.split('_')?.[1]; // embed bookingId vào app_trans_id: yymmdd_<bookingId>_<rand>

      if (!bookingId) return res.redirect(`${BASE_URL}/checkout?error=invalid_return`);

      if (status === '1' || status === 'success') {
        // Trường hợp này chỉ là trang return cho user, kết quả cuối cùng vẫn trông vào webhook.
        return res.redirect(`${BASE_URL}/checkout?result=processing&booking=${bookingId}`);
      }
      return res.redirect(`${BASE_URL}/checkout?result=cancelled&booking=${bookingId}`);
    } catch (err) {
      return res.redirect(`${BASE_URL}/checkout?result=error`);
    }
  }

  /**
   * POST /api/webhooks/zalopay
   * Webhook do ZaloPay gọi -> xác nhận thanh toán thành công/thất bại
   */
  static async webhookZaloPay(req, res) {
    try {
      const { verified, data } = ZaloPayService.verifyCallback(req.body);
      if (!verified) return res.json({ return_code: -1, return_message: 'mac not matched' });

      const bookingId = data?.app_trans_id?.split('_')?.[1];
      const captureId = data?.zp_trans_id;
      const success = Number(data?.return_code) === 1 || data?.is_success === true;

      if (!bookingId) return res.json({ return_code: 2, return_message: 'booking not found in app_trans_id' });

      const booking = await BookingModel.findBookingById(bookingId);
      if (!booking) return res.json({ return_code: 2, return_message: 'booking not found' });

      if (success) {
        // Đánh dấu payment đã trả cho provider ZALOPAY (idempotent theo captureId)
        await PaymentModel.updateCapturedByBooking(bookingId, captureId);

        // Upsert / lấy method ZaloPay cho user này
        const methodId = await PaymentMethodModel.upsertZaloPayMethod(booking.UserID);

        // Xác nhận booking, gắn methodId
        await BookingModel.updateBookingPaid(bookingId, methodId);

        return res.json({ return_code: 1, return_message: 'success' });
      } else {
        await PaymentModel.updateFailedLatestByBooking(bookingId, data?.return_message || 'ZP_failed');
        return res.json({ return_code: 1, return_message: 'fail-noted' });
      }
    } catch (err) {
      console.error('[ZaloPay webhook] error:', err);
      return res.json({ return_code: 0, return_message: 'server error' });
    }
  }
}

module.exports = CheckoutController;
