const express = require("express");
const { getUsers, getUserByID, deleteUserByID, updateUserByID, createUser } = require("../controllers/user.controller");
const protect = require("../middlewares/protect.middleware");
const allowed = require("../utils/allowed.util");

const userRouter = express.Router();


userRouter.use(protect);

/* Reading the roster is staff work; everything that changes an account is the
   admin's alone — a moderator adds products and nothing else. */
userRouter.route("/")
    .get(allowed("admin", "moderator"), getUsers)
    .post(allowed("admin"), createUser);

userRouter.route("/:id")
    .get(allowed("admin", "moderator"),getUserByID)
    .delete(allowed("admin"), deleteUserByID)
    .patch(allowed("admin"), updateUserByID);

module.exports = userRouter;
