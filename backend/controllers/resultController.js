const Result = require("../models/result");

const mapResultToReport = (r) => ({
    resultId: r._id,
    rollNo: r.rollNo || "N/A",
    name: `${r.student?.name || "Unknown"} ${r.student?.surname || ""}`.trim(),
    email: r.student?.email || "No Email",
    year: r.year || "N/A",
    branch: r.branch || "N/A",
    division: r.division || "N/A",
    from: `${r.year || "N/A"}-${r.branch || "N/A"}-${r.division || "N/A"}`,
    subject: r.quiz?.subject || "Unknown",
    topic: r.quiz?.title || "Unknown",
    score: `${r.score ?? 0}/${r.total ?? 0}`,
    createdAt: r.createdAt,
    submissionType: r.submissionType || "N/A",
});

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
        const results = await Result.find()
            .populate("student", "name surname email")
            .populate("quiz", "title subject");
        const filteredResults = results.filter((r) => r.quiz && r.student);
        const mappedResults = filteredResults.map(mapResultToReport);
        res.json(mappedResults);
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

        const validSortFields = ["name", "rollNo", "division", "branch", "year"];
        if (!validSortFields.includes(sortBy)) {
            return res.status(400).json({ msg: "Invalid sort field" });
        }

        const sortFields = {
            name: { "student.name": order === "asc" ? 1 : -1, "student.surname": order === "asc" ? 1 : -1 },
            rollNo: { rollNo: order === "asc" ? 1 : -1 },
            division: { division: order === "asc" ? 1 : -1 },
            branch: { branch: order === "asc" ? 1 : -1 },
            year: { year: order === "asc" ? 1 : -1 },
        };

        const results = await Result.find({ quiz: quizId })
            .populate("student", "name surname email")
            .populate("quiz", "title subject")
            .sort(sortFields[sortBy]);

        const mappedResults = results
            .filter((r) => r.quiz && r.student)
            .map(mapResultToReport);

        res.json(mappedResults);
    } catch (err) {
        console.error("Get quiz report error:", err.message, err.stack);
        res.status(500).json({ msg: "Failed to get quiz report" });
    }
};

const getUserAnswer = async (req, res) => {
    try {
        const { resultId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const result = await Result.findById(resultId)
            .populate("quiz", "subject title questions")
            .populate("student", "name surname email");

        if (!result || !result.quiz || !result.student) {
            return res.status(404).json({ msg: "Result or associated data not found" });
        }

        if (userRole !== "admin" && result.student._id.toString() !== userId) {
            return res.status(403).json({ msg: "Unauthorized access to this result" });
        }

        const detailedAnswers = result.quiz.questions.map((question, index) => ({
            question: question.question,
            options: question.options,
            correctAnswer: question.answer,
            userAnswer: result.answers[index],
            isCorrect: result.answers[index] !== undefined && result.answers[index] !== null ? question.answer === result.answers[index] : false,
            isAnswered: result.answers[index] !== undefined && result.answers[index] !== null,
        }));

        const response = {
            quizId: result.quiz._id,
            quizTitle: result.quiz.title,
            quizSubject: result.quiz.subject,
            studentName: `${result.student.name} ${result.student.surname}`.trim(),
            studentEmail: result.student.email,
            score: result.score,
            total: result.total,
            answers: detailedAnswers,
        };

        res.json(response);
    } catch (err) {
        console.error("Get user answer error:", err.message, err.stack);
        res.status(500).json({ msg: "Failed to fetch user answers" });
    }
};

const canViewAnswers = async (req, res) => {
    try {
        const { resultId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const result = await Result.findById(resultId);
        if (!result) {
            return res.status(404).json({ msg: "Result not found" });
        }

        if (userRole !== "admin" && result.student.toString() !== userId) {
            return res.status(403).json({ msg: "Unauthorized access to this result" });
        }

        const submissionDate = new Date(result.createdAt);
        const currentDate = new Date();
        const sixHoursInMs = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
        const canView = currentDate - submissionDate >= sixHoursInMs;

        res.json({ canView });
    } catch (err) {
        console.error("Can view answers error:", err.message, err.stack);
        res.status(500).json({ msg: "Failed to check view answers permission" });
    }
};

const deleteResult = async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Admin access required" });
    try {
        const { id } = req.params;
        await Result.findByIdAndDelete(id);
        res.json({ msg: "Result deleted successfully" });
    } catch (err) {
        console.error("Delete result error:", err.message, err.stack);
        res.status(500).json({ msg: "Failed to delete result" });
    }
};

const deleteManyResults = async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Admin access required" });
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ msg: "No result IDs provided" });
        }
        await Result.deleteMany({ _id: { $in: ids } });
        res.json({ msg: "Results deleted successfully" });
    } catch (err) {
        console.error("Delete many results error:", err.message, err.stack);
        res.status(500).json({ msg: "Failed to delete results" });
    }
};

module.exports = {
    getUserResults,
    getAllResults,
    getQuizReport,
    getUserAnswer,
    canViewAnswers,
    deleteResult,
    deleteManyResults,
};