const mongoose = require("mongoose");

const colorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Colour name is required"],
        trim: true
    },

    hex: {
        type: String,
        required: [true, "Colour hex is required"],
        lowercase: true,
        match: [/^#[0-9a-f]{6}$/i, "Colour hex must look like #191512"]
    }
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
        minlength: [3, "Product name must be at least 3 characters"],
        maxlength: [120, "Product name must be less than 120 characters"]
    },

    slug: {
        type: String,
        required: [true, "Product slug is required"],
        unique: true,
        lowercase: true,
        trim: true
    },

    category: {
        type: String,
        required: [true, "Product category is required"],
        enum: {
            values: ["furniture", "lighting", "decor", "kitchen", "apparel", "accessories", "audio"],
            message: "{VALUE} is not a category we sell"
        }
    },

    price: {
        type: Number,
        required: [true, "Product price is required"],
        min: [0, "Price cannot be negative"]
    },

    previousPrice: {
        type: Number,
        min: [0, "Previous price cannot be negative"]
    },

    image: {
        type: String,
        required: [true, "Product image is required"]
    },

    images: {
        type: [String],
        default: []
    },

    description: {
        type: String,
        required: [true, "Product description is required"],
        trim: true,
        minlength: [20, "Product description must be at least 20 characters"]
    },

    details: {
        type: [String],
        default: []
    },

    colors: {
        type: [colorSchema],
        default: []
    },

    sizes: {
        type: [String],
        default: []
    },

    badge: {
        type: String,
        enum: {
            values: ["New", "Sale", "Bestseller"],
            message: "{VALUE} is not a badge the storefront renders"
        }
    },

    collections: {
        type: [String],
        enum: {
            values: ["featured", "new", "popular"],
            message: "{VALUE} is not a collection the storefront renders"
        },
        default: []
    },

    rating: {
        type: Number,
        default: 0,
        min: [0, "Rating cannot be below 0"],
        max: [5, "Rating cannot be above 5"]
    },

    reviewCount: {
        type: Number,
        default: 0,
        min: [0, "Review count cannot be negative"]
    },

    reviews: [
        {
            type: mongoose.Types.ObjectId,
            ref: "Review"
        }
    ],

    stock: {
        type: Number,
        default: 0,
        min: [0, "Stock cannot be negative"]
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
