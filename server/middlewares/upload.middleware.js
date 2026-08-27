const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const AppError = require("../utils/AppError.util");

/* Files land on disk under /uploads and are served back as static assets by
   app.js. The folder is created on boot so a fresh clone works without any
   manual setup. */
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "products");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },

    filename: (req, file, cb) => {
        /* Never trust the name the browser sends: keep only the extension and
           build the rest, so two people uploading "sofa.jpg" do not collide and
           nobody can write outside the folder. */
        const extension = path.extname(file.originalname).toLowerCase().slice(0, 10);
        const unique = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

        cb(null, `${unique}${extension || ".jpg"}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
        return cb(new AppError("Only JPEG, PNG, WebP, AVIF and GIF images can be uploaded", 400));
    }

    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 8
    }
});

/** Accepts up to eight files on the `images` field. */
const uploadImages = upload.array("images", 8);

/* Multer throws its own error class, which the global handler would report as
   a 500. This turns the ones a user can actually cause into 400s. */
const handleUploadErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return next(new AppError("Each image must be 5 MB or smaller", 400));
        }

        if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
            return next(new AppError("You can upload up to 8 images at a time", 400));
        }

        return next(new AppError(err.message, 400));
    }

    next(err);
};

module.exports = {
    uploadImages,
    handleUploadErrors,
    UPLOAD_DIR
};
