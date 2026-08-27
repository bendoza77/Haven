const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const noSpaces = (value) => {
    return !/\s/.test(value);
}

/* One line of the bag. The chosen size and colour are part of the identity of
   a line, so the same shirt in two sizes is two lines rather than one. */
const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
        required: [true, "A cart line needs a product"]
    },

    quantity: {
        type: Number,
        required: true,
        min: [1, "Quantity must be at least 1"],
        max: [99, "Quantity cannot be more than 99"],
        default: 1
    },

    size: {
        type: String,
        trim: true
    },

    color: {
        type: String,
        trim: true
    }
}, { timestamps: true })

/* A place to send things. Kept on the account as a subdocument rather than in
   its own collection: an address has no life of its own, and every read of one
   is a read of the account it belongs to. */
const addressSchema = new mongoose.Schema({
    label: {
        type: String,
        required: [true, "Give this address a name, like Home or Studio"],
        trim: true,
        maxlength: [40, "That label is too long"]
    },

    recipient: {
        type: String,
        required: [true, "Who should the courier ask for?"],
        trim: true,
        maxlength: [80, "That name is too long"]
    },

    line1: {
        type: String,
        required: [true, "Street address is required"],
        trim: true
    },

    line2: { type: String, trim: true },

    city: {
        type: String,
        required: [true, "City is required"],
        trim: true
    },

    region: { type: String, trim: true },

    postcode: {
        type: String,
        required: [true, "Postcode is required"],
        trim: true
    },

    country: {
        type: String,
        required: [true, "Country is required"],
        trim: true,
        default: "United States"
    },

    phone: { type: String, trim: true },

    /* Exactly one address is the default. The account controller clears the
       others when this is set, so the invariant lives in one place. */
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: [true, "Please Enter You fullname"],
        trim: true,
        minlength: [3, "Fullname must be at least 3 characters"],
        maxlength: [50, "Fullname must be less than 50 characters"],
    },

    email: {
        type: String,
        required: [true, "Please Enter You email"],
        unique: true,
        trim: true,
        validate: [validator.isEmail, "Please Enter a valid email"],
    },

    password: {
        type: String,
        required: [function () { return this.provider === "local" }, "Please Enter You password"],
        minlength: [6, "Password must be at least 6 characters"],
        maxlength: [50, "Password must be less than 50 characters"],
        validate: {
            validator: noSpaces,
            message: "Password must not contain spaces"
        },
        select: false
    },

    role: {
        type: String,
        enum: ["admin", "moderator", "user"],
        default: "user",
    },

    profile: {
        type: String
    },

    favoriteProducts: [
        {
            type: mongoose.Types.ObjectId,
            ref: "Product",
        }
    ],

    paymentHistory: [
        {
            type: mongoose.Types.ObjectId,
            ref: "Payment"
        }
    ],

    provider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },

    providerId: {
        type: String,
        unique: true,
        sparse: true
    },

    isVerifed: {
        type: Boolean,
        default: false
    },

    /* Two-step sign-in. When this is on, a correct password is not a session —
       it only earns the right to be sent a code. See createTwoFactorCode. */
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },

    /* Only the hash of the code is stored, for the same reason as the two
       one-time links below: a leaked database hands nobody a working code. */
    twoFactorCode: {
        type: String,
        select: false
    },

    twoFactorExpires: {
        type: Date,
        select: false
    },

    /* How many wrong codes have been tried against the current one. Cleared
       whenever a fresh code is issued. */
    twoFactorAttempts: {
        type: Number,
        default: 0,
        select: false
    },

    addresses: {
        type: [addressSchema],
        default: []
    },

    /* The bag lives on the account, so it follows the shopper between the
       phone and the laptop instead of dying with a browser tab. */
    cart: {
        type: [cartItemSchema],
        default: []
    },

    /* Only the hashes of the two one-time links are stored. If the database
       leaks, the tokens in it cannot be used — see createEmailVerificationToken
       and createPasswordResetToken below. */
    emailVerificationToken: {
        type: String,
        select: false
    },

    emailVerificationExpires: {
        type: Date,
        select: false
    },

    passwordResetToken: {
        type: String,
        select: false
    },

    passwordResetExpires: {
        type: Date,
        select: false
    },

    orders: [
        {
            type: mongoose.Types.ObjectId,
            ref: "Payment"
        }
    ]

}, { timestamps: true })

userSchema.pre("save", async function() {
    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 12);
})

userSchema.methods.signToken = function() {
    return jwt.sign({ id: this.id, role: this.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES });
}

userSchema.methods.comparePassword = async (candidate, password) => {
    return await bcrypt.compare(candidate, password);
}

/* ---------------------------------------------------------------
   One-time links.

   Each method returns the raw token to put in the email and stores
   only its SHA-256 hash. A leaked database therefore hands nobody a
   working link, and the lookup is still a single indexed match.
   --------------------------------------------------------------- */

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

userSchema.methods.createEmailVerificationToken = function() {
    const token = crypto.randomBytes(32).toString("hex");

    this.emailVerificationToken = hashToken(token);
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    return token;
}

userSchema.methods.createPasswordResetToken = function() {
    const token = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = hashToken(token);
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return token;
}

/**
 * Issues a six-digit sign-in code and stores only its hash.
 *
 * Six digits is a million possibilities, which is not much on its own — the
 * five-attempt ceiling in verifyTwoFactor and the ten-minute expiry are what
 * make it hold up. Read with crypto.randomInt rather than Math.random so the
 * code cannot be predicted from a previous one.
 */
userSchema.methods.createTwoFactorCode = function() {
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

    this.twoFactorCode = hashToken(code);
    this.twoFactorExpires = Date.now() + 10 * 60 * 1000;
    this.twoFactorAttempts = 0;

    return code;
}

userSchema.statics.hashToken = hashToken;

const User = mongoose.model("User", userSchema);

module.exports = User;