const Quiz = require("../models/Quiz");
const Result = require("../models/Result");

const createQuiz = async (req, res) => {
    try {
        const { title, questions, timer, subject, isVisible = false } = req.body;
        if (!title || !questions || questions.length === 0 || !timer || timer < 0.5 || !subject) {
            return res.status(400).json({ msg: "Title, questions, valid timer, and subject are required" });
        }
        const createdBy = req.user.id;

        const newQuiz = new Quiz({ subject, title, questions, createdBy, timer, isVisible });
        await newQuiz.save();
        res.status(201).json({ msg: "Quiz created successfully" });
    } catch (err) {
        console.error("Create quiz error:", err);
        res.status(500).json({ msg: "Quiz creation failed" });
    }
};

const getAllQuizzes = async (req, res) => {
    try {
        const filter = req.user.role === "admin" ? {} : { isVisible: true };
        const quizzes = await Quiz.find(filter)
            .select("-questions.answer")
            .populate("createdBy", "email");
        res.json(quizzes);
    } catch (err) {
        console.error("Get all quizzes error:", err);
        res.status(500).json({ msg: "Failed to fetch quizzes" });
    }
};

const getQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.quizId).populate("createdBy", "email");
        if (!quiz) return res.status(404).json({ msg: "Quiz not found" });
        if (req.user.role !== "admin" && !quiz.isVisible) {
            return res.status(403).json({ msg: "Quiz is not visible" });
        }
        if (req.user.role !== "admin") {
            quiz.questions = quiz.questions.map((q) => ({ ...q._doc, answer: undefined }));
        }
        res.json(quiz);
    } catch (err) {
        console.error("Get quiz error:", err);
        res.status(500).json({ msg: "Server error" });
    }
};

const updateQuiz = async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Admin access required" });
    try {
        const { title, questions, timer, subject, isVisible } = req.body;
        if (!title || !questions || questions.length === 0 || !timer || timer < 1 || !subject) {
            return res.status(400).json({ msg: "Title, questions, valid timer, and subject are required" });
        }
        const quiz = await Quiz.findByIdAndUpdate(
            req.params.quizId,
            { subject, title, questions, timer, isVisible },
            { new: true }
        );
        if (!quiz) return res.status(404).json({ msg: "Quiz not found" });
        res.json({ msg: "Quiz updated successfully" });
    } catch (err) {
        console.error("Update quiz error:", err);
        res.status(500).json({ msg: "Failed to update quiz" });
    }
};

const deleteQuiz = async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Admin access required" });
    try {
        const quiz = await Quiz.findByIdAndDelete(req.params.quizId);
        if (!quiz) return res.status(404).json({ msg: "Quiz not found" });
        await Result.deleteMany({ quiz: req.params.quizId });
        res.json({ msg: "Quiz deleted" });
    } catch (err) {
        console.error("Delete quiz error:", err);
        res.status(500).json({ msg: "Server error" });
    }
};

const toggleQuizVisibility = async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Admin access required" });
    try {
        const quiz = await Quiz.findById(req.params.quizId);
        if (!quiz) return res.status(404).json({ msg: "Quiz not found" });
        quiz.isVisible = !quiz.isVisible;
        await quiz.save();
        res.json({ msg: `Quiz is now ${quiz.isVisible ? "visible" : "hidden"}` });
    } catch (err) {
        console.error("Toggle quiz visibility error:", err);
        res.status(500).json({ msg: "Failed to toggle visibility" });
    }
};

module.exports = { createQuiz, getAllQuizzes, getQuiz, updateQuiz, deleteQuiz, toggleQuizVisibility };