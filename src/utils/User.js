const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, 
    firstName: { type: String, required: true },
    userName: { type: String },
    address: { type: String, sparse: true, default: null }, 
    balance: { type: Number, default: 0 },
    }, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);