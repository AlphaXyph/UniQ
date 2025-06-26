const express = require("express");
const router = express.Router();
const { createQuiz, getAllQuizzes } = require("../controllers/quizController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/create", authMiddleware, createQuiz);
router.get("/all", authMiddleware, getAllQuizzes);

module.exports = router;
