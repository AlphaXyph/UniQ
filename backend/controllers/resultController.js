const Result = require("../models/Result");
const Quiz = require("../models/Quiz");

const submitQuiz = async (req, res) => {
    try {
        const { quizId, answers } = req.body;
        const studentId = req.user.id;

        console.log("Submitting quiz:", { quizId, studentId, answers });
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ msg: "Quiz not found" });

        let score = 0;
        quiz.questions.forEach((q, idx) => {
            if (q.answer === answers[idx]) score++;
        });

        const result = new Result({
            student: studentId,
            quiz: quizId,
            answers,
            score,
            total: quiz.questions.length,
        });

        await result.save();
        res.json({ msg: "Quiz submitted", score, total: quiz.questions.length });
    } catch (err) {
        console.error("Submit quiz error:", err.message, err.stack);
        res.status(500).json({ msg: "Submit failed" });
    }
};

const getUserResults = async (req, res) => {
    try {
        const results = await Result.find({ student: req.user.id }).populate("quiz", "title subject");
        const filteredResults = results.filter((r) => r.quiz);
        res.json(filteredResults);
    } catch (err) {
        console.error("Get user results error:", err.message, err.stack);
        res.status(500).json({ msg: "Failed to get results" });
    }
};

const getAllResults = async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Admin access required" });
    try {
        const results = await Result.find().populate("student", "email").populate("quiz", "title subject");
        const filteredResults = results.filter((r) => r.quiz);
        res.json(filteredResults);
    } catch (err) {
        console.error("Get all results error:", err.message, err.stack);
        res.status(500).json({ msg: "Failed to get all results" });
    }
};

const getQuizReport = async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Admin access required" });
    try {
        const { quizId } = req.params;
        const { sortBy = "name", order = "asc" } = req.query;

        // Validate sortBy parameter
        const validSortFields = ["name", "rollNo", "division", "branch", "year"];
        if (!validSortFields.includes(sortBy)) {
            return res.status(400).json({ msg: "Invalid sort field" });
        }

        // Map sortBy to MongoDB fields (name requires surname for secondary sorting)
        const sortFields = {
            name: { name: order === "asc" ? 1 : -1, surname: order === "asc" ? 1 : -1 },
            rollNo: { rollNo: order === "asc" ? 1 : -1 },
            division: { division: order === "asc" ? 1 : -1 },
            branch: { branch: order === "asc" ? 1 : -1 },
            year: { year: order === "asc" ? 1 : -1 },
        };

        const results = await Result.find({ quiz: quizId })
            .populate("student", "name surname rollNo email year branch division")
            .populate("quiz", "subject topic")
            .sort(sortFields[sortBy]);

        const formattedResults = results
            .filter((r) => r.quiz && r.student)
            .map((r) => ({
                rollNo: r.student.rollNo,
                name: `${r.student.name} ${r.student.surname}`,
                email: r.student.email,
                year: r.student.year,
                branch: r.student.branch,
                division: r.student.division,
                subject: r.quiz.subject,
                topic: r.quiz.topic,
                score: `${r.score}/${r.total}`,
            }));

        res.json(formattedResults);
    } catch (err) {
        console.error("Get quiz report error:", err.message, err.stack);
        res.status(500).json({ msg: "Failed to get quiz report" });
    }
};

module.exports = { submitQuiz, getUserResults, getAllResults, getQuizReport };