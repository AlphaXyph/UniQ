const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
    submitQuiz,
    getUserResults,
    getAllResults,
} = require("../controllers/resultController");

router.post("/submit", auth, submitQuiz);
router.get("/my", auth, getUserResults);
router.get("/all", auth, getAllResults);

module.exports = router;
