const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    getUserResults,
    getAllResults,
    getQuizReport,
    getUserAnswer,
    canViewAnswers,
} = require("../controllers/resultController");

router.get("/my", authMiddleware, getUserResults);
router.get("/all", authMiddleware, getAllResults);
router.get("/quiz/:quizId/report", authMiddleware, getQuizReport);
router.get("/answers/:resultId", authMiddleware, getUserAnswer);
router.get("/can-view-answers/:resultId", authMiddleware, canViewAnswers);

module.exports = router;