
const AppError = require("../utils/AppError.util");

const handleCastError = (err) =>
    new AppError(`Invalid ${err.path}: ${err.value}.`, 400);

const handleDuplicateFields = (err) => {
    const field = Object.keys(err.keyValue || {})[0];
    return new AppError(`'${field}' already in use. Please use another value.`, 409);
};

const handleValidationError = (err) => {
    const messages = Object.values(err.errors).map((e) => e.message);
    return new AppError(`Invalid input. ${messages.join(" ")}`, 400);
};

const handleJWTError = () =>
    new AppError("Invalid token. Please log in again!", 401);
const handleJWTExpired = () =>
    new AppError("Your session has expired. Please log in again!", 401);

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        success: false,
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
        errors: err.details || []
    });
};

const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message
        });
    }

    res.status(500).json({
        success: false,
        status: "error",
        message: "Something went wrong!"
    });
};

const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (process.env.NODE_ENV === "dev") {
        return sendErrorDev(err, res);
    }

    let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
    error.message = err.message;

    if (err.name === "CastError") error = handleCastError(err);
    if (err.code === 11000) error = handleDuplicateFields(err);
    if (err.name === "ValidationError") error = handleValidationError(err);
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleJWTExpired();

    sendErrorProd(error, res);
};

module.exports = globalErrorHandler;
