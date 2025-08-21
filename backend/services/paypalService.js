const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
class PaypalService {
  constructor() {
    this.base = process.env.PAYPAL_BASE || 'https://api-m.sandbox.paypal.com';
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.secret = process.env.PAYPAL_SECRET;
    this.currency = process.env.CURRENCY || 'USD';
  }

  async getAccessToken() {
    const auth = Buffer.from(`${this.clientId}:${this.secret}`).toString('base64');
    const res = await fetch(`${this.base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error_description || this._err(json, 'paypal oauth failed'));
    return json.access_token;
  }

  /**
   * Tạo order cho flow UI (redirect / JS SDK). KHÔNG gửi payment_source ở bước này.
   * Nếu muốn vault, hãy bật ở bước capture (xem captureOrder).
   */
  async createOrder(bookingId, amount, /* saveMethod */ _saveMethod = false) {
    const access = await this.getAccessToken();

    const payload = {
      intent: 'CAPTURE',
      application_context: {
        return_url: `${API_BASE_URL}/checkout/paypal/return?bookingId=${bookingId}`,
        cancel_url: `${API_BASE_URL}/`
      },
      purchase_units: [{
        reference_id: String(bookingId),
        amount: {
          currency_code: this.currency,
          value: Number(amount).toFixed(2),
        },
      }],
    };

    const res = await fetch(`${this.base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `create-${bookingId}-${Date.now()}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(this._err(json, 'create order failed'));
    return json.id; // orderID
  }

  /**
   * Capture order. Nếu saveMethod = true, yêu cầu PayPal lưu phương thức (vault ON_SUCCESS).
   * Trả về vaultCustomerId (nếu merchant được bật Vault/Reference Transactions).
   */
  async captureOrder(bookingId, orderID, saveMethod = false) {
    const access = await this.getAccessToken();

    const body = saveMethod
      ? {
          payment_source: {
            paypal: {
              attributes: {
                vault: { store_in_vault: 'ON_SUCCESS',
                usage_type: 'MERCHANT'
                },
                // Có thể thêm các thuộc tính khác nếu tài khoản yêu cầu
                // customer_type: 'CONSUMER'
              },
            },
          },
        }
      : undefined;

    const res = await fetch(`${this.base}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `capture-${bookingId}-${Date.now()}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) {
      console.error('PayPal capture error:', JSON.stringify(json, null, 2));
      throw new Error(this._err(json, 'capture order failed'));
    }
      

    const pu = json?.purchase_units?.[0];
    const capture = pu?.payments?.captures?.[0] || null;

    // Nếu merchant được bật Vault, PayPal có thể trả về id khách hàng vault
    const vaultCustomerId = json?.payment_source?.paypal?.customer?.id || null;

    return {
      status: json?.status,
      orderID,
      captureId: capture?.id || null,
      amount: capture?.amount?.value ? Number(capture.amount.value) : null,
      currency: capture?.amount?.currency_code || this.currency,
      payerId: json?.payer?.payer_id || null,
      payerEmail: json?.payer?.email_address || null,
      vaultCustomerId, // lưu vào PaymentMethods.Token cho lần charge S2S sau
      raw: json,
    };
  }

  /**
   * Tạo order cho S2S (không UI) với vault customer id đã lưu.
   */
  async createOrderWithVaultCustomer(bookingId, amount, vaultCustomerId) {
    const access = await this.getAccessToken();

    const payload = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: String(bookingId),
        amount: { currency_code: this.currency, value: Number(amount).toFixed(2) },
      }],
      payment_source: {
        paypal: {
          customer: { id: vaultCustomerId }, // chìa khoá để charge không cần UI
        },
      },
    };

    const res = await fetch(`${this.base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `create-vault-${bookingId}-${Date.now()}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(this._err(json, 'create order (vault) failed'));
    return json.id; // orderID
  }

  /**
   * Tiện ích: tạo + capture ngay bằng vault (S2S).
   */
  async chargeWithVault(bookingId, amount, vaultCustomerId) {
    const orderID = await this.createOrderWithVaultCustomer(bookingId, amount, vaultCustomerId);
    const cap = await this.captureOrder(bookingId, orderID, /* saveMethod */ false);
    return cap; // { status, captureId, amount, currency, payer..., vaultCustomerId, raw }
  }

  _err(json, fallback) {
    const d = Array.isArray(json?.details) && json.details[0];
    return d?.description || d?.issue || json?.message || fallback;
  }
}

module.exports = new PaypalService();
