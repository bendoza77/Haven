const express = require("express");
const { getMedia } = require("../controllers/media.controller");

const mediaRouter = express.Router();

/* Public: the storefront draws these for signed-out visitors. Uploading is
   staff-only and lives on the product router. */
mediaRouter.get("/:id", getMedia);

module.exports = mediaRouter;
