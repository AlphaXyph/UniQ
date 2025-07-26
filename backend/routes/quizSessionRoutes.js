const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    submitQuiz,
    getActiveSession,
    createSession,
    updateAnswers,
    incrementViolation
} = require("../controllers/quizSessionController");

// Session management routes
router.get("/:quizId/session", authMiddleware, getActiveSession);
router.post("/:quizId/session", authMiddleware, createSession);
router.put("/:quizId/session/:sessionId/answers", authMiddleware, updateAnswers);
router.post("/:quizId/session/:sessionId/violation", authMiddleware, incrementViolation);

// Submit
router.post("/submit", authMiddleware, submitQuiz);

module.exports = router;