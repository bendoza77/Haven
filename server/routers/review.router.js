const express = require("express");
const {
    getReviews,
    updateReviewById,
    deleteReviewById
} = require("../controllers/review.controller");
const protect = require("../middlewares/protect.middleware");
const allowed = require("../utils/allowed.util");

const reviewRouter = express.Router();

/* Reviews of one piece are read through the product router, where they are
   public. Everything here is either console work or somebody's own writing,
   so all of it needs an account. */
reviewRouter.use(protect);

/* The whole roster of reviews is what both console screens draw: the admin
   edits and removes from it, the moderator only reads it. */
reviewRouter.get("/", allowed("admin", "moderator"), getReviews);

/* No `allowed` here on purpose — a shopper may change their own review and an
   admin may change anybody's, and only the controller knows which is which. */
reviewRouter.route("/:id")
    .patch(updateReviewById)
    .delete(deleteReviewById);

module.exports = reviewRouter;
