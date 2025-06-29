const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
    },
    name: {
        type: String,
        required: true,
        maxlength: 20,
    },
    surname: {
        type: String,
        required: true,
        maxlength: 20,
    },
    branch: {
        type: String,
        maxlength: 15,
        required: function () { return this.role === "user"; },
    },
    division: {
        type: String,
        maxlength: 1,
        required: function () { return this.role === "user"; },
    },
    rollNo: {
        type: Number,
        maxlength: 3,
        required: function () { return this.role === "user"; },
    },
    year: {
        type: String,
        enum: ["FY", "SY", "TY", "FOURTH"],
        required: function () { return this.role === "user"; },
    },
});

module.exports = mongoose.model("User", userSchema);