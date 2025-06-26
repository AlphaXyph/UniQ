const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    question: String,
    options: [String], // 4 options
    answer: Number, // correct option index (0-3)
});

const quizSchema = new mongoose.Schema({
    title: String,
    questions: [questionSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Quiz", quizSchema);
