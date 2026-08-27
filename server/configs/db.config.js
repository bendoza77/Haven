const mongoose = require("mongoose");
const dns = require("dns/promises");
dns.setServers(["8.8.8.8", "8.8.4.4"]);



const connectDB = async () => {
    try {

        await mongoose.connect(process.env.MONGO_URI);

    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

module.exports = connectDB;