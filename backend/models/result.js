const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
    {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
        score: Number,
        total: Number,
        answers: [Number], // User's selected option index
        rollNo: { type: Number, required: true }, // Store rollNo at submission time
        year: { type: String, required: true }, // Store year at submission time
        branch: { type: String, required: true }, // Store branch at submission time
        division: { type: String, required: true }, // Store division at submission time
    },
    { timestamps: true } // Add timestamps for createdAt and updatedAt
);

module.exports = mongoose.model("Result", resultSchema);