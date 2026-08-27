const User = require("../models/user.model");
const AppError = require("../utils/AppError.util");
const catchAsync = require("../utils/catchAsync.util");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const protect = catchAsync(async (req, res, next) => {

    const hv = req.cookies?.hv;


    if (!hv) {
        return next(new AppError("Authorization required", 401));
    }

    const checkToken = await promisify(jwt.verify)(hv, process.env.JWT_SECRET);

    if (!checkToken) {
        return next(new AppError("Token is invalid", 401));
    }

    const user = await User.findById(checkToken.id);

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    req.user = user;

    next();

})

module.exports = protect;