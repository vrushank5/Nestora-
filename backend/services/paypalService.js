/**
 * PayPal Payment Service (REST API v2)
 * Handles OAuth authentication, order creation, and order capture.
 */

const getPaypalConfig = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const isSandbox = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase() !== 'live';
  const baseUrl = isSandbox
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

  return { clientId, clientSecret, baseUrl };
};

/**
 * Obtain an OAuth2 access token from PayPal
 */
async function getAccessToken() {
  const { clientId, clientSecret, baseUrl } = getPaypalConfig();

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials missing in environment variables');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.message || 'Failed to authenticate with PayPal');
  }

  return data.access_token;
}

/**
 * Create a PayPal Checkout Order
 * @param {Object} options { amount, bookingId, currency, description }
 */
async function createPaypalOrder({ amount, bookingId, currency = 'USD', description = 'Nestora PG & Co-Living Stay' }) {
  const { baseUrl } = getPaypalConfig();
  const token = await getAccessToken();

  // Format amount to 2 decimal places
  const formattedValue = Number(amount).toFixed(2);

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: bookingId ? String(bookingId) : `BK-${Date.now()}`,
        description,
        amount: {
          currency_code: currency,
          value: formattedValue,
        },
      },
    ],
    application_context: {
      brand_name: 'Nestora Co-Living',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
    },
  };

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('PayPal createOrder error:', data);
    throw new Error(data.message || (data.details && data.details[0]?.description) || 'Failed to create PayPal order');
  }

  return data;
}

/**
 * Capture an approved PayPal order
 * @param {string} orderId 
 */
async function capturePaypalOrder(orderId) {
  const { baseUrl } = getPaypalConfig();
  const token = await getAccessToken();

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('PayPal captureOrder error:', data);
    throw new Error(data.message || (data.details && data.details[0]?.description) || 'Failed to capture PayPal order');
  }

  return data;
}

module.exports = {
  createPaypalOrder,
  capturePaypalOrder,
};
