const { default: mongoose } = require("mongoose");
const User = require("../models/user.model");
const AppError = require("../utils/AppError.util");
const catchAsync = require("../utils/catchAsync.util");

const getUsers = catchAsync(async (req, res, next) => {

    const users = await User.find();

    return res.json({
        status: "succasse",
        data: users,
    })

})

const getUserByID = catchAsync(async (req, res, next) => {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError("Invalid user ID", 400));
    }

    const user = await User.findById(id);

    if (!user) {
        return next(new AppError("User not found", 404))
    }

    return res.json({
        status: "succasse",
        data: user,
    })

})

const deleteUserByID = catchAsync(async (req, res, next) => {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError("Invalid user ID", 400));
    }

    const user = await User.findById(id);

    if (!user) {
        return next(new AppError("User not found", 404))
    }

    /* Deleting the account you are signed in with logs you out of a console
       you may be the only key to. Refuse it rather than explain it after. */
    if (req.user && String(req.user.id) === String(user.id)) {
        return next(new AppError("You cannot delete the account you are signed in with", 400));
    }

    if (await wouldRemoveLastAdmin(user)) {
        return next(new AppError("This is the only admin left — promote somebody else first", 400));
    }

    await User.findByIdAndDelete(id);

    return res.json({
        status: "succasse",
        message: "User deleted successfully",
    })



})


const ROLES = ["admin", "moderator", "user"];

/**
 * The last admin cannot be demoted or deleted.
 *
 * Without this the console can lock everybody out of itself in one click, and
 * the only way back is the grant-role script — so the check lives here, on the
 * server, where both the edit screen and the delete button have to pass it.
 */
const wouldRemoveLastAdmin = async (user) => {

    if (user.role !== "admin") {
        return false;
    }

    const admins = await User.countDocuments({ role: "admin" });

    return admins <= 1;

}


const updateUserByID = catchAsync(async (req, res,  next) => {

    const { id } = req.params;
    const { fullname, email, password, role, isVerifed } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError("Invalid user ID", 400));
    }

    const user = await User.findById(id);

    if (!user) {
        return next(new AppError("User not found", 404))
    }

    if (role !== undefined) {
        if (!ROLES.includes(role)) {
            return next(new AppError("That is not a role this store recognises", 400));
        }

        if (role !== user.role && await wouldRemoveLastAdmin(user)) {
            return next(new AppError("This is the only admin left — promote somebody else first", 400));
        }

        user.role = role;
    }

    if (fullname) user.fullname = fullname;
    if (email) user.email = email;

    /* A Google account has no password of ours, and setting one would let it
       be signed into locally, around Google. */
    if (password) {
        if (user.provider !== "local") {
            return next(new AppError("This account signs in with Google — it has no password to change", 400));
        }

        user.password = password;
    }

    if (isVerifed !== undefined) user.isVerifed = Boolean(isVerifed);

    await user.save();

    return res.json({
        status: "succasse",
        message: "User updated successfully",
        data: user,
    })


})


/**
 * Creates an account from the admin console, with its role, skipping the
 * confirmation email entirely — an admin typing the address in is the proof
 * that signup's email round trip exists to provide.
 */
const createUser = catchAsync(async (req, res, next) => {

    const { fullname, email, password, role } = req.body;

    if (!fullname || !email || !password) {
        return next(new AppError("Name, email and password are all required", 400));
    }

    if (role !== undefined && !ROLES.includes(role)) {
        return next(new AppError("That is not a role this store recognises", 400));
    }

    const taken = await User.findOne({ email: String(email).trim() });

    if (taken) {
        return next(new AppError("An account already uses that email", 409));
    }

    const user = await User.create({
        fullname,
        email: String(email).trim(),
        password,
        role: role ?? "user",
        isVerifed: true
    });

    return res.status(201).json({
        status: "succasse",
        message: "Account created",
        data: user,
    })


})


module.exports = {
    getUsers,
    getUserByID,
    deleteUserByID,
    updateUserByID,
    createUser,
}
