import crypto from "crypto";
import { isValidObjectId } from "mongoose";
import Product from "../model/product.js";
import Order from "../model/orderModel.js";

const sandboxBaseUrl = "https://checkout-sandbox.payway.com.kh";
const productionBaseUrl = "https://checkout.payway.com.kh";

const payWayConfig = () => {
  const merchantId = process.env.PAYWAY_MERCHANT_ID;
  const apiKey = process.env.PAYWAY_API_KEY;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const callbackUrl = process.env.PAYWAY_RETURN_URL;

  if (!merchantId || !apiKey || !callbackUrl) {
    throw new Error(
      "ABA PayWay is not configured. Set PAYWAY_MERCHANT_ID, PAYWAY_API_KEY, and PAYWAY_RETURN_URL.",
    );
  }

  const useSandbox = process.env.PAYWAY_SANDBOX !== "false";
  return {
    merchantId,
    apiKey,
    frontendUrl: frontendUrl.replace(/\/$/, ""),
    callbackUrl,
    baseUrl: useSandbox ? sandboxBaseUrl : productionBaseUrl,
  };
};

const requestTime = () => {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
};

const sign = (value, apiKey) =>
  crypto.createHmac("sha512", apiKey).update(value).digest("base64");

const encodeJson = (value) => Buffer.from(JSON.stringify(value)).toString("base64");

const paymentHash = (fields, apiKey) =>
  sign(
    [
      fields.req_time,
      fields.merchant_id,
      fields.tran_id,
      fields.amount,
      fields.items,
      fields.shipping,
      fields.firstname,
      fields.lastname,
      fields.email,
      fields.phone,
      fields.type,
      fields.payment_option,
      fields.return_url,
      fields.cancel_url,
      fields.continue_success_url,
      fields.return_deeplink,
      fields.currency,
      fields.custom_fields,
      fields.return_params,
    ].join(""),
    apiKey,
  );

const splitName = (name = "") => {
  const [firstname = "Customer", ...rest] = name.trim().split(/\s+/);
  return { firstname, lastname: rest.join(" ") };
};

const newTransactionId = () =>
  `${Date.now().toString().slice(1)}${crypto.randomInt(10000, 99999)}`;

const validCart = (items) =>
  Array.isArray(items) &&
  items.length > 0 &&
  items.length <= 50 &&
  items.every(
    (item) =>
      isValidObjectId(item.productId) &&
      Number.isInteger(item.quantity) &&
      item.quantity >= 1 &&
      item.quantity <= 20,
  );

const getPayWayTransaction = async (transactionId, config) => {
  const reqTime = requestTime();
  const hash = sign(
    `${reqTime}${config.merchantId}${transactionId}`,
    config.apiKey,
  );
  const response = await fetch(
    `${config.baseUrl}/api/payment-gateway/v1/payments/check-transaction-2`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        req_time: reqTime,
        merchant_id: config.merchantId,
        tran_id: transactionId,
        hash,
      }),
    },
  );

  if (!response.ok)
    throw new Error(`PayWay verification failed with HTTP ${response.status}`);
  return response.json();
};

const applyPaymentResult = async (transactionId, result) => {
  const order = await Order.findOne({ transactionId });
  if (!order) return null;

  const payment = result?.data;
  const approved =
    result?.status?.code === "00" &&
    Number(payment?.payment_status_code) === 0 &&
    payment?.payment_status === "APPROVED" &&
    Math.abs(Number(payment?.original_amount) - order.amount) < 0.001;

  if (approved) {
    order.status = "paid";
    order.payment = {
      status: payment.payment_status,
      type: payment.payment_type || "",
      approvalCode: payment.apv || "",
      bankReference: payment.bank_ref || "",
      paidAt: payment.transaction_date
        ? new Date(payment.transaction_date)
        : new Date(),
    };
  } else if (payment?.payment_status && payment.payment_status !== "PENDING") {
    order.status = "failed";
    order.payment.status = payment.payment_status;
  }

  await order.save();
  return order;
};

const createPayment = async (req, res) => {
  try {
    if (!validCart(req.body.items)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Your cart contains an invalid item or quantity.",
        });
    }

    const config = payWayConfig();
    const requestedItems = req.body.items;
    const products = await Product.find({
      _id: { $in: requestedItems.map((item) => item.productId) },
    }).lean();
    const productsById = new Map(
      products.map((product) => [String(product._id), product]),
    );

    if (productsById.size !== requestedItems.length) {
      return res
        .status(400)
        .json({
          success: false,
          message: "One or more menu items are no longer available.",
        });
    }

    const orderItems = requestedItems.map(({ productId, quantity }) => {
      const product = productsById.get(productId);
      return {
        product: product._id,
        name: product.name,
        unitPrice: Number(product.price),
        quantity,
      };
    });
    const amount = Number(
      orderItems
        .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
        .toFixed(2),
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "The order total is invalid." });
    }

    const transactionId = newTransactionId();
    const customer = req.body.customer || {};
    const order = await Order.create({
      transactionId,
      customer: {
        id: String(customer.id || ""),
        name: String(customer.name || ""),
        email: String(customer.email || ""),
      },
      items: orderItems,
      amount,
      currency: "USD",
    });

    const { firstname, lastname } = splitName(customer.name);
    const successUrl = `${config.frontendUrl}/payment/success?tran_id=${encodeURIComponent(transactionId)}`;
    const cancelUrl = `${config.frontendUrl}/payment/cancel?tran_id=${encodeURIComponent(transactionId)}`;
    const fields = {
      req_time: requestTime(),
      merchant_id: config.merchantId,
      tran_id: transactionId,
      amount: amount.toFixed(2),
      items: encodeJson(
        orderItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.unitPrice.toFixed(2),
        })),
      ),
      shipping: "0",
      firstname,
      lastname,
      email: String(customer.email || ""),
      phone: "",
      type: "purchase",
      payment_option: "",
      return_url: config.callbackUrl,
      cancel_url: cancelUrl,
      skip_success_page: "0",
      continue_success_url: successUrl,
      return_deeplink: "",
      currency: "USD",
      custom_fields: "",
      return_params: encodeJson({ order_id: String(order._id) }),
      view_type: "hosted",
    };
    fields.hash = paymentHash(fields, config.apiKey);

    return res.status(201).json({
      success: true,
      payment: {
        url: `${config.baseUrl}/api/payment-gateway/v1/payments/purchase`,
        fields,
      },
    });
  } catch (error) {
    console.error("Unable to create PayWay payment:", error.message);
    return res
      .status(error.message.includes("not configured") ? 503 : 500)
      .json({
        success: false,
        message: error.message.includes("not configured")
          ? error.message
          : "Unable to start payment. Please try again.",
      });
  }
};

const paymentCallback = async (req, res) => {
  try {
    const config = payWayConfig();
    const receivedSignature = req.get("x-payway-hmac-sha512") || "";
    const payload = req.body || {};
    const message = Object.keys(payload)
      .sort()
      .map((key) => {
        const value = payload[key];
        return value && typeof value === "object"
          ? JSON.stringify(value)
          : String(value ?? "");
      })
      .join("");
    const expectedSignature = sign(message, config.apiKey);

    const isValid =
      receivedSignature &&
      receivedSignature.length === expectedSignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(receivedSignature),
        Buffer.from(expectedSignature),
      );
    if (!isValid)
      return res
        .status(401)
        .json({ success: false, message: "Invalid PayWay signature." });

    if (payload.tran_id) {
      const transaction = await getPayWayTransaction(
        String(payload.tran_id),
        config,
      );
      await applyPaymentResult(String(payload.tran_id), transaction);
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Unable to process PayWay callback:", error.message);
    return res.status(500).json({ success: false });
  }
};

const paymentStatus = async (req, res) => {
  try {
    const transactionId = String(req.params.transactionId || "");
    const order = await Order.findOne({ transactionId });
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Payment not found." });

    if (order.status === "pending") {
      const transaction = await getPayWayTransaction(
        transactionId,
        payWayConfig(),
      );
      await applyPaymentResult(transactionId, transaction);
    }

    const updatedOrder = await Order.findOne({ transactionId }).lean();
    return res.json({
      success: true,
      payment: {
        transactionId: updatedOrder.transactionId,
        status: updatedOrder.status,
        amount: updatedOrder.amount,
        currency: updatedOrder.currency,
      },
    });
  } catch (error) {
    console.error("Unable to retrieve PayWay payment:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Unable to verify payment status." });
  }
};

export { createPayment, paymentCallback, paymentStatus };
