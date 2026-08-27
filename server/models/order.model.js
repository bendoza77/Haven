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

    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
    },

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
    color: { type: String, trim: true },

    stripeSessionId: {type: String, required: [true, "Stripe session if is required"]},
    stripePaymentIntentId: {type: String, required: [true, "Stripe payment intend is required"]},
    stripeCostumerId: {type: String, required: [true, "Stripe costumer is required"]},
    stripePaymentStatus: {type: String, enum: ["pending", "succeeded", "failed", "canceled"], default: "pending"},
    amount: {type: Number, default: "USD"},
    stripeWebhookProccesd: {type: Boolean, default: false}


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

const STATUSES = ["Processing", "In transit", "Delivered", "Cancelled"];

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
        default: "Processing"
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
