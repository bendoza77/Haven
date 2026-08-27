const mongoose = require("mongoose");
const Order = require("../models/order.model");
const User = require("../models/user.model");
const Product = require("../models/product.model");
const AppError = require("../utils/AppError.util");
const catchAsync = require("../utils/catchAsync.util");
const { sendOrderConfirmationEmail } = require("../utils/email.util");

/**
 * The Stripe client.
 *
 * `require("stripe")` is a factory, not a client — calling it with the secret
 * key is what produces something with `.checkout` on it. Built lazily and
 * behind a null check so the API still boots, and every route that is not
 * checkout still answers, on a store where no key has been configured yet.
 */
let stripeClient = null;

const stripe = () => {
    if (!stripeClient) {
        if (!process.env.STRIPE_SECRET_KEY) return null;
        stripeClient = require("stripe")(process.env.STRIPE_SECRET_KEY);
    }

    return stripeClient;
};

/* Where Stripe sends the shopper back to. Read from CLIENT_URL rather than
   hard-coded, so a preview deployment returns to itself instead of dropping
   somebody testing a branch onto the production site. */
const clientUrl = () =>
    (process.env.CLIENT_URL ?? "").split(",")[0].trim().replace(/\/+$/, "");

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

/* Money is integers. Stripe takes minor units, and rounding the cent value is
   what keeps 19.99 from arriving as 1998. */
const cents = (amount) => Math.round(amount * 100);

/**
 * A readable, unique order reference.
 *
 * The count is a cheap monotonic base and the random tail is what makes two
 * orders placed in the same millisecond collide-proof — the unique index on
 * the field is the actual guarantee, and this is retried against it below.
 */
const nextReference = async () => {
    const placed = await Order.estimatedDocumentCount();
    const tail = String(Math.floor(Math.random() * 1000)).padStart(3, "0");

    return `HVN-${String(placed + 1).padStart(4, "0")}${tail}`;
};


/**
 * Opens a Stripe Checkout session for the signed-in shopper's bag.
 *
 * Everything that decides what is owed is read here, from the catalogue and
 * from the account's own cart — never from the request body. That is the whole
 * security property of this route: a checkout that let the browser name its own
 * prices, quantities or products would be a shop anybody could buy from for a
 * penny. The client sends an address and a delivery choice, and nothing else.
 *
 * The order is written first, as "Awaiting payment", and its id travels to
 * Stripe as the session's client reference. Writing it afterwards instead would
 * mean a shopper who closes the tab at the wrong moment has been charged for
 * something there is no record of; writing it first means the worst case is an
 * abandoned row, which is harmless and is exactly what "Awaiting payment" says.
 *
 * Nothing irreversible happens here. Stock comes down and the bag is emptied in
 * the webhook, once the money is confirmed — see fulfilOrder.
 */
const createCheckoutSession = catchAsync(async (req, res, next) => {

    const client = stripe();

    if (!client) {
        return next(new AppError("Card payments are not configured on this store", 503));
    }

    const { shipping, deliveryMethod = "standard" } = req.body ?? {};

    if (!DELIVERY[deliveryMethod]) {
        return next(new AppError("That is not a delivery option", 400));
    }

    const required = ["recipient", "line1", "city", "postcode", "country"];
    const missing = required.filter((field) => !shipping?.[field]?.toString().trim());

    if (missing.length) {
        return next(new AppError(`Shipping details are incomplete: ${missing.join(", ")}`, 400));
    }

    /* The bag as the server holds it, with the products resolved. This is the
       only account of what is being bought that this function will trust. */
    const account = await User.findById(req.user.id).populate("cart.product");

    const lines = (account.cart ?? []).filter((line) => line.product);

    if (!lines.length) {
        return next(new AppError("Your bag is empty", 400));
    }

    /* Checked before charging rather than after, so nobody is ever billed for
       something that was not there to sell. */
    const short = lines.find((line) => line.quantity > line.product.stock);

    if (short) {
        return next(new AppError(
            `Only ${short.product.stock} of ${short.product.name} left — please adjust your bag`,
            409
        ));
    }

    const withdrawn = lines.find((line) => !line.product.isActive);

    if (withdrawn) {
        return next(new AppError(`${withdrawn.product.name} is no longer for sale`, 409));
    }

    const items = lines.map((line) => ({
        product: line.product._id,
        name: line.product.name,
        slug: line.product.slug,
        image: line.product.image,
        price: line.product.price,
        quantity: line.quantity,
        size: line.size,
        color: line.color
    }));

    const subtotal = round(items.reduce((sum, item) => sum + item.price * item.quantity, 0));

    /* Free delivery above the threshold applies to the standard option only —
       paying for express and then being given it free would be odd. */
    const shippingCost =
        deliveryMethod === "standard" && subtotal >= FREE_SHIPPING_OVER
            ? 0
            : DELIVERY[deliveryMethod].cost;

    const tax = round(subtotal * TAX_RATE);
    const total = round(subtotal + shippingCost + tax);

    const order = await Order.create({
        reference: await nextReference(),
        user: req.user.id,
        items,
        shipping,
        deliveryMethod,
        subtotal,
        shippingCost,
        tax,
        total,
        status: "Awaiting payment"
    });

    const line_items = items.map((item) => ({
        price_data: {
            currency: "usd",
            product_data: {
                name: item.name,
                ...(item.size || item.color
                    ? { description: [item.color, item.size].filter(Boolean).join(" / ") }
                    : {})
            },
            unit_amount: cents(item.price)
        },
        quantity: item.quantity
    }));

    /* Delivery and tax ride as their own lines so the total on Stripe's page
       matches the total on ours to the cent, and the shopper can see why. */
    if (shippingCost > 0) {
        line_items.push({
            price_data: {
                currency: "usd",
                product_data: { name: `${DELIVERY[deliveryMethod].label} delivery` },
                unit_amount: cents(shippingCost)
            },
            quantity: 1
        });
    }

    if (tax > 0) {
        line_items.push({
            price_data: {
                currency: "usd",
                product_data: { name: "Tax" },
                unit_amount: cents(tax)
            },
            quantity: 1
        });
    }

    let session;

    try {
        session = await client.checkout.sessions.create({
            mode: "payment",
            line_items,
            customer_email: account.email,
            client_reference_id: order.id,

            /* The webhook arrives carrying the session, not our request, so
               anything it needs in order to find this order has to travel
               there with it. */
            metadata: { orderId: order.id, reference: order.reference },

            /* Stripe substitutes the id on the way back, which is what lets the
               account page confirm a particular payment rather than assume one
               happened because somebody landed on a URL. */
            success_url: `${clientUrl()}/account?tab=orders&order=${order.reference}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${clientUrl()}/checkout/failed?order=${order.reference}`,

            /* An unpaid session should not hold a reference open forever. */
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60
        });
    } catch (error) {
        /* No session means no way to pay, so the row just written is litter. */
        await Order.findByIdAndDelete(order.id);
        return next(new AppError(`Could not start checkout: ${error.message}`, 502));
    }

    order.payment.sessionId = session.id;
    order.payment.paymentIntentId = session.payment_intent ?? undefined;
    order.payment.amountTotal = session.amount_total ?? cents(total);
    order.payment.currency = session.currency ?? "usd";

    await order.save();

    return res.status(201).json({
        status: "success",
        message: "Checkout session created",
        data: {
            order,
            sessionId: session.id,
            /* The page the shopper is sent to. Stripe hosts it, so no card
               details ever reach this server — which is most of the reason to
               do it this way rather than collect them ourselves. */
            sessionUrl: session.url
        }
    });

})


/**
 * Everything that must happen exactly once, when a payment succeeds.
 *
 * Stripe promises delivery at least once, not exactly once: the same event can
 * and does arrive twice. Without a guard, a retry would take the stock down a
 * second time, empty a bag that has since been refilled, and send a second
 * receipt — so the flag is claimed with a conditional update, and only the
 * caller that actually flipped it goes on to do the work. Two deliveries
 * racing each other cannot both win, because only one of them matches a
 * document with the flag still false.
 */
const fulfilOrder = async (order, session) => {

    const claimed = await Order.findOneAndUpdate(
        { _id: order.id, "payment.webhookProcessed": false },
        {
            $set: {
                "payment.webhookProcessed": true,
                "payment.status": "succeeded",
                "payment.paymentIntentId": session.payment_intent ?? order.payment.paymentIntentId,
                "payment.customerId": session.customer ?? undefined,
                "payment.amountTotal": session.amount_total ?? order.payment.amountTotal,
                "payment.paidAt": new Date(),
                status: "Processing"
            }
        },
        { returnDocument: "after" }
    );

    if (!claimed) return;

    /* Stock and the bag, now that the money is real. Each product is
       decremented on its own so one missing piece cannot roll back the rest of
       an order that has already been paid for. */
    await Promise.all(
        claimed.items.map((item) =>
            item.product
                ? Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } })
                : Promise.resolve()
        )
    );

    await User.findByIdAndUpdate(claimed.user, { $set: { cart: [] } });

    try {
        const shopper = await User.findById(claimed.user);

        if (shopper) {
            await sendOrderConfirmationEmail({
                to: shopper.email,
                name: shopper.fullname,
                order: claimed
            });
        }
    } catch (error) {
        /* The order is paid and recorded. A receipt that did not send is worth
           a log line, not an error back to Stripe — which would only make it
           deliver the whole event again, and the rest of this has already
           happened. */
        console.error(`[orders] confirmation email failed for ${claimed.reference}:`, error.message);
    }

}


/** Records that an order was not paid for. Safe to run more than once, and
    never overwrites a payment that did succeed. */
const markPaymentFailed = async (order, { paymentIntentId, status = "failed" } = {}) =>
    Order.updateOne(
        { _id: order.id, "payment.status": { $ne: "succeeded" } },
        {
            $set: {
                "payment.status": status,
                ...(paymentIntentId ? { "payment.paymentIntentId": paymentIntentId } : {}),
                status: status === "canceled" ? "Cancelled" : "Payment failed"
            }
        }
    );


/** The order an event refers to, found by the id attached when it was made. */
const orderForSession = async (session) => {
    const reference = session.client_reference_id ?? session.metadata?.orderId;

    if (reference && mongoose.Types.ObjectId.isValid(reference)) {
        const byId = await Order.findById(reference);
        if (byId) return byId;
    }

    return Order.findOne({ "payment.sessionId": session.id });
};


/**
 * Stripe's account of what happened, which is the only one that counts.
 *
 * The signature check is the security boundary here. This route is public — it
 * has to be, since Stripe holds no session with us — so without verifying that
 * the body really came from Stripe, anybody who found the URL could mark their
 * own order paid and have the goods shipped. Verification needs the raw bytes,
 * which is why app.js keeps a copy before the JSON parser turns them into an
 * object.
 *
 * Every handled path answers 200. A non-2xx tells Stripe to deliver the event
 * again, which is right for "we could not process this" and wrong for "this is
 * not an event we care about" — and a retry storm against a route that will
 * never succeed helps nobody.
 */
const stripeWebhook = catchAsync(async (req, res, next) => {

    const client = stripe();

    if (!client || !process.env.STRIPE_WEBHOOK_SECRET) {
        return next(new AppError("Stripe webhooks are not configured", 503));
    }

    const signature = req.headers["stripe-signature"];

    let event;

    try {
        event = client.webhooks.constructEvent(
            req.rawBody ?? req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        /* A 400 here is correct and deliberate: this did not come from Stripe,
           or was altered on the way. */
        return next(new AppError(`Webhook signature verification failed: ${error.message}`, 400));
    }

    const done = () => res.status(200).json({ received: true });

    switch (event.type) {

        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded": {
            const session = event.data.object;

            /* Some methods complete the session and settle later. Only "paid"
               means the money is actually there. */
            if (session.payment_status !== "paid") return done();

            const order = await orderForSession(session);

            if (order) await fulfilOrder(order, session);

            return done();
        }

        case "checkout.session.async_payment_failed": {
            const session = event.data.object;
            const order = await orderForSession(session);

            if (order) await markPaymentFailed(order, { paymentIntentId: session.payment_intent });

            return done();
        }

        case "checkout.session.expired": {
            const session = event.data.object;
            const order = await orderForSession(session);

            /* Walked away rather than was refused — recorded as cancelled, so
               the account page does not accuse anybody's card of failing. */
            if (order) await markPaymentFailed(order, { status: "canceled" });

            return done();
        }

        case "payment_intent.payment_failed": {
            const intent = event.data.object;
            const order = await Order.findOne({ "payment.paymentIntentId": intent.id });

            if (order) await markPaymentFailed(order, { paymentIntentId: intent.id });

            return done();
        }

        default:
            /* Stripe sends a great deal nobody asked for. Acknowledged, so it
               stops trying. */
            return done();
    }

})


/** The signed-in shopper's own orders, newest first. */
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
