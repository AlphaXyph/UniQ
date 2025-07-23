const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
        validate: {
            validator: function (value) {
                return value.endsWith("@ves.ac.in");
            },
            message: "Email must end with @ves.ac.in",
        },
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
    },
    name: {
        type: String,
        required: [true, "Name is required"],
        maxlength: [20, "Name must be 20 characters or less"],
        trim: true,
        set: (value) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
    },
    surname: {
        type: String,
        required: [true, "Surname is required"],
        maxlength: [20, "Surname must be 20 characters or less"],
        trim: true,
        set: (value) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
    },
    branch: {
        type: String,
        maxlength: [4, "Branch must be 4 characters or less"],
        required: function () {
            return this.role === "user";
        },
        trim: true,
        uppercase: true,
    },
    division: {
        type: String,
        enum: {
            values: ["A", "B", "C", "D"],
            message: "Division must be one of A, B, C, or D",
        },
        required: function () {
            return this.role === "user";
        },
    },
    rollNo: {
        type: Number,
        required: function () {
            return this.role === "user";
        },
        min: [1, "Roll No must be at least 1"],
        max: [999, "Roll No must be a 3-digit number or less"],
    },
    year: {
        type: String,
        enum: {
            values: ["FY", "SY", "TY", "FOURTH"],
            message: "Year must be one of FY, SY, TY, or FOURTH",
        },
        required: function () {
            return this.role === "user";
        },
    },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);