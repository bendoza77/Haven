const express = require("express");
const {
    signup,
    login,
    googleCallback,
    autoLogin,
    logout,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    verifyTwoFactor,
    resendTwoFactor
} = require("../controllers/auth.controller");
const passport = require("passport");
const protect = require("../middlewares/protect.middleware");
const {
    authLimiter,
    emailLimiter,
    emailTargetLimiter,
    tokenLimiter
} = require("../middlewares/rateLimit.middleware");

const authRouter = express.Router();

/* Creating an account sends a confirmation email, so it is counted against the
   same budget as the other routes that spend a message. */
authRouter.post("/signup", emailLimiter, emailTargetLimiter, signup);

authRouter.post("/login", authLimiter, login);

/* The second step of a two-step sign-in. Reachable without a session — there
   is no session yet, which is the whole point of the step. */
authRouter.post("/verify-2fa", authLimiter, verifyTwoFactor);

/* The account layer burns a code after five wrong guesses, but a fresh code
   resets that count — so without a limit here, a six-digit code could be ground
   down by alternating guesses and resends. This is what closes that. */
authRouter.post("/resend-2fa", emailLimiter, emailTargetLimiter, resendTwoFactor);

/* Both links arrive from an inbox, so they are reachable without a session —
   holding the token is the proof. */
authRouter.post("/verify-email/:token", tokenLimiter, verifyEmail);
authRouter.post("/forgot-password", emailLimiter, emailTargetLimiter, forgotPassword);
authRouter.post("/resend-verification", emailLimiter, emailTargetLimiter, resendVerification);
authRouter.patch("/reset-password/:token", tokenLimiter, resetPassword);

authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
authRouter.get("/google/callback", passport.authenticate("google", { session: false, scope: ["profile", "email"], failureRedirect: `${process.env.CLIENT_URL}/register` }), googleCallback);

authRouter.use(protect)
authRouter.get("/auto-login", autoLogin);
authRouter.post("/logout", logout);

module.exports = authRouter;
