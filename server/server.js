/**
 * The local entry point.
 *
 * app.js exports the Express app without binding a port, because on Vercel the
 * platform imports it and calls it per request — there is no long-running
 * process to listen. Running the API on your own machine needs a port, so that
 * one line lives here and `npm run dev` / `npm start` point at this file.
 */
require("dotenv").config();

const app = require("./app");
const connectDB = require("./configs/db.config");

const port = process.env.PORT || 3001;

app.listen(port, async () => {
    try {
        await connectDB();
        console.log(`Server is running on http://localhost:${port}`);
    } catch (error) {
        console.error("Could not reach MongoDB:", error.message);
        process.exit(1);
    }
});
