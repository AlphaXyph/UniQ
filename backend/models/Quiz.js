const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    question: String,
    options: [String], // 4 options
    answer: Number, // correct option index (0-3)
});

const quizSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    title: String,
    questions: [questionSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    timer: { type: Number, default: 5, min: 1 }, // Timer in minutes
    isVisible: { type: Boolean, default: false }, // New field for visibility
});

module.exports = mongoose.model("Quiz", quizSchema);