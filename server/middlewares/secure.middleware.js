const mongoSanitize = require("express-mongo-sanitize");

const mongodbMiddlware = (req, res, next) => {

    const option = { replaceWith: "_" };

    if (req.body) mongoSanitize.sanitize(req.body, option);

    if (req.params) mongoSanitize.sanitize(req.params, option);

    if (req.query) mongoSanitize.sanitize(req.query, option);

    next();


}

module.exports = mongodbMiddlware