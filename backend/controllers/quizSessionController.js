const Quiz = require("../models/quiz");
const Result = require("../models/result");
const User = require("../models/user");
const QuizSession = require("../models/quizSession");

const getActiveSession = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.user.id;
        const session = await QuizSession.findOne({
            user: userId,
            quiz: quizId,
            isActive: true
        }).populate("quiz");
        if (session) {
            const quiz = session.quiz;
            const timeElapsed = Math.floor((Date.now() - session.startedAt) / 1000);
            const timeLeft = Math.max(0, session.timer - timeElapsed);
            return res.json({
                sessionId: session._id,
                answers: session.answers,
                timeLeft,
                violationCount: session.violationCount
            });
        }
        return res.json({ sessionId: null });
    } catch (err) {
        console.error("Get active session error:", err);
        return res.status(500).json({ msg: "Server error" });
    }
};

const createSession = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.user.id;
        const existingSession = await QuizSession.findOne({
            user: userId,
            quiz: quizId,
            isActive: true
        });
        if (existingSession) {
            return res.status(400).json({
                msg: "An active session already exists",
                sessionId: existingSession._id
            });
        }
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ msg: "Quiz not found" });
        }
        const questionCount = quiz.questions.length;
        const shuffledIndices = [...Array(questionCount).keys()].sort(() => Math.random() - 0.5);
        const answers = new Array(questionCount).fill(null);
        const newSession = new QuizSession({
            user: userId,
            quiz: quizId,
            shuffledIndices,
            answers,
            timer: quiz.timer * 60, // Convert minutes to seconds
            violationCount: 0
        });
        await newSession.save();
        return res.json({ sessionId: newSession._id, timeLeft: newSession.timer, violationCount: 0 });
    } catch (err) {
        console.error("Create session error:", err);
        return res.status(500).json({ msg: "Server error" });
    }
};

const updateAnswers = async (req, res) => {
    try {
        const { quizId, sessionId } = req.params;
        const { answers } = req.body;
        const userId = req.user.id;
        const session = await QuizSession.findOne({
            _id: sessionId,
            user: userId,
            quiz: quizId,
            isActive: true
        });
        if (!session) {
            return res.status(404).json({ msg: "Session not found or inactive" });
        }
        if (!Array.isArray(answers) || answers.length !== session.answers.length) {
            return res.status(400).json({ msg: "Invalid answers array" });
        }
        session.answers = answers;
        session.lastUpdated = Date.now();
        await session.save();
        return res.json({ msg: "Answers updated" });
    } catch (err) {
        console.error("Update answers error:", err);
        return res.status(500).json({ msg: "Server error" });
    }
};

const incrementViolation = async (req, res) => {
    try {
        const { quizId, sessionId } = req.params;
        const { violationType, isMajor } = req.body;
        const userId = req.user.id;
        const session = await QuizSession.findOne({
            _id: sessionId,
            user: userId,
            quiz: quizId,
            isActive: true
        });
        if (!session) {
            return res.status(404).json({ msg: "Session not found or inactive" });
        }
        if (!isMajor) {
            session.violationCount += 1;
            session.lastUpdated = Date.now();
            await session.save();
            return res.json({ violationCount: session.violationCount });
        }
        return res.json({ violationCount: session.violationCount });
    } catch (err) {
        console.error("Increment violation error:", err);
        return res.status(500).json({ msg: "Server error" });
    }
};

const submitQuiz = async (req, res) => {
    try {
        const { sessionId, submissionType, violationMessage } = req.body;
        const studentId = req.user.id;

        if (!sessionId) {
            return res.status(400).json({ msg: "Session ID is required" });
        }

        const session = await QuizSession.findOne({
            _id: sessionId,
            user: studentId,
            isActive: true
        }).populate("quiz");
        if (!session) {
            return res.status(404).json({ msg: "Active session not found" });
        }

        const quiz = session.quiz;
        if (!quiz) {
            return res.status(404).json({ msg: "Quiz not found" });
        }

        const user = await User.findById(studentId);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const isAccessible = (
            (quiz.year === "" || quiz.year === user.year) &&
            (quiz.branch === "" || quiz.branch === user.branch) &&
            (quiz.division === "" || quiz.division === user.division)
        );
        if (!isAccessible) {
            return res.status(403).json({ msg: "You do not have access to this quiz" });
        }

        const existingResult = await Result.findOne({
            student: studentId,
            quiz: session.quiz
        });
        if (existingResult) {
            return res.status(403).json({ msg: "You have already attempted this quiz" });
        }

        const validSubmissionType = typeof submissionType === "string" && submissionType.trim() !== ""
            ? submissionType
            : "Manual";

        let score = 0;
        session.shuffledIndices.forEach((originalIndex, shuffledIndex) => {
            if (quiz.questions[originalIndex].answer === session.answers[shuffledIndex]) score++;
        });

        const result = new Result({
            student: studentId,
            quiz: session.quiz,
            answers: session.answers,
            score,
            total: quiz.questions.length,
            rollNo: user.rollNo,
            year: user.year,
            branch: user.branch,
            division: user.division,
            submissionType: validSubmissionType,
            violationMessage: violationMessage || "",
            sessionId,
            startedAt: session.startedAt,
            submittedAt: new Date(),
            violationCount: session.violationCount
        });

        await result.save();

        // Delete the session after successful submission
        await QuizSession.deleteOne({ _id: sessionId });

        return res.json({
            msg: "Quiz submitted successfully",
            score,
            total: quiz.questions.length
        });
    } catch (err) {
        console.error("Submit quiz error:", err);
        return res.status(500).json({ msg: "Submit failed", error: err.message });
    }
};

module.exports = {
    submitQuiz,
    getActiveSession,
    createSession,
    updateAnswers,
    incrementViolation
};