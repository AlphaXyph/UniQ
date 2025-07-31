const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    getUserResults,
    getAllResults,
    getQuizReport,
    getUserAnswer,
    canViewAnswers,
    deleteResult,
    deleteManyResults,
} = require("../controllers/resultController");

router.get("/my", authMiddleware, getUserResults);
router.get("/all", authMiddleware, getAllResults);
router.get("/quiz/:quizId/report", authMiddleware, getQuizReport);
router.get("/answers/:resultId", authMiddleware, getUserAnswer);
router.get("/can-view-answers/:resultId", authMiddleware, canViewAnswers);
router.delete("/:id", authMiddleware, deleteResult);
router.post("/delete-many", authMiddleware, deleteManyResults);

module.exports = router;