const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { upload, uploadImage } = require("../services/imageUpload");
const {
    createQuiz,
    getAllQuizzes,
    getQuiz,
    updateQuiz,
    deleteQuiz,
    toggleQuizVisibility,
    duplicateQuiz
} = require("../controllers/quizController");

router.post("/create", authMiddleware, createQuiz);
router.get("/all", authMiddleware, getAllQuizzes);
router.get("/:quizId", authMiddleware, getQuiz);
router.post("/update/:quizId", authMiddleware, updateQuiz);
router.delete("/:quizId", authMiddleware, deleteQuiz);
router.post("/toggle-visibility/:quizId", authMiddleware, toggleQuizVisibility);
router.post("/duplicate/:quizId", authMiddleware, duplicateQuiz);
router.post("/upload-image", authMiddleware, upload.single("image"), uploadImage);

module.exports = router;