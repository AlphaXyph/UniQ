const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    question: String,
    questionImage: { type: String, default: null }, // Cloudinary URL for question image
    options: [
        {
            text: String,
            image: { type: String, default: null }, // Cloudinary URL for option image
        }
    ], // 4 options with text and optional image
    answer: Number, // correct option index (0-3)
});

const quizSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    title: String,
    questions: [questionSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    timer: { type: Number, default: 5, min: 1 },
    isVisible: { type: Boolean, default: false },
    academicYear: { type: String, required: true }, // e.g., "2025-2026"
    year: { type: String, enum: ["FY", "SY", "TY", "FOURTH", ""], default: "" },
    branch: { type: String, maxlength: 4, default: "" },
    division: { type: String, enum: ["A", "B", "C", "D", ""], default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Quiz", quizSchema);