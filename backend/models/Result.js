const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
    score: Number,
    total: Number,
    answers: [Number], // User's selected option index
});

module.exports = mongoose.model("Result", resultSchema);
