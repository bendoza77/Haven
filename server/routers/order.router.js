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

const orderRouter = express.Router();

/* An order belongs to somebody. Nothing here is reachable without a session. */
orderRouter.use(protect);

/* Declared before "/:id" so the literal path wins the match. The shopper's own
   orders carry no id in the path, so one account cannot reach another's. */
orderRouter.route("/me").get(getMyOrders);
orderRouter.get("/me/:id", getMyOrderById);

/* Reading the whole book is staff work; moving an order along is the admin's. */
orderRouter.get("/", allowed("admin", "moderator"), getOrders);
orderRouter.patch("/:id/status", allowed("admin"), updateOrderStatus);
orderRouter.post("/checkout", protect, createCheckoutSession);
orderRouter.post("/webhook", stripeWebhook);

module.exports = orderRouter;
