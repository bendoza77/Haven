const jwt = require("jsonwebtoken");
const ms = require("ms");
const catchAsync = require("../utils/catchAsync.util");
const AppError = require("../utils/AppError.util");
const User = require("../models/user.model");
const { sendVerificationEmail, sendPasswordResetEmail, sendTwoFactorCodeEmail } = require("../utils/email.util");

const sendSignToken = (user, res) => {

    const token = user.signToken();

    res.cookie("hv", token, {
        maxAge: ms(process.env.JWT_EXPIRES),
        httpOnly: true,
        secure: process.env.NODE_ENV === "prod",
        sameSite: process.env.NODE_ENV === "prod" ? "None" : "Lax",
    })

    


}

/* The fields of a saved piece or a bag line the storefront actually draws. */
const PRODUCT_FIELDS = "name slug category price previousPrice image images badge rating reviewCount stock isActive sizes colors";

/* Signing in hands back the bag and the saved list along with the account, so
   the header can show its counts without a second request. */
const withLists = (id) =>
    User.findById(id)
        .populate("favoriteProducts", PRODUCT_FIELDS)
        .populate("cart.product", PRODUCT_FIELDS);

const createSendToken = async (user, statusCode, message, res) => {

    sendSignToken(user, res);

    return res.status(statusCode).json({
        status: "succasse",
        data: await withLists(user.id),
        message: message
    })


}


/* Where the one-time links in the emails point. */
const clientLink = (path) => `${process.env.CLIENT_URL}${path}`;

/**
 * Puts a fresh verification link in the shopper's inbox.
 *
 * The token is saved before the send so a delivery failure cannot leave a
 * link in an inbox that the database has never heard of.
 */
const issueVerification = async (user) => {

    const token = user.createEmailVerificationToken();

    await user.save({ validateBeforeSave: false });

    await sendVerificationEmail({
        to: user.email,
        name: user.fullname,
        url: clientLink(`/verify-email/${token}`)
    });

}


const signup = catchAsync(async (req, res, next) => {

    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
        return next(new AppError("All field is required", 400));
    }

    const user = await User.create({
        fullname,
        email,
        password
    })

    /* An address that cannot receive the link is an address we should not have
       taken, so the account goes with it rather than being left half-made. */
    try {
        await issueVerification(user);
    } catch (error) {
        await User.findByIdAndDelete(user.id);
        return next(new AppError(`We could not send the confirmation email: ${error.message}`, 502));
    }

    /* No cookie yet, on purpose. Creating the account proves somebody typed an
       address; following the link proves they can read it. The session starts
       at the second step, in verifyEmail. */
    return res.status(201).json({
        status: "succasse",
        message: "Account created — check your inbox to confirm your email",
        data: {
            email: user.email,
            fullname: user.fullname
        }
    })


})


const verifyEmail = catchAsync(async (req, res, next) => {

    const { token } = req.params;

    /* The raw token never touches the database: it is hashed and the hash is
       what is matched, along with a deadline that has not passed. */
    const user = await User.findOne({
        emailVerificationToken: User.hashToken(token),
        emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(new AppError("That confirmation link is invalid or has expired", 400));
    }

    user.isVerifed = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save({ validateBeforeSave: false });

    /* Confirming the address is also a sign-in — nobody should have to type
       their password again straight after proving they own the inbox. */
    await createSendToken(user, 200, "Your email is confirmed", res);


})


const resendVerification = catchAsync(async (req, res, next) => {

    /* Reachable without a session: after signing up there is no session yet,
       and the link in that first email is exactly the one people lose. */
    const email = req.body?.email ?? req.user?.email;

    if (!email) {
        return next(new AppError("Enter the email address on your account", 400));
    }

    /* Same answer either way, like forgot-password — this must not become a
       way to find out which addresses are registered. */
    const answer = () =>
        res.json({
            status: "success",
            message: "If that address needs confirming, a new link is on its way"
        });

    const user = await User.findOne({ email: String(email).trim() });

    if (!user || user.isVerifed || user.provider !== "local") {
        return answer();
    }

    await issueVerification(user);

    return answer();


})


const forgotPassword = catchAsync(async (req, res, next) => {

    const { email } = req.body;

    if (!email) {
        return next(new AppError("Enter the email address on your account", 400));
    }

    const user = await User.findOne({ email: email.trim() });

    /* Always the same answer, whether or not the address is on file. Telling
       a stranger which emails have accounts is telling them too much. */
    const answer = () =>
        res.json({
            status: "success",
            message: "If that address has an account, a reset link is on its way"
        });

    if (!user) {
        return answer();
    }

    /* Google accounts have no password of ours to reset. */
    if (user.provider !== "local") {
        return answer();
    }

    const token = user.createPasswordResetToken();

    await user.save({ validateBeforeSave: false });

    try {
        await sendPasswordResetEmail({
            to: user.email,
            name: user.fullname,
            url: clientLink(`/reset-password/${token}`)
        });
    } catch (error) {
        /* A link nobody received must not stay live. */
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError(`We could not send the reset email: ${error.message}`, 502));
    }

    return answer();


})


const resetPassword = catchAsync(async (req, res, next) => {

    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
        return next(new AppError("Choose a new password", 400));
    }

    const user = await User.findOne({
        passwordResetToken: User.hashToken(token),
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(new AppError("That reset link is invalid or has expired", 400));
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    /* Reaching the inbox proves the address, so the account counts as
       confirmed from here whether or not it was before. */
    user.isVerifed = true;

    await user.save();

    await createSendToken(user, 200, "Your password has been changed", res);


})

const login = catchAsync(async (req, res, next) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError("All field is required"));
    }

    const user = await User.findOne({email: email}).select("+password");

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    /* A Google account has no password of ours to compare against. */
    if (!user.password) {
        return next(new AppError("This account signs in with Google", 400));
    }

    const verifyUser = await user.comparePassword(password, user.password);

    if (!verifyUser) {
        return next(new AppError("Email or Password is incorrect", 400));
    }

    /* The gate that makes signup's gate mean anything. Without it, anybody who
       ignored the email could simply sign in instead. Google accounts are
       exempt — Google has already proved the address. */
    if (user.provider === "local" && !user.isVerifed) {
        return next(
            new AppError(
                "Confirm your email before signing in — check your inbox for the link we sent you",
                403
            )
        );
    }

    /* Two-step accounts stop here. The password was right, which is exactly
       what earns a code — and nothing else. No cookie is set, so a correct
       password on its own is not a session. */
    if (user.twoFactorEnabled) {
        const code = user.createTwoFactorCode();

        await user.save({ validateBeforeSave: false });

        try {
            await sendTwoFactorCodeEmail({ to: user.email, name: user.fullname, code });
        } catch (error) {
            /* A code nobody received must not stay live. */
            user.twoFactorCode = undefined;
            user.twoFactorExpires = undefined;
            await user.save({ validateBeforeSave: false });

            return next(new AppError(`We could not send your sign-in code: ${error.message}`, 502));
        }

        return res.json({
            status: "success",
            twoFactorRequired: true,
            message: "We have emailed you a six-digit code",
            data: { email: user.email }
        });
    }

    await createSendToken(user, 200, "User login succassefuly", res);

})


/* Wrong codes allowed against one issued code before it is burned. */
const MAX_CODE_ATTEMPTS = 5;

/**
 * Finishes a two-step sign-in.
 *
 * Deliberately says the same thing for a wrong code, an expired one and an
 * address with no pending code — anything more precise tells somebody holding
 * a stolen password which half of the puzzle they have got right.
 */
const verifyTwoFactor = catchAsync(async (req, res, next) => {

    const { email, code } = req.body;

    if (!email || !code) {
        return next(new AppError("Enter the six-digit code we emailed you", 400));
    }

    const wrong = () => next(new AppError("That code is wrong or has expired", 400));

    const user = await User.findOne({ email: String(email).trim() })
        .select("+twoFactorCode +twoFactorExpires +twoFactorAttempts");

    if (!user || !user.twoFactorCode || !user.twoFactorExpires) {
        return wrong();
    }

    if (user.twoFactorExpires.getTime() < Date.now()) {
        user.twoFactorCode = undefined;
        user.twoFactorExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return wrong();
    }

    if (user.twoFactorCode !== User.hashToken(String(code).trim())) {
        user.twoFactorAttempts = (user.twoFactorAttempts ?? 0) + 1;

        /* Burn the code rather than lock the account: the next sign-in issues
           a fresh one, so a stranger guessing cannot keep anybody out. */
        if (user.twoFactorAttempts >= MAX_CODE_ATTEMPTS) {
            user.twoFactorCode = undefined;
            user.twoFactorExpires = undefined;
        }

        await user.save({ validateBeforeSave: false });

        return wrong();
    }

    user.twoFactorCode = undefined;
    user.twoFactorExpires = undefined;
    user.twoFactorAttempts = 0;

    await user.save({ validateBeforeSave: false });

    await createSendToken(user, 200, "Signed in", res);

})


/** Sends a fresh code, replacing whatever was outstanding. */
const resendTwoFactor = catchAsync(async (req, res, next) => {

    const { email } = req.body;

    if (!email) {
        return next(new AppError("Enter the email address on your account", 400));
    }

    /* Same answer either way — this must not become a way to find out which
       addresses have two-step turned on. */
    const answer = () =>
        res.json({
            status: "success",
            message: "If that account is waiting on a code, a new one is on its way"
        });

    const user = await User.findOne({ email: String(email).trim() });

    if (!user || !user.twoFactorEnabled) {
        return answer();
    }

    const code = user.createTwoFactorCode();

    await user.save({ validateBeforeSave: false });

    await sendTwoFactorCodeEmail({ to: user.email, name: user.fullname, code });

    return answer();

})

const autoLogin = catchAsync(async (req, res, next) => {


    if (req.user) {
        return res.json({
            status: "succasse",
            data: await withLists(req.user.id)
        })
    }


})


const logout = catchAsync(async (req, res, next) => {

    res.cookie("hv", "", {
        maxAge: 0,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "prod" ? "None" : "Lax",
        secure: process.env.NODE_ENV === "prod"
    });

    return res.json({
        status: "success",
        message: "Logged out successfully"
    });


})

const googleCallback = catchAsync(async (req, res, next) => {

    sendSignToken(req.user, res);
    res.redirect(`${process.env.CLIENT_URL}/`);

})

module.exports = {
    signup,
    login,
    verifyTwoFactor,
    resendTwoFactor,
    logout,
    autoLogin,
    googleCallback,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword
}