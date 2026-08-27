const mongoose = require("mongoose");

/**
 * An uploaded image, stored in MongoDB rather than on disk.
 *
 * The API runs as serverless functions, whose filesystem is read-only and
 * thrown away between invocations — a file written during an upload would not
 * exist by the time the browser asked for it, and would not exist at all on
 * the next deployment. The bytes therefore live in the database, next to the
 * product documents that reference them, and are served back by
 * media.controller.
 *
 * `data` is excluded by default: a console listing media must not drag several
 * megabytes of image per row across the wire. The one place that wants the
 * bytes asks for them explicitly with `.select("+data")`.
 */
const mediaSchema = new mongoose.Schema(
    {
        data: {
            type: Buffer,
            required: true,
            select: false
        },

        contentType: {
            type: String,
            required: true
        },

        size: {
            type: Number,
            required: true
        },

        /* Kept for auditing: who put this in the catalogue. */
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
);

const Media = mongoose.models.Media || mongoose.model("Media", mediaSchema);

module.exports = Media;
