const mongoose = require('mongoose');

const mongoDB = 'mongodb://127.0.0.1/my_databse';
mongoose.connect(mongoDB, { useNewUrlParser: true });

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));