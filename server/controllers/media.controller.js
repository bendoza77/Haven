const mongoose = require("mongoose");
const Media = require("../models/media.model");
const AppError = require("../utils/AppError.util");
const catchAsync = require("../utils/catchAsync.util");

/**
 * Serves one uploaded image.
 *
 * Open on purpose — these are shop photographs, and the storefront renders
 * them for signed-out visitors. The id is the only thing that addresses one,
 * and ids are handed out by the upload endpoint, which is staff-only.
 *
 * The bytes behind an id never change: an edit uploads a new image and points
 * the product at the new id. That makes the response immutable, so the CDN and
 * the browser may keep it forever instead of asking again — which matters here
 * more than usual, since every miss costs a database read.
 */
const getMedia = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    /* Strip any extension the client tacked on for readability — /media/<id>.jpg
       and /media/<id> address the same record. */
    const mediaId = String(id).replace(/\.[a-z0-9]+$/i, "");

    if (!mongoose.Types.ObjectId.isValid(mediaId)) {
        return next(new AppError("Image not found", 404));
    }

    const media = await Media.findById(mediaId).select("+data");

    if (!media) {
        return next(new AppError("Image not found", 404));
    }

    res.set({
        "Content-Type": media.contentType,
        "Content-Length": media.data.length,
        "Cache-Control": "public, max-age=31536000, immutable",
        /* The storefront may sit on a different origin to the API. */
        "Cross-Origin-Resource-Policy": "cross-origin",
        ETag: `"${media.id}"`
    });

    if (req.headers["if-none-match"] === `"${media.id}"`) {
        return res.status(304).end();
    }

    return res.send(media.data);
});

module.exports = { getMedia };
