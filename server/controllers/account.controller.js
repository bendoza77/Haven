const mongoose = require("mongoose");
const User = require("../models/user.model");
const Product = require("../models/product.model");
const AppError = require("../utils/AppError.util");
const catchAsync = require("../utils/catchAsync.util");

/* What the storefront needs to draw a saved piece or a bag line. Sending the
   whole product document down on every page would carry the description and
   the full gallery for nothing. */
const PRODUCT_FIELDS = "name slug category price previousPrice image images badge rating reviewCount stock isActive sizes colors";

/** The signed-in account with both lists resolved, and never the password. */
const loadAccount = (id) =>
    User.findById(id)
        .populate("favoriteProducts", PRODUCT_FIELDS)
        .populate("cart.product", PRODUCT_FIELDS);

const sendAccount = async (id, res, message) => {
    const user = await loadAccount(id);

    return res.json({
        status: "success",
        message,
        data: user
    });
};

const requireProductId = (id, next) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        next(new AppError("Invalid product ID", 400));
        return false;
    }
    return true;
};


const getMe = catchAsync(async (req, res, next) => {

    return sendAccount(req.user.id, res);

})


const updateMe = catchAsync(async (req, res, next) => {

    const { fullname, profile } = req.body;

    const user = await User.findById(req.user.id);

    /* Deliberately narrow: role, email and password are not changed here.
       The email is what the account is identified by and would need to be
       confirmed again; the role is the admin console's business. */
    if (fullname !== undefined) user.fullname = fullname;
    if (profile !== undefined) user.profile = profile;

    await user.save();

    return sendAccount(user.id, res, "Your details have been saved");

})


/* ---------------------------------------------------------- favourites */

const getFavorites = catchAsync(async (req, res, next) => {

    const user = await User.findById(req.user.id).populate("favoriteProducts", PRODUCT_FIELDS);

    return res.json({
        status: "success",
        results: user.favoriteProducts.length,
        data: user.favoriteProducts
    });

})


const addFavorite = catchAsync(async (req, res, next) => {

    const { productId } = req.params;

    if (!requireProductId(productId, next)) return;

    if (!(await Product.exists({ _id: productId }))) {
        return next(new AppError("Product not found", 404));
    }

    /* $addToSet rather than $push: saving the same piece twice is a no-op,
       not a duplicate row. */
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { favoriteProducts: productId } });

    return sendAccount(req.user.id, res, "Saved to your list");

})


const removeFavorite = catchAsync(async (req, res, next) => {

    const { productId } = req.params;

    if (!requireProductId(productId, next)) return;

    await User.findByIdAndUpdate(req.user.id, { $pull: { favoriteProducts: productId } });

    return sendAccount(req.user.id, res, "Removed from your list");

})


/* ---------------------------------------------------------------- cart */

const getCart = catchAsync(async (req, res, next) => {

    const user = await User.findById(req.user.id).populate("cart.product", PRODUCT_FIELDS);

    return res.json({
        status: "success",
        results: user.cart.length,
        data: user.cart
    });

})


const addToCart = catchAsync(async (req, res, next) => {

    const { productId, quantity, size, color } = req.body;

    if (!requireProductId(productId, next)) return;

    const product = await Product.findById(productId).select("stock isActive name");

    if (!product) {
        return next(new AppError("Product not found", 404));
    }

    if (!product.isActive) {
        return next(new AppError("That product is not on sale at the moment", 400));
    }

    const wanted = Math.max(1, Number(quantity) || 1);

    const user = await User.findById(req.user.id);

    /* Same piece, same size, same colour is the same line — its quantity goes
       up rather than a second line appearing. */
    const existing = user.cart.find(
        (line) =>
            line.product.toString() === productId &&
            (line.size || "") === (size || "") &&
            (line.color || "") === (color || "")
    );

    const alreadyIn = existing ? existing.quantity : 0;

    if (product.stock < alreadyIn + wanted) {
        return next(
            new AppError(
                product.stock === 0
                    ? `${product.name} is out of stock`
                    : `Only ${product.stock} of ${product.name} left`,
                400
            )
        );
    }

    if (existing) {
        existing.quantity = alreadyIn + wanted;
    } else {
        user.cart.push({ product: productId, quantity: wanted, size, color });
    }

    await user.save();

    return sendAccount(user.id, res, "Added to your bag");

})


const updateCartItem = catchAsync(async (req, res, next) => {

    const { itemId } = req.params;
    const { quantity } = req.body;

    const user = await User.findById(req.user.id);
    const line = user.cart.id(itemId);

    if (!line) {
        return next(new AppError("That item is not in your bag", 404));
    }

    const wanted = Number(quantity);

    if (!Number.isFinite(wanted) || wanted < 1) {
        return next(new AppError("Quantity must be at least 1", 400));
    }

    const product = await Product.findById(line.product).select("stock name");

    if (product && product.stock < wanted) {
        return next(new AppError(`Only ${product.stock} of ${product.name} left`, 400));
    }

    line.quantity = wanted;

    await user.save();

    return sendAccount(user.id, res, "Your bag has been updated");

})


const removeCartItem = catchAsync(async (req, res, next) => {

    const { itemId } = req.params;

    const user = await User.findById(req.user.id);
    const line = user.cart.id(itemId);

    if (!line) {
        return next(new AppError("That item is not in your bag", 404));
    }

    line.deleteOne();

    await user.save();

    return sendAccount(user.id, res, "Removed from your bag");

})


const clearCart = catchAsync(async (req, res, next) => {

    await User.findByIdAndUpdate(req.user.id, { $set: { cart: [] } });

    return sendAccount(req.user.id, res, "Your bag is empty");

})


/* --------------------------------------------------------- two-step */

/**
 * Turns two-step sign-in on or off for the signed-in account.
 *
 * Turning it OFF asks for the password again. Turning it on does not: somebody
 * who has walked up to an unlocked laptop can only make the account harder to
 * reach, never easier, so the friction belongs on the way out.
 */
const setTwoFactor = catchAsync(async (req, res, next) => {

    const { enabled, password } = req.body;

    if (enabled === undefined) {
        return next(new AppError("Say whether two-step sign-in should be on or off", 400));
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    /* A Google account has no password of ours to send a code around. */
    if (user.provider !== "local") {
        return next(new AppError("This account signs in with Google, which handles its own two-step", 400));
    }

    if (!enabled) {
        if (!password) {
            return next(new AppError("Enter your password to turn two-step sign-in off", 400));
        }

        const matches = await user.comparePassword(password, user.password);

        if (!matches) {
            return next(new AppError("That password is not right", 400));
        }
    }

    user.twoFactorEnabled = Boolean(enabled);

    /* Any code outstanding under the old setting is meaningless now. */
    user.twoFactorCode = undefined;
    user.twoFactorExpires = undefined;
    user.twoFactorAttempts = 0;

    await user.save({ validateBeforeSave: false });

    return sendAccount(
        req.user.id,
        res,
        enabled
            ? "Two-step sign-in is on — we will email a code each time you sign in"
            : "Two-step sign-in is off"
    );

})


/* -------------------------------------------------------- addresses */

const ADDRESS_FIELDS = ["label", "recipient", "line1", "line2", "city", "region", "postcode", "country", "phone"];

/** Only the fields an address has, and only the ones that were sent. */
const readAddress = (body) =>
    ADDRESS_FIELDS.reduce((address, field) => {
        if (body[field] !== undefined) address[field] = body[field];
        return address;
    }, {});

/* Exactly one address is the default, and this is the only place that decides
   which — every write that could create a second one comes through here. */
const markDefault = (user, id) => {
    user.addresses.forEach((address) => {
        address.isDefault = String(address._id) === String(id);
    });
};

const getAddresses = catchAsync(async (req, res, next) => {

    const user = await User.findById(req.user.id);

    return res.json({
        status: "success",
        data: user.addresses
    });

})


const addAddress = catchAsync(async (req, res, next) => {

    const user = await User.findById(req.user.id);

    user.addresses.push(readAddress(req.body));

    const added = user.addresses[user.addresses.length - 1];

    /* The first address on an account is its default whatever was asked for —
       an address book of one with no default would be a book with no answer. */
    if (req.body.isDefault || user.addresses.length === 1) {
        markDefault(user, added._id);
    }

    await user.save();

    return sendAccount(req.user.id, res, "Address saved");

})


const updateAddress = catchAsync(async (req, res, next) => {

    const { addressId } = req.params;

    const user = await User.findById(req.user.id);
    const address = user.addresses.id(addressId);

    if (!address) {
        return next(new AppError("Address not found", 404));
    }

    Object.assign(address, readAddress(req.body));

    if (req.body.isDefault) {
        markDefault(user, address._id);
    }

    await user.save();

    return sendAccount(req.user.id, res, "Address updated");

})


const removeAddress = catchAsync(async (req, res, next) => {

    const { addressId } = req.params;

    const user = await User.findById(req.user.id);
    const address = user.addresses.id(addressId);

    if (!address) {
        return next(new AppError("Address not found", 404));
    }

    const wasDefault = address.isDefault;

    address.deleteOne();

    /* Removing the default promotes whatever is left, so the account never
       sits with addresses but nowhere to send anything by default. */
    if (wasDefault && user.addresses.length > 0) {
        markDefault(user, user.addresses[0]._id);
    }

    await user.save();

    return sendAccount(req.user.id, res, "Address removed");

})


module.exports = {
    getMe,
    updateMe,
    setTwoFactor,
    getAddresses,
    addAddress,
    updateAddress,
    removeAddress,
    getFavorites,
    addFavorite,
    removeFavorite,
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart
}
