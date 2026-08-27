const express = require("express");
const {
    getProducts,
    getProductsById,
    createProduct,
    updateProductById,
    deleteProductById,
    uploadProductImages
} = require("../controllers/product.controller");
const protect = require("../middlewares/protect.middleware");
const allowed = require("../utils/allowed.util");
const { uploadImages, handleUploadErrors } = require("../middlewares/upload.middleware");
const { uploadLimiter, writeLimiter } = require("../middlewares/rateLimit.middleware");
const { getProductReviews, createReview } = require("../controllers/review.controller");

const productRouter = express.Router();

/* Reading the catalogue is what the storefront does, so it stays open. */
productRouter.get("/", getProducts);
productRouter.get("/:id", getProductsById);

/* Reviews of a piece are part of the shopfront copy, so reading them is open
   too. Writing one needs an account — `protect` is named on the route rather
   than left to the blanket call below, which comes after this line. */
productRouter.get("/:id/reviews", getProductReviews);
productRouter.post("/:id/reviews", protect, writeLimiter, createReview);

/* Everything past this line is console work and needs an account. */
productRouter.use(protect);

/* Declared before "/:id" so the literal path wins the match.
   handleUploadErrors sits between multer and the controller to turn a file
   that is too big or of the wrong type into a 400 instead of a 500. */
/* uploadLimiter sits after `allowed` so it can count against the staff account
   rather than the address — see the note on it in rateLimit.middleware. */
productRouter.post("/upload", allowed("admin", "moderator"), uploadLimiter, uploadImages, handleUploadErrors, uploadProductImages);

/* Adding is the one write a moderator is trusted with. Changing and removing
   what is already in the store is the admin's alone. */
productRouter.post("/", allowed("admin", "moderator"), createProduct);

productRouter.route("/:id")
    .patch(allowed("admin"), updateProductById)
    .delete(allowed("admin"), deleteProductById);

module.exports = productRouter;
