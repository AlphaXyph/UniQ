const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    submitQuiz,
    getUserResults,
    getAllResults,
    getQuizReport,
} = require("../controllers/resultController");

router.post("/submit", authMiddleware, submitQuiz);
router.get("/my", authMiddleware, getUserResults);
router.get("/all", authMiddleware, getAllResults);
router.get("/quiz/:quizId/report", authMiddleware, getQuizReport);

module.exports = router;