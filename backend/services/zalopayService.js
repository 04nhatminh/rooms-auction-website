// services/zaloPayService.js
const crypto = require('crypto');
const axios = require('axios');
const QUERY_EP = (process.env.ZP_ENDPOINT_QUERY || 'https://sb-openapi.zalopay.vn/v2/query').trim();


class ZaloPayService {
  constructor() {
    this.appId = (process.env.ZP_APP_ID || '').trim();
    this.key1  = (process.env.ZP_KEY1  || '').trim();
    this.key2  = (process.env.ZP_KEY2  || '').trim();

    // Endpoint sandbox mặc định (có trim + fallback)
    const ep = (process.env.ZP_ENDPOINT_CREATE || 'https://sb-openapi.zalopay.vn/v2/create').trim();
    try { new URL(ep); this.endpointCreate = ep; }
    catch {
      console.warn('[ZaloPay] Bad ZP_ENDPOINT_CREATE. Fallback sandbox /v2/create');
      this.endpointCreate = 'https://sb-openapi.zalopay.vn/v2/create';
    }

    if (!this.appId || !this.key1 || !this.key2) {
      console.warn('[ZaloPay] Missing env: ZP_APP_ID / ZP_KEY1 / ZP_KEY2');
    }
  }

  /**
   * Tạo đơn ZaloPay (sandbox)
   * @param {Object} payload
   *  - bookingId, amount, description, returnUrl, callbackUrl
   *  - userId?, methodId?
   * @returns {Promise<Object>} { order_url, zp_trans_token, app_trans_id, ... }
   */
  async createOrder({ bookingId, amount, description, returnUrl, callbackUrl, userId, methodId }) {
    if (!bookingId) throw new Error('Missing bookingId');
    if (!(amount > 0)) throw new Error('Invalid amount');

    const app_trans_id = this._buildAppTransId(bookingId);
    const app_time     = Date.now();
    const app_user     = String(userId ?? bookingId);

    const embed_data = JSON.stringify({
      redirecturl: returnUrl,   // nơi ZaloPay redirect user (trang FE return)
      bookingId,
      methodId,
    });

    // Món hàng tối giản; bạn có thể thay đổi tuỳ ý
    const item = JSON.stringify([{ bookingId, amount }]);

    // Validate required fields
    if (!this.appId || !this.key1) {
      throw new Error('ZaloPay configuration incomplete: missing app_id or key1');
    }

    // Ensure amount is an integer (VND doesn't have decimal places)
    const amountInt = Math.round(Number(amount));

    // Theo spec ZP: dữ liệu ký = app_id|app_trans_id|app_user|amount|app_time|embed_data|item
    const dataToSign = [
      this.appId,           // Keep as string to avoid number parsing issues
      app_trans_id,
      app_user,
      amountInt,
      app_time,
      embed_data,
      item,
    ].join('|');

    const mac = crypto.createHmac('sha256', this.key1).update(dataToSign).digest('hex');

    const body = {
      app_id: parseInt(this.appId),
      app_trans_id,
      app_time,
      amount: amountInt,
      app_user,
      description: description || `Payment for booking #${bookingId}`,
      embed_data,
      item,
      bank_code: '',            // optional
      callback_url: callbackUrl,// 🔴 webhook top-level (bắt buộc nếu muốn ZP bắn)
      mac,
    };

    // Ghi log để tự kiểm callback_url & endpoint
    console.log('[ZP endpoint] =', JSON.stringify(this.endpointCreate));
    console.log('[ZP request] body =', { ...body, mac: '<hidden>' });
    console.log('[ZP debug] dataToSign =', dataToSign);
    console.log('[ZP debug] mac length =', mac.length);

    // Validate critical fields before sending
    if (!body.app_id || !body.app_trans_id || !body.callback_url) {
      throw new Error('Missing required fields for ZaloPay API');
    }

    if (body.amount <= 0 || !Number.isInteger(body.amount)) {
      throw new Error('Amount must be a positive integer');
    }

    const { data } = await axios.post(this.endpointCreate, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    console.log('[ZP createOrder] response:', data);

    // Check for error response
    if (data.return_code !== 1) {
      console.error('[ZP createOrder] Error response:', {
        return_code: data.return_code,
        return_message: data.return_message,
        sub_return_code: data.sub_return_code,
        sub_return_message: data.sub_return_message
      });
      
      // Provide more specific error information
      let errorMsg = data.return_message || 'ZaloPay order creation failed';
      if (data.sub_return_code === -401) {
        errorMsg = 'Invalid request data - check amount, app_id, or MAC signature';
      }
      throw new Error(`ZaloPay API Error: ${errorMsg}`);
    }

    // Thường có: order_url, zp_trans_token, return_code, return_message...
    return data;
  }

  /**
   * Verify webhook (server ZP -> callback_url)
   * ZP gửi { data: "<json-string>", mac: "<hex>" } (thường form-urlencoded)
   * @param {Object} body
   * @returns {{ verified: boolean, data: object|null }}
   */
    verifyCallback(body) {
    const incomingData = body?.data;
    const incomingMac  = String(body?.mac || '');

    if (!incomingData || !incomingMac) return { verified: false, data: null };

    // GIỮ NGUYÊN CHUỖI data như ZP gửi
    const dataStr = (typeof incomingData === 'string') ? incomingData : JSON.stringify(incomingData);

    // TRIM key2 để loại bỏ \r/space
    const key2 = (this.key2 || '').trim();

    const calcMac = crypto.createHmac('sha256', key2).update(dataStr).digest('hex');
    const ok = incomingMac.toLowerCase() === calcMac.toLowerCase();

    // Debug khi lệch MAC
    if (!ok) {
      try {
        const parsed = JSON.parse(dataStr);
        console.warn('[ZP webhook][MAC MISMATCH]', {
          mac_from_zp: incomingMac,
          mac_calc: calcMac,
          key2_length: key2.length,
          app_id_in_data: parsed?.app_id,
          app_id_env: Number(this.appId)
        });
      } catch {}
    }

    return { verified: ok, data: ok ? JSON.parse(dataStr) : null };
  }

  async queryOrder(appTransId) {
    if (!appTransId) throw new Error('Missing app_trans_id');
    const app_id = Number(this.appId);
    const dataToSign = [app_id, appTransId, this.key1].join('|');   // spec: app_id|app_trans_id|key1
    const mac = crypto.createHmac('sha256', this.key1).update(dataToSign).digest('hex');
    const { data } = await axios.post(QUERY_EP, { app_id, app_trans_id: appTransId, mac }, {
      headers: { 'Content-Type': 'application/json' }, timeout: 10000
    });
    return data; // có return_code (1=thành công), zp_trans_id, ...
  }


  _buildAppTransId(bookingId) {
    const d = new Date();
    const year = String(d.getFullYear()).slice(-2);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const yymmdd = year + month + day;
    
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    const result = `${yymmdd}_${bookingId}_${rand}`;
    
    console.log('[ZP _buildAppTransId] date parts:', { year, month, day, yymmdd });
    console.log('[ZP _buildAppTransId] result:', result);
    
    return result;
  }
}

module.exports = new ZaloPayService();
