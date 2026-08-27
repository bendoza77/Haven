const multer = require("multer");
const AppError = require("../utils/AppError.util");

/**
 * Incoming images are held in memory and handed to the media store, which puts
 * them in MongoDB. Nothing is written to disk: the API runs as serverless
 * functions whose filesystem is read-only and discarded between invocations,
 * so a file saved during an upload would be gone before it could be served.
 */
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

/* The platform refuses a request body larger than 4.5 MB before it ever
   reaches this code, so the per-file ceiling sits under that with room for the
   multipart framing. The console uploads one file per request, which keeps a
   multi-image selection within the limit however many pieces are chosen. */
const MAX_FILE_BYTES = 4 * 1024 * 1024;

const MAX_FILES = 8;

const fileFilter = (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
        return cb(new AppError("Only JPEG, PNG, WebP, AVIF and GIF images can be uploaded", 400));
    }

    cb(null, true);
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
        fileSize: MAX_FILE_BYTES,
        files: MAX_FILES
    }
});

/** Accepts up to eight files on the `images` field. */
const uploadImages = upload.array("images", MAX_FILES);

/* Multer throws its own error class, which the global handler would report as
   a 500. This turns the ones a user can actually cause into 400s. */
const handleUploadErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return next(new AppError("Each image must be 4 MB or smaller", 400));
        }

        if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
            return next(new AppError(`You can upload up to ${MAX_FILES} images at a time`, 400));
        }

        return next(new AppError(err.message, 400));
    }

    next(err);
};

module.exports = {
    uploadImages,
    handleUploadErrors,
    MAX_FILE_BYTES,
    MAX_FILES
};
