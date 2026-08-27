/**
 * Hands an existing account a console role.
 *
 * Signing up always creates a plain `user`, so the very first admin has to be
 * made from outside the app — otherwise nobody can reach /admin-console to
 * promote anyone.
 *
 *   npm run grant-role -- you@example.com admin
 *   npm run grant-role -- them@example.com moderator
 */

require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");
const User = require("../models/user.model");

const ROLES = ["admin", "moderator", "user"];

const [email, role] = process.argv.slice(2);

const run = async () => {
    if (!email || !ROLES.includes(role)) {
        console.error("Usage: npm run grant-role -- <email> <admin|moderator|user>");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOneAndUpdate(
        { email: email.trim() },
        { role },
        { new: true }
    );

    if (!user) {
        console.error(`No account found for ${email}. Sign up first, then run this again.`);
        await mongoose.disconnect();
        process.exit(1);
    }

    console.log(`${user.email} is now ${user.role}.`);

    await mongoose.disconnect();
};

run().catch(async (error) => {
    console.error(error.message);
    await mongoose.disconnect();
    process.exit(1);
});
