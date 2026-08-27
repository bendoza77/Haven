const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
        required: [true, "A review has to belong to a product"],
        index: true
    },

    /* Kept as a reference rather than a copied name, so a shopper who changes
       their name changes it everywhere they have written. */
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: [true, "A review has to belong to an account"]
    },

    rating: {
        type: Number,
        required: [true, "Choose a rating from 1 to 5"],
        min: [1, "The lowest rating is 1"],
        max: [5, "The highest rating is 5"]
    },

    title: {
        type: String,
        trim: true,
        maxlength: [120, "A review title must be less than 120 characters"]
    },

    body: {
        type: String,
        required: [true, "Write a few words about the piece"],
        trim: true,
        minlength: [10, "A review must be at least 10 characters"],
        maxlength: [2000, "A review must be less than 2000 characters"]
    }
}, { timestamps: true });

/* One review per person per piece. Without this the average is trivially
   moved by anybody willing to submit the same form twice. */
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

/**
 * Recomputes a product's rating and reviewCount from the reviews it actually
 * has, and writes them back.
 *
 * The two fields on Product are a cache of this aggregate — the storefront
 * reads them on every card and would otherwise have to count reviews for each
 * one. Every path that writes or removes a review calls this, so the cache is
 * never left describing a set of reviews that no longer exists.
 */
reviewSchema.statics.syncProduct = async function (productId) {
    const Product = mongoose.model("Product");

    const [summary] = await this.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
        {
            $group: {
                _id: "$product",
                reviewCount: { $sum: 1 },
                rating: { $avg: "$rating" }
            }
        }
    ]);

    await Product.findByIdAndUpdate(productId, {
        reviewCount: summary?.reviewCount ?? 0,
        /* One decimal is all the storefront draws, and it keeps the stored
           value from carrying precision the average does not deserve. */
        rating: summary ? Math.round(summary.rating * 10) / 10 : 0
    });
};

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
