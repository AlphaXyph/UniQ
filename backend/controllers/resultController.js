const Result = require("../models/Result");
const Quiz = require("../models/Quiz");

const submitQuiz = async (req, res) => {
    try {
        const { quizId, answers } = req.body;
        const studentId = req.user.id;

        console.log("Submitting quiz:", { quizId, studentId, answers }); // Debug
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ msg: "Quiz not found" });

        let score = 0;
        quiz.questions.forEach((q, idx) => {
            if (q.answer === answers[idx]) score++;
        });

        const result = new Result({
            student: studentId,
            quiz: quizId,
            answers,
            score,
            total: quiz.questions.length,
        });

        await result.save();
        res.json({ msg: "Quiz submitted", score, total: quiz.questions.length });
    } catch (err) {
        console.error("Submit quiz error:", err.message, err.stack); // Enhanced logging
        res.status(500).json({ msg: "Submit failed" });
    }
};

const getUserResults = async (req, res) => {
    try {
        const results = await Result.find({ student: req.user.id }).populate("quiz", "title");
        const filteredResults = results.filter((r) => r.quiz);
        res.json(filteredResults);
    } catch (err) {
        console.error("Get user results error:", err.message, err.stack);
        res.status(500).json({ msg: "Failed to get results" });
    }
};

const getAllResults = async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Admin access required" });
    try {
        const results = await Result.find().populate("student", "email").populate("quiz", "title");
        const filteredResults = results.filter((r) => r.quiz);
        res.json(filteredResults);
    } catch (err) {
        console.error("Get all results error:", err.message, err.stack);
        res.status(500).json({ msg: "Failed to get all results" });
    }
};

module.exports = { submitQuiz, getUserResults, getAllResults };