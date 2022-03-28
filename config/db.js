const mongoose = require('mongoose');
//const config = require('config');
//const db = config.get('mongoURI');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.mongoURI);

        console.log('Mongo DB connected');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

module.exports = connectDB;
