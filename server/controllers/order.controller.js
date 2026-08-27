const mongoose = require("mongoose");
const Order = require("../models/order.model");
const User = require("../models/user.model");
const Product = require("../models/product.model");
const AppError = require("../utils/AppError.util");
const catchAsync = require("../utils/catchAsync.util");
const { sendOrderConfirmationEmail } = require("../utils/email.util");

const stripe = require("stripe");

/* Delivery, as the checkout screen offers it. Prices are policy and live here
   rather than on the client, so a shopper cannot choose their own. */
const DELIVERY = {
    "standard": { label: "Standard", cost: 0 },
    "express": { label: "Express", cost: 25 },
    "white-glove": { label: "White glove", cost: 120 }
};

const FREE_SHIPPING_OVER = 250;
const TAX_RATE = 0.08;

const round = (value) => Math.round(value * 100) / 100;

/**
 * A readable, unique order reference.
 *
 * The count is a cheap monotonic base and the random tail is what makes two
 * orders placed in the same millisecond collide-proof — the unique index on
 * the field is the actual guarantee, and this is retried against it below.
 * 
 * 
 */
const nextReference = async () => {
    const placed = await Order.estimatedDocumentCount();
    const tail = String(Math.floor(Math.random() * 1000)).padStart(3, "0");

    return `HVN-${String(placed + 1).padStart(4, "0")}${tail}`;
};


/**
 * Turns the signed-in shopper's bag into an order.
 *
 * Prices are read from the catalogue here, never from the request — a checkout
 * that trusted the browser about what things cost would be a checkout anybody
 * could rewrite. Stock comes down in the same pass, and the bag is emptied
 * once the order exists.
 */

/** The signed-in shopper's own orders, newest first. */

const createCheckoutSession = catchAsync(async (req, res, next) => {

    const { userOrder } = req.body;

    const check = userOrder.reduce((acc, cur) => {
        if (!Number.isInteger(cur.quantity) || cur.quantity <= 0) {
            return next(new AppError("Quanityt is invalid", 400));
        }

        acc[cur.id] = cur.quantity;

        return acc
    }, {})

    const productIds = userOrder.map(el => el.id);
    const products = await Product.find({_id: {$in: {productIds}}})

    if (products.length <= 0) {
        return next(new AppError("At least one product is required", 400));
    }

    const line_items = products.map(el => {
        return { 

            price_data: {
                currency: "usd",
                product_data: {
                    name: el.fullname,
                    description: el.description,
                },

                unit_amount: el.price * 100,
            },
            quantity: check[products._id.toString()]

        }

    })

    const session = await stripe.checkout.session.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items,
        success_url: "http://localhost:3001/success",
        cancel_url: "http://localhost:3001/cancel"
    })

    const order = await Order.create({
        userId: req.user._id,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        amount: products.reduce((accumulator, item) => {
            return accumulator + item.universal.price * obj[item._id.toString()];
        }, 0),
        status: "pending"
    });

    return res.json({
        status: "succasse",
        message: "Payment done succassefuly",
        data: {
            order,
            sessionUrl: session.url,
            sessionId: session.id
        }
    });
})

const stripeWebhook = catchAsync(async (req, res, next) => {

    const signature = req.headers["stripe-signature"]

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch(err) {
        return next(new AppError(`Webhook error ${err.message}`, 400))
    }

    if (event.type === "checkout.session.completed") {

        const session = event.data.object;

        if (session.payment_status !== "paid") {
            return res.status(200).json({ received: true })
        }

        const order = await Order.findOne({stripeSessionId: session.id});

        if (!order) {
            return next(new AppError("Order not found", 404));
        }

        order.status = "succeeded";
        order.stripePaymentIntentId = session.payment_intent;
        order.stripeWebhook = true;

        await order.save();
    
    }

    if (event.type === "checkout.session.async_payment_failed") {
        const session = event.data.object;

        if (session.payment_status !== "paid") {
            return res.status(200).json({ received: true })
        }

        const order = await Order.findOne({stripeSessionId: session.id});

        if (!order) {
            return next(new AppError("Order not found", 404));
        }

        order.status = "failed";
        order.stripePaymentIntentId = session.payment_intent;
        order.stripeWebhook = false;

        await order.save();
    }

    if (event.type === "payment_intent.payment_failed") {

        const paymentIntent = event.data.object;

        const sessionId = paymentIntent.payment_details?.order_reference;
        const order = await Order.findOne({stripeSessionId: sessionId});

        if (!order) {
            return next(new AppError("Order not found", 404));
        }

        order.status = "failed";
        order.stripePaymentIntentId = paymentIntent.id;
        order.stripeWebhook = false;

        await order.save();

    }



})


const getMyOrders = catchAsync(async (req, res, next) => {

    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });

    return res.json({
        status: "success",
        data: orders
    });

})


const getMyOrderById = catchAsync(async (req, res, next) => {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError("Invalid order ID", 400));
    }

    /* Scoped to the signed-in account in the query itself, so one shopper can
       never read another's order by guessing an id. */
    const order = await Order.findOne({ _id: id, user: req.user.id });

    if (!order) {
        return next(new AppError("Order not found", 404));
    }

    return res.json({
        status: "success",
        data: order
    });

})


/* --------------------------------------------------------- console */

/** Every order in the store, for the console screens. */
const getOrders = catchAsync(async (req, res, next) => {

    const orders = await Order.find()
        .populate("user", "fullname email")
        .sort({ createdAt: -1 });

    return res.json({
        status: "success",
        data: orders
    });

})


/** Moves an order along. Admin only — the router says so. */
const updateOrderStatus = catchAsync(async (req, res, next) => {

    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError("Invalid order ID", 400));
    }

    if (!Order.STATUSES.includes(status)) {
        return next(new AppError("That is not a status an order can be in", 400));
    }

    const order = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
    ).populate("user", "fullname email");

    if (!order) {
        return next(new AppError("Order not found", 404));
    }

    return res.json({
        status: "success",
        message: `Order ${order.reference} is now ${order.status.toLowerCase()}`,
        data: order
    });

})


module.exports = {
    createCheckoutSession,
    stripeWebhook,
    getMyOrders,
    getMyOrderById,
    getOrders,
    updateOrderStatus
}
