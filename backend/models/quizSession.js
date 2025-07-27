const mongoose = require("mongoose");

const quizSessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    shuffledIndices: [Number], // Array of original question indices in shuffled order
    answers: [{ type: Number }], // Array of selected option indices, null if unanswered
    startedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: Date.now },
    timer: { type: Number, required: true }, // Quiz duration in seconds
    violationCount: { type: Number, default: 0 }, // Number of violations
    lastHeartbeat: { type: Date, default: Date.now } // Periodic check for connectivity(Sync)
});

module.exports = mongoose.model("QuizSession", quizSessionSchema);