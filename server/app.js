require("dotenv").config();

const path = require("path");
const express = require("express");
const connectDB = require("./configs/db.config");
const userRouter = require("./routers/user.router");
const globalErrorHandler = require("./controllers/error.controller");
const cookieParser = require("cookie-parser");
const authRouter = require("./routers/auth.router");
const productRouter = require("./routers/product.router");
const accountRouter = require("./routers/account.router");
const reviewRouter = require("./routers/review.router");
const orderRouter = require("./routers/order.router");
const cors = require("cors");
const passport = require("passport");
require("./configs/passport.config");

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ["POST", "DELETE", "GET", "PATCH"],
    credentials: true
}))

app.use(passport.initialize())


app.use(express.json());
app.use(cookieParser());

/* Uploaded product photography, served straight off disk. crossOriginResourcePolicy
   is relaxed because the images are rendered by the client on another origin. */
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res) => res.set("Cross-Origin-Resource-Policy", "cross-origin")
}));

app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/account", accountRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/orders", orderRouter);

app.use(globalErrorHandler);

app.listen(process.env.PORT, () => {
    connectDB();
    console.log("Server is running")
})

