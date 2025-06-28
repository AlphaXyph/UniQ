const express = require("express");
const router = express.Router();
const { createQuiz, getAllQuizzes, getQuiz, updateQuiz, deleteQuiz, toggleQuizVisibility } = require("../controllers/quizController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/create", authMiddleware, createQuiz);
router.get("/all", authMiddleware, getAllQuizzes);
router.get("/:quizId", authMiddleware, getQuiz);
router.post("/update/:quizId", authMiddleware, updateQuiz);
router.delete("/:quizId", authMiddleware, deleteQuiz);
router.post("/toggle-visibility/:quizId", authMiddleware, toggleQuizVisibility);

module.exports = router;