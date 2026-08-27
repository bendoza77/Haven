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

const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);

/* The second step of a two-step sign-in. Reachable without a session — there
   is no session yet, which is the whole point of the step. */
authRouter.post("/verify-2fa", verifyTwoFactor);
authRouter.post("/resend-2fa", resendTwoFactor);

/* Both links arrive from an inbox, so they are reachable without a session —
   holding the token is the proof. */
authRouter.post("/verify-email/:token", verifyEmail);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/resend-verification", resendVerification);
authRouter.patch("/reset-password/:token", resetPassword);

authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
authRouter.get("/google/callback", passport.authenticate("google", { session: false, scope: ["profile", "email"], failureRedirect: `${process.env.CLIENT_URL}/register` }), googleCallback);

authRouter.use(protect)
authRouter.get("/auto-login", autoLogin);
authRouter.post("/logout", logout);

module.exports = authRouter;
