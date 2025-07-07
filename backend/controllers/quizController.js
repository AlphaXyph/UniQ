const Quiz = require("../models/quiz");
const Result = require("../models/result");

const createQuiz = async (req, res) => {
    try {
        const { title, questions, timer, subject, isVisible = false } = req.body;
        if (!title || !questions || questions.length === 0 || !timer || timer < 1 || !subject) {
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

        // For users, check which quizzes they've attempted
        let quizzesWithAttemptStatus = quizzes;
        if (req.user.role === "user") {
            const results = await Result.find({ student: req.user.id }).select("quiz");
            const attemptedQuizIds = new Set(results.map((r) => r.quiz.toString()));
            quizzesWithAttemptStatus = quizzes.map((quiz) => ({
                ...quiz._doc,
                hasAttempted: attemptedQuizIds.has(quiz._id.toString()),
            }));
        }

        res.json(quizzesWithAttemptStatus);
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

        // Check if the user has already attempted the quiz
        const hasAttempted = req.user.role === "user"
            ? await Result.findOne({ student: req.user.id, quiz: req.params.quizId }) !== null
            : false;

        // Remove correct answers for non-admin users
        if (req.user.role !== "admin") {
            quiz.questions = quiz.questions.map((q) => ({ ...q._doc, answer: undefined }));
        }

        res.json({ ...quiz._doc, hasAttempted });
    } catch (err) {
        console.error("Get quiz error:", err);
        res.status(500).json({ msg: "Server error" });
    }
};

const updateQuiz = async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Admin access required" });
    try {
        const quiz = await Quiz.findById(req.params.quizId);
        if (!quiz) return res.status(404).json({ msg: "Quiz not found" });
        if (quiz.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ msg: "You can only edit quizzes you created" });
        }
        const { title, questions, timer, subject, isVisible } = req.body;
        if (!title || !questions || questions.length === 0 || !timer || timer < 1 || !subject) {
            return res.status(400).json({ msg: "Title, questions, valid timer, and subject are required" });
        }
        const updatedQuiz = await Quiz.findByIdAndUpdate(
            req.params.quizId,
            { subject, title, questions, timer, isVisible },
            { new: true }
        );
        res.json({ msg: "Quiz updated successfully" });
    } catch (err) {
        console.error("Update quiz error:", err);
        res.status(500).json({ msg: "Failed to update quiz" });
    }
};

const deleteQuiz = async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Admin access required" });
    try {
        const quiz = await Quiz.findById(req.params.quizId);
        if (!quiz) return res.status(404).json({ msg: "Quiz not found" });
        if (quiz.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ msg: "You can only delete quizzes you created" });
        }
        await Quiz.findByIdAndDelete(req.params.quizId);
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
        if (quiz.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ msg: "You can only toggle visibility for quizzes you created" });
        }
        quiz.isVisible = !quiz.isVisible;
        await quiz.save();
        res.json({ msg: `Quiz is now ${quiz.isVisible ? "visible" : "hidden"}` });
    } catch (err) {
        console.error("Toggle quiz visibility error:", err);
        res.status(500).json({ msg: "Failed to toggle visibility" });
    }
};

module.exports = { createQuiz, getAllQuizzes, getQuiz, updateQuiz, deleteQuiz, toggleQuizVisibility };