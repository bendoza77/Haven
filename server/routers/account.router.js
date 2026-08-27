const express = require("express");
const {
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
} = require("../controllers/account.controller");
const protect = require("../middlewares/protect.middleware");

const accountRouter = express.Router();

/* Everything here is the signed-in shopper's own account — there is no id in
   any path, so one account can never reach another's bag or saved list. */
accountRouter.use(protect);

accountRouter.route("/me").get(getMe).patch(updateMe);

accountRouter.patch("/me/two-factor", setTwoFactor);

accountRouter.route("/me/addresses").get(getAddresses).post(addAddress);
accountRouter.route("/me/addresses/:addressId").patch(updateAddress).delete(removeAddress);

accountRouter.get("/me/favorites", getFavorites);
accountRouter.route("/me/favorites/:productId").post(addFavorite).delete(removeFavorite);

accountRouter.route("/me/cart").get(getCart).post(addToCart).delete(clearCart);
accountRouter.route("/me/cart/:itemId").patch(updateCartItem).delete(removeCartItem);

module.exports = accountRouter;
