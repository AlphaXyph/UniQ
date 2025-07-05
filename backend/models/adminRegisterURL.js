const mongoose = require("mongoose");

const adminRegisterURLSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    randomString: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("AdminRegisterURL", adminRegisterURLSchema);