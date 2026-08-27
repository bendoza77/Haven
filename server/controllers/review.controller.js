const mongoose = require("mongoose");
const Review = require("../models/review.model");
const Product = require("../models/product.model");
const AppError = require("../utils/AppError.util");
const catchAsync = require("../utils/catchAsync.util");

/* What the storefront and the consoles draw of the person who wrote. Nothing
   here is private — a review is signed in public by design. */
const AUTHOR_FIELDS = "fullname email profile";
const PRODUCT_FIELDS = "name slug image";

const isId = (value) => mongoose.Types.ObjectId.isValid(value);

/**
 * Finds a product by id or by slug.
 *
 * The storefront knows pieces by slug and the consoles know them by id, and
 * both ask for the same reviews — accepting either keeps one endpoint rather
 * than two that would have to stay in step.
 */
const findProduct = async (idOrSlug) => {
    if (isId(idOrSlug)) {
        const byId = await Product.findById(idOrSlug);
        if (byId) return byId;
    }

    return Product.findOne({ slug: String(idOrSlug).toLowerCase().trim() });
};


/** Public: every review on one piece, newest first. */
const getProductReviews = catchAsync(async (req, res, next) => {

    const product = await findProduct(req.params.id);

    if (!product) {
        return next(new AppError("Product not found", 404));
    }

    const reviews = await Review.find({ product: product.id })
        .populate("user", AUTHOR_FIELDS)
        .sort({ createdAt: -1 });

    return res.json({
        status: "succasse",
        data: reviews,
    })

})


/** Console: every review in the store, for the admin and moderator screens. */
const getReviews = catchAsync(async (req, res, next) => {

    const reviews = await Review.find()
        .populate("user", AUTHOR_FIELDS)
        .populate("product", PRODUCT_FIELDS)
        .sort({ createdAt: -1 });

    return res.json({
        status: "succasse",
        data: reviews,
    })

})


/**
 * Writes a review as the signed-in shopper.
 *
 * The author is taken from the session rather than the body — a review that
 * let its writer name somebody else would be worth nothing.
 */
const createReview = catchAsync(async (req, res, next) => {

    const { rating, title, body } = req.body;

    const product = await findProduct(req.params.id ?? req.body.product);

    if (!product) {
        return next(new AppError("Product not found", 404));
    }

    if (rating === undefined || body === undefined) {
        return next(new AppError("A rating and a few words are both required", 400));
    }

    const already = await Review.findOne({ product: product.id, user: req.user.id });

    if (already) {
        return next(new AppError("You have already reviewed this piece — edit that review instead", 409));
    }

    const review = await Review.create({
        product: product.id,
        user: req.user.id,
        rating,
        title,
        body
    });

    await Review.syncProduct(product.id);
    await Product.findOneAndUpdate(
    { fullname: req.body.product },
    {
        $push: {
        reviews: review._id
        }
    }
    );

    return res.status(201).json({
        status: "succasse",
        message: "Thank you — your review is published",
        data: await review.populate("user", AUTHOR_FIELDS),
    })

})


/**
 * Edits a review.
 *
 * The author may correct their own; an admin may edit any. A moderator reaches
 * neither — the console shows them reviews and nothing else.
 */
const updateReviewById = catchAsync(async (req, res, next) => {

    const { id } = req.params;
    const { rating, title, body } = req.body;

    if (!isId(id)) {
        return next(new AppError("Invalid review ID", 400));
    }

    const review = await Review.findById(id);

    if (!review) {
        return next(new AppError("Review not found", 404));
    }

    const isAuthor = String(review.user) === String(req.user.id);

    if (!isAuthor && req.user.role !== "admin") {
        return next(new AppError("You don't have permission to do this action", 403));
    }

    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (body !== undefined) review.body = body;

    await review.save();

    /* Only the average can have moved, but syncing unconditionally keeps one
       rule — every write to a review re-derives the product's figures. */
    await Review.syncProduct(review.product);

    return res.json({
        status: "succasse",
        message: "Review updated",
        data: await review.populate([
            { path: "user", select: AUTHOR_FIELDS },
            { path: "product", select: PRODUCT_FIELDS }
        ]),
    })

})


/** Removes a review. The author may remove their own; an admin may remove any. */
const deleteReviewById = catchAsync(async (req, res, next) => {

    const { id } = req.params;

    if (!isId(id)) {
        return next(new AppError("Invalid review ID", 400));
    }

    const review = await Review.findById(id);

    if (!review) {
        return next(new AppError("Review not found", 404));
    }

    const isAuthor = String(review.user) === String(req.user.id);

    if (!isAuthor && req.user.role !== "admin") {
        return next(new AppError("You don't have permission to do this action", 403));
    }

    const { product } = review;

    await Review.findByIdAndDelete(id);
    await Review.syncProduct(product);

    return res.json({
        status: "succasse",
        message: "Review removed",
    })

})


module.exports = {
    getProductReviews,
    getReviews,
    createReview,
    updateReviewById,
    deleteReviewById,
}
