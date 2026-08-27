const mongoose = require("mongoose");

/**
 * One line of an order.
 *
 * The name and price are copied rather than referenced on purpose: an order is
 * a record of what was agreed at the time. If a piece is repriced next month,
 * or withdrawn from the catalogue entirely, what the shopper paid must not
 * move with it. The product reference is kept alongside so the account page
 * can still link back while the piece exists.
 */
const orderItemSchema = new mongoose.Schema({

    product: {
        type: mongoose.Types.ObjectId,
        ref: "Product"
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    slug: { type: String, trim: true },

    image: { type: String },

    /* Price per unit, as it stood when the order was placed. */
    price: {
        type: Number,
        required: true,
        min: [0, "Price cannot be negative"]
    },

    quantity: {
        type: Number,
        required: true,
        min: [1, "Quantity must be at least 1"]
    },

    size: { type: String, trim: true },
    color: { type: String, trim: true }

}, { _id: false });

/**
 * What Stripe knows about this order.
 *
 * On the order, not on each line: one checkout is one payment, and hanging a
 * session id off every item would ask the same question of the database as
 * many times as there are things in the bag — and leave open what it would
 * mean for two lines of one order to disagree.
 *
 * `status` here is about the money and is Stripe's word for it. The order's own
 * `status` is about the parcel. They are genuinely different facts: a paid
 * order can still be cancelled, and an order can sit unpaid for an hour while
 * somebody hunts for their card.
 */
const paymentSchema = new mongoose.Schema({
    sessionId: { type: String, index: true },
    paymentIntentId: { type: String },
    customerId: { type: String },

    status: {
        type: String,
        enum: ["pending", "succeeded", "failed", "canceled"],
        default: "pending"
    },

    currency: { type: String, default: "usd", lowercase: true },

    /* In minor units, as Stripe reports it — cents, not dollars. Kept as Stripe
       sent it so the two records can be compared without rounding. */
    amountTotal: { type: Number, min: 0 },

    /* Set once the webhook has acted on this order. Stripe delivers an event at
       least once, not exactly once, so the handler checks this before doing
       anything that must not happen twice — taking stock down, emptying a bag,
       sending a receipt. */
    webhookProcessed: { type: Boolean, default: false },

    paidAt: { type: Date }
}, { _id: false });

/* The address is copied too, for the same reason: where it went is part of
   what happened, and editing the account's address book later must not rewrite
   the history of a parcel that has already been delivered. */
const shippingSchema = new mongoose.Schema({
    recipient: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    region: { type: String, trim: true },
    postcode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    phone: { type: String, trim: true }
}, { _id: false });

/* "Awaiting payment" is where an order starts now: it exists, it is reserved,
   and nothing has been charged. It becomes "Processing" when Stripe says the
   money arrived, and "Payment failed" when Stripe says it did not. */
const STATUSES = [
    "Awaiting payment",
    "Processing",
    "In transit",
    "Delivered",
    "Cancelled",
    "Payment failed"
];

const orderSchema = new mongoose.Schema({
    /* Human-facing, and what the shopper quotes when they write in. Generated
       in the controller so it is unique and readable — see nextReference. */
    reference: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },

    user: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: [true, "An order has to belong to an account"],
        index: true
    },

    items: {
        type: [orderItemSchema],
        validate: [(value) => value.length > 0, "An order needs at least one item"]
    },

    shipping: {
        type: shippingSchema,
        required: [true, "An order needs somewhere to go"]
    },

    deliveryMethod: {
        type: String,
        enum: ["standard", "express", "white-glove"],
        default: "standard"
    },

    /* All four are stored rather than derived on read: the tax rate and the
       shipping threshold are policy, and policy changes. */
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0, default: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },

    status: {
        type: String,
        enum: {
            values: STATUSES,
            message: "{VALUE} is not a status an order can be in"
        },
        default: "Awaiting payment"
    },

    payment: {
        type: paymentSchema,
        default: () => ({})
    }
}, { timestamps: true });

orderSchema.statics.STATUSES = STATUSES;

/** Total pieces, not total lines — what "3 items" means on the account page. */
orderSchema.virtual("itemCount").get(function () {
    return this.items.reduce((count, line) => count + line.quantity, 0);
});

orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
