const { default: mongoose } = require("mongoose");
const Product = require("../models/product.model");
const catchAsync = require("../utils/catchAsync.util");
const AppError = require("../utils/AppError.util");

const getProducts = catchAsync(async (req, res, next) => {

    const products = await Product.find();

    return res.json({
        status: "succasse",
        data: products
    })


})

const getProductsById = catchAsync(async (req, res, next) => {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError("Id is invalid", 404));
    }

    const product = await Product.findById(id);

    if (!product) {
        return next(new AppError("Product not found", 404));
    }

    return res.json({
        status: "succasse",
        data: product
    })


})

const createProduct = catchAsync(async (req, res, next) => {

    const {
        name,
        slug,
        category,
        price,
        previousPrice,
        image,
        images,
        description,
        details,
        colors,
        sizes,
        badge,
        collections,
        stock,
        isActive
    } = req.body;

    if (!name || !slug || !category || !price || !image || !description) {
        return next(new AppError("Name, slug, category, price, image and description are required", 400));
    }

    const product = await Product.create({
        name,
        slug,
        category,
        price,
        previousPrice,
        image,
        images,
        description,
        details,
        colors,
        sizes,
        badge,
        collections,
        stock,
        isActive
    })

    return res.status(201).json({
        status: "succasse",
        message: "Product created successfully",
        data: product
    })


})


const deleteProductById = catchAsync(async (req, res, next) => {

    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError("Id is invalid", 404));
    }

    const product = await Product.findById(id);

    if (!product) {
        return next(new AppError("Product not found", 404));
    }

    await Product.findByIdAndDelete(id);

    return res.json({
        status: "succasse",
        message: "Product deleted succassefuly"
    })


})


const updateProductById = catchAsync(async (req, res, next) => {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError("Id is invalid", 404));
    }

    const product = await Product.findById(id);

    if (!product) {
        return next(new AppError("Product not found", 404));
    }

    const {
        name,
        slug,
        category,
        price,
        previousPrice,
        image,
        images,
        description,
        details,
        colors,
        sizes,
        badge,
        collections,
        rating,
        reviewCount,
        stock,
        isActive
    } = req.body;

    /* Compared against undefined rather than tested for truthiness: a price of
       0, an empty gallery and isActive === false are all real values the form
       can send, and a truthy check would quietly drop every one of them. */
    if (name !== undefined) product.name = name;
    if (slug !== undefined) product.slug = slug;
    if (category !== undefined) product.category = category;
    if (price !== undefined) product.price = price;
    if (image !== undefined) product.image = image;
    if (images !== undefined) product.images = images;
    if (description !== undefined) product.description = description;
    if (details !== undefined) product.details = details;
    if (colors !== undefined) product.colors = colors;
    if (sizes !== undefined) product.sizes = sizes;
    if (collections !== undefined) product.collections = collections;
    if (rating !== undefined) product.rating = rating;
    if (reviewCount !== undefined) product.reviewCount = reviewCount;
    if (stock !== undefined) product.stock = stock;
    if (isActive !== undefined) product.isActive = isActive;

    /* The two optional fields. Sending them back empty is how the form says
       "this piece is no longer on sale" and "drop the badge" — storing "" would
       fail the enum and the minimum instead. */
    if (previousPrice !== undefined) {
        product.previousPrice = previousPrice === "" || previousPrice === null ? undefined : previousPrice;
    }

    if (badge !== undefined) {
        product.badge = badge === "" || badge === null ? undefined : badge;
    }

    /* save() rather than findByIdAndUpdate() so every validator on the schema
       runs against the finished document. */
    await product.save();

    return res.json({
        status: "succasse",
        message: "Product updated successfully",
        data: product
    })


})


const uploadProductImages = catchAsync(async (req, res, next) => {

    if (!req.files || req.files.length === 0) {
        return next(new AppError("Choose at least one image", 400));
    }

    /* Built from the incoming request so the same code serves localhost and a
       deployed host without a second base-url setting to keep in sync. */
    const base = `${req.protocol}://${req.get("host")}/uploads/products`;

    return res.status(201).json({
        status: "succasse",
        message: "Images uploaded successfully",
        data: req.files.map((file) => `${base}/${file.filename}`)
    })


})


module.exports = {
    getProducts,
    getProductsById,
    createProduct,
    updateProductById,
    deleteProductById,
    uploadProductImages
}