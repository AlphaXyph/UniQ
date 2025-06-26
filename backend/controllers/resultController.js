const Result = require("../models/Result");
const Quiz = require("../models/Quiz");

exports.submitQuiz = async (req, res) => {
    try {
        const { quizId, answers } = req.body;
        const studentId = req.user.id;

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
        res.status(500).json({ msg: "Submit failed" });
    }
};

exports.getUserResults = async (req, res) => {
    try {
        const results = await Result.find({ student: req.user.id }).populate("quiz", "title");
        res.json(results);
    } catch (err) {
        res.status(500).json({ msg: "Failed to get results" });
    }
};

exports.getAllResults = async (req, res) => {
    try {
        const results = await Result.find().populate("student", "email").populate("quiz", "title");
        res.json(results);
    } catch (err) {
        res.status(500).json({ msg: "Failed to get all results" });
    }
};
