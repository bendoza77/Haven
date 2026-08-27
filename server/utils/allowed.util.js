const AppError = require("./AppError.util")

/**
 * Role gate for the console routes. Always runs after `protect`, which is what
 * puts the account document on `req.user` — the role lives there, not on the
 * request itself.
 */
const allowed = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError("You don't have permission to do this action", 403));
        }

        next();
    }
}

module.exports = allowed;
