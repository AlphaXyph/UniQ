const mongoose = require("mongoose");
const Quiz = require("../models/quiz");
const Result = require("../models/result");
const cloudinary = require("../configs/cloudinary");
const User = require("../models/user");
const QuizSession = require("../models/quizSession");

const createQuiz = async (req, res) => {
    try {
        const { title, questions, timer, subject, isVisible = false, academicYear, year = "", branch = "", division = "" } = req.body;
        if (!title || !questions || questions.length === 0 || !timer || !subject || !academicYear) {
            return res.status(400).json({ msg: "Title, questions, timer, subject, and academic year are required" });
        }
        if (subject.length > 20) {
            return res.status(400).json({ msg: "Subject must not exceed 20 characters" });
        }
        if (title.length > 40) {
            return res.status(400).json({ msg: "Title must not exceed 40 characters" });
        }
        if (timer < 1 || timer > 720) {
            return res.status(400).json({ msg: "Timer must be between 1 and 720 minutes" });
        }
        if (!/^\d{4}-\d{4}$/.test(academicYear)) {
            return res.status(400).json({ msg: "Academic year must be in format YYYY-YYYY (e.g., 2025-2026)" });
        }
        const createdBy = req.user.id;

        const newQuiz = new Quiz({ subject, title, questions, createdBy, timer, isVisible, academicYear, year, branch, division });
        await newQuiz.save();
        res.status(201).json({ msg: "Quiz created successfully" });
    } catch (err) {
        console.error("Create quiz error:", err);
        res.status(500).json({ msg: "Quiz creation failed" });
    }
};

const getAllQuizzes = async (req, res) => {
    try {
        let filter = req.user.role === "admin" ? {} : { isVisible: true };
        if (req.user.role === "user") {
            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ msg: "User not found" });
            filter.$and = [
                { $or: [{ year: user.year }, { year: "" }] },
                { $or: [{ branch: user.branch }, { branch: "" }] },
                { $or: [{ division: user.division }, { division: "" }] },
            ];
        }
        const quizzes = await Quiz.find(filter)
            .select("-questions.answer")
            .populate("createdBy", "email");

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
        if (req.user.role === "user") {
            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ msg: "User not found" });
            const isAccessible = (
                (quiz.year === "" || quiz.year === user.year) &&
                (quiz.branch === "" || quiz.branch === user.branch) &&
                (quiz.division === "" || quiz.division === user.division)
            );
            if (!isAccessible) {
                return res.status(403).json({ msg: "You do not have access to this quiz" });
            }
            const session = await QuizSession.findOne({
                user: req.user.id,
                quiz: req.params.quizId,
                isActive: true
            });
            if (session && session.shuffledIndices) {
                quiz.questions = session.shuffledIndices.map(index => quiz.questions[index]);
            }
        }

        const hasAttempted = req.user.role === "user"
            ? await Result.findOne({ student: req.user.id, quiz: req.params.quizId }) !== null
            : false;

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
        const { title, questions, timer, subject, isVisible, academicYear, year = "", branch = "", division = "" } = req.body;
        if (!title || !questions || questions.length === 0 || !timer || !subject || !academicYear) {
            return res.status(400).json({ msg: "Title, questions, timer, subject, and academic year are required" });
        }
        if (subject.length > 20) {
            return res.status(400).json({ msg: "Subject must not exceed 20 characters" });
        }
        if (title.length > 40) {
            return res.status(400).json({ msg: "Title must not exceed 40 characters" });
        }
        if (timer < 1 || timer > 720) {
            return res.status(400).json({ msg: "Timer must be between 1 and 720 minutes" });
        }
        if (!/^\d{4}-\d{4}$/.test(academicYear)) {
            return res.status(400).json({ msg: "Academic year must be in format YYYY-YYYY (e.g., 2025-2026)" });
        }

        const existingImages = [];
        quiz.questions.forEach((q) => {
            if (q.questionImage) existingImages.push(q.questionImage);
            q.options.forEach((opt) => {
                if (opt.image) existingImages.push(opt.image);
            });
        });

        const newImages = [];
        questions.forEach((q) => {
            if (q.questionImage) newImages.push(q.questionImage);
            q.options.forEach((opt) => {
                if (opt.image) newImages.push(opt.image);
            });
        });

        const imagesToDelete = existingImages.filter((img) => !newImages.includes(img));
        for (const imageUrl of imagesToDelete) {
            const publicId = imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`quiz_images/${publicId}`);
        }

        const updatedQuiz = await Quiz.findByIdAndUpdate(
            req.params.quizId,
            { subject, title, questions, timer, isVisible, academicYear, year, branch, division },
            { new: true }
        );

        const results = await Result.find({ quiz: req.params.quizId });
        for (const result of results) {
            let score = 0;
            updatedQuiz.questions.forEach((q, idx) => {
                if (q.answer === result.answers[idx]) score++;
            });
            result.score = score;
            result.total = updatedQuiz.questions.length;
            await result.save();
        }

        res.json({ msg: "Quiz updated successfully, scores recalculated" });
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

        for (const question of quiz.questions) {
            if (question.questionImage) {
                const publicId = question.questionImage.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`quiz_images/${publicId}`);
            }
            for (const option of question.options) {
                if (option.image) {
                    const publicId = option.image.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`quiz_images/${publicId}`);
                }
            }
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

const duplicateQuiz = async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Admin access required" });
    try {
        const quiz = await Quiz.findById(req.params.quizId);
        if (!quiz) return res.status(404).json({ msg: "Quiz not found" });
        if (quiz.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ msg: "You can only duplicate quizzes you created" });
        }

        const newQuiz = new Quiz({
            ...quiz._doc,
            _id: new mongoose.Types.ObjectId(),
            createdBy: req.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            isVisible: false, // New quiz is hidden by default
        });

        await newQuiz.save();
        res.status(201).json({ msg: "Quiz duplicated successfully" });
    } catch (err) {
        console.error("Duplicate quiz error:", err);
        res.status(500).json({ msg: "Failed to duplicate quiz" });
    }
};

module.exports = {
    createQuiz,
    getAllQuizzes,
    getQuiz,
    updateQuiz,
    deleteQuiz,
    toggleQuizVisibility,
    duplicateQuiz
};