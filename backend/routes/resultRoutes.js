const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
    submitQuiz,
    getUserResults,
    getAllResults,
    getQuizReport,
} = require("../controllers/resultController");

router.post("/submit", auth, submitQuiz);
router.get("/my", auth, getUserResults);
router.get("/all", auth, getAllResults);
router.get("/quiz/:quizId/report", auth, getQuizReport);

module.exports = router;