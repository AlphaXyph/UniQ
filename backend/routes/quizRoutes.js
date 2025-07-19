const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    createQuiz,
    getAllQuizzes,
    getQuiz,
    updateQuiz,
    deleteQuiz,
    toggleQuizVisibility,
    startQuiz,
    submitQuiz,
} = require("../controllers/quizController");

router.post("/create", authMiddleware, createQuiz);
router.get("/all", authMiddleware, getAllQuizzes);
router.get("/:quizId", authMiddleware, getQuiz);
router.post("/update/:quizId", authMiddleware, updateQuiz);
router.delete("/:quizId", authMiddleware, deleteQuiz);
router.post("/toggle-visibility/:quizId", authMiddleware, toggleQuizVisibility);
router.post("/start", authMiddleware, startQuiz);
router.post("/submit", authMiddleware, submitQuiz);

module.exports = router;