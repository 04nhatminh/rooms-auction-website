// services/zaloPayService.js
const crypto = require('crypto');
const axios = require('axios');

class ZaloPayService {
  constructor() {
    this.appId = process.env.ZP_APP_ID;
    this.key1 = process.env.ZP_KEY1; // ký "mac" cho create order
    this.key2 = process.env.ZP_KEY2; // verify webhook
    this.endpointCreate = process.env.ZP_ENDPOINT_CREATE || 'https://sb-openapi.zalopay.vn/v2/create';

    if (!this.appId || !this.key1 || !this.key2) {
      console.warn('[ZaloPay] Missing env: ZP_APP_ID/ZP_KEY1/ZP_KEY2');
    }
  }

  /**
   * Tạo đơn ZaloPay (sandbox)
   * @param {Object} payload { bookingId, amount, description, returnUrl, callbackUrl }
   * @returns {Object} { order_url, zp_trans_token, app_trans_id, ... }
   */
  async createOrder({ bookingId, amount, description, returnUrl, callbackUrl }) {
    // app_trans_id định dạng yymmdd_xxxx (unique trong ngày)
    const date = new Date();
    const yymmdd = date.toISOString().slice(2,10).replace(/-/g,'');
    const rand = Math.floor(Math.random() * 100000);
    const app_trans_id = `${yymmdd}_${bookingId}_${rand}`;

    // data bắt buộc của ZaloPay
    const order = {
      app_id: Number(this.appId),
      app_trans_id,
      app_user: `user_booking_${bookingId}`,
      app_time: Date.now(),
      amount: Number(amount),
      item: JSON.stringify([{ bookingId, amount }]),
      description: description || `Payment for booking #${bookingId}`,
      bank_code: '',
      embed_data: JSON.stringify({
        redirecturl: returnUrl,  // nơi ZaloPay redirect user sau khi thanh toán
        bookingId
      }),
      callback_url: callbackUrl   // webhook server nhận kết quả
    };

    // Chuỗi raw data để ký mac = key1
    // Thứ tự trường: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
    const rawData = [
      order.app_id,
      order.app_trans_id,
      order.app_user,
      order.amount,
      order.app_time,
      order.embed_data,
      order.item
    ].join('|');

    const mac = crypto.createHmac('sha256', this.key1).update(rawData).digest('hex');

    try {
      const res = await axios.post(this.endpointCreate, { ...order, mac }, {
        headers: { 'Content-Type': 'application/json' }
      });

      // Trả về order_url để FE mở popup
      return res.data; // gồm: order_url, zp_trans_token, return_message...
    } catch (err) {
      console.error('[ZaloPay] createOrder error:', err?.response?.data || err.message);
      throw err;
    }
  }

  /**
   * Verify webhook (ZaloPay server -> callback_url)
   * ZaloPay cung cấp data + mac. Ta phải verify bằng key2.
   * @param {Object} body
   * @returns {Object} { verified: boolean, data: object }
   */
  verifyCallback(body) {
    // body có: data (json string), mac (hex)
    const { data, mac } = body || {};
    if (!data || !mac) return { verified: false };

    const calcMac = crypto.createHmac('sha256', this.key2).update(data).digest('hex');
    return {
      verified: mac === calcMac,
      data: mac === calcMac ? JSON.parse(data) : null
    };
  }
}

module.exports = new ZaloPayService();
