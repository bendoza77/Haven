const passport = require("passport");
const User = require("../models/user.model");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();


passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
    },

    async (accessToken, refreshToken, profile, done) => {
        try {

            let user = await User.findOne({providerId: profile.id});

            if (!user) {
                user = await User.findOne({email: profile.emails[0].value});

                if (!user) {
                    user = await User.create({
                        fullname: profile.displayName,
                        email: profile.emails?.[0]?.value,
                        profile: profile.photos?.[0]?.value,
                        provider: "google",
                        providerId: profile.id,
                        /* Google has already proved this address, so there is
                           nothing for us to confirm — and login must not gate
                           an account that can never receive our link. */
                        isVerifed: true
                    })
                } else {
                    user.providerId = profile.id;
                    /* Signing in through Google proves the address on an
                       account that started out as a local sign-up. */
                    user.isVerifed = true;
                    await user.save();
                }
            }

            done(null, user);

        } catch(err) {
            done(err);
        }
    }
))