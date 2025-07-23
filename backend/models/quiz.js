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
    timer: { type: Number, default: 5, min: 1 }, // Timer in minutes
    isVisible: { type: Boolean, default: false }, // Visibility field
}, { timestamps: true });

module.exports = mongoose.model("Quiz", quizSchema);