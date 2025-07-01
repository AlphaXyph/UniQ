const mongoose = require("mongoose");

const adminRegisterTokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model("AdminRegisterToken", adminRegisterTokenSchema);