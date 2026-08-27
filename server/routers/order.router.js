const express = require("express");
const {
    getMyOrders,
    getMyOrderById,
    getOrders,
    updateOrderStatus,
    createCheckoutSession,
    stripeWebhook
} = require("../controllers/order.controller");
const protect = require("../middlewares/protect.middleware");
const allowed = require("../utils/allowed.util");
const { writeLimiter } = require("../middlewares/rateLimit.middleware");

const orderRouter = express.Router();

/**
 * Stripe's callback, declared before the session gate below.
 *
 * Stripe is not a signed-in shopper and never will be: it holds no cookie, so
 * behind `protect` this route could only ever answer 401, and every payment
 * would be taken and then silently never recorded. What authenticates it
 * instead is the signature on the body, which the controller verifies against
 * STRIPE_WEBHOOK_SECRET — a stronger check than a session, and the reason this
 * is safe to leave open.
 */
orderRouter.post("/webhook", stripeWebhook);

/* An order belongs to somebody. Nothing below here is reachable without a
   session. */
orderRouter.use(protect);

/* Declared before "/:id" so the literal path wins the match. The shopper's own
   orders carry no id in the path, so one account cannot reach another's. */
orderRouter.route("/me").get(getMyOrders);
orderRouter.get("/me/:id", getMyOrderById);

/* Each call opens a Stripe checkout session, so an unbounded loop here is
   somebody else's bill as well as our own noise. */
orderRouter.post("/checkout", writeLimiter, createCheckoutSession);

/* Reading the whole book is staff work; moving an order along is the admin's. */
orderRouter.get("/", allowed("admin", "moderator"), getOrders);
orderRouter.patch("/:id/status", allowed("admin"), updateOrderStatus);

module.exports = orderRouter;
