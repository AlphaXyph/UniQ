const mongoose = require("mongoose");
const Quiz = require("../models/quiz");
const Result = require("../models/result");
const User = require("../models/user");
const QuizSession = require("../models/quizSession");

const HEARTBEAT_INTERVAL = 5000;
const MAX_HEARTBEAT_FAILURES = 2;
const CONNECTION_TIMEOUT = 120000;

const checkExpiredSessions = async () => {
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const sessions = await QuizSession.find({ isActive: true }).session(session);
            const currentTime = Date.now();

            for (const sessionDoc of sessions) {
                if (sessionDoc.isProcessing) continue;

                sessionDoc.isProcessing = true;
                await sessionDoc.save({ session });

                const timeElapsed = Math.floor((currentTime - sessionDoc.startedAt) / 1000);
                const timeLeft = sessionDoc.timer - timeElapsed;
                const lastHeartbeat = sessionDoc.lastHeartbeat ? (currentTime - sessionDoc.lastHeartbeat) : 0;
                let submissionType = "";
                let violationMessage = "";

                if (timeLeft <= 0) {
                    if (lastHeartbeat > 30000) {
                        submissionType = "Time Up: Disconnected";
                        violationMessage = "Time limit reached and user was disconnected.";
                    } else {
                        submissionType = "Time Up";
                        violationMessage = "Time limit reached.";
                    }
                } else if (lastHeartbeat > (MAX_HEARTBEAT_FAILURES * HEARTBEAT_INTERVAL + CONNECTION_TIMEOUT)) {
                    submissionType = "Disconnected";
                    violationMessage = "User disconnected for more than 2 minutes after missed heartbeats.";
                } else {
                    sessionDoc.isProcessing = false;
                    await sessionDoc.save({ session });
                    continue;
                }

                const quiz = await Quiz.findById(sessionDoc.quiz).session(session);
                const user = await User.findById(sessionDoc.user).session(session);

                if (!quiz || !user) {
                    console.error(`Quiz or user not found for session ${sessionDoc._id}`);
                    sessionDoc.isProcessing = false;
                    await sessionDoc.save({ session });
                    continue;
                }

                const isAccessible = (
                    (quiz.year === "" || quiz.year === user.year) &&
                    (quiz.branch === "" || quiz.branch === user.branch) &&
                    (quiz.division === "" || quiz.division === user.division)
                );
                if (!isAccessible) {
                    console.error(`User ${user._id} does not have access to quiz ${quiz._id}`);
                    sessionDoc.isProcessing = false;
                    await sessionDoc.save({ session });
                    continue;
                }

                const existingResult = await Result.findOne({
                    student: sessionDoc.user,
                    quiz: sessionDoc.quiz
                }).session(session);
                if (existingResult) {
                    console.error(`Result already exists for user ${user._id} and quiz ${quiz._id}`);
                    await QuizSession.deleteOne({ _id: sessionDoc._id }).session(session);
                    continue;
                }

                let score = 0;
                sessionDoc.shuffledIndices.forEach((originalIndex, shuffledIndex) => {
                    if (quiz.questions[originalIndex].answer === sessionDoc.answers[shuffledIndex]) {
                        score++;
                    }
                });

                const result = new Result({
                    student: sessionDoc.user,
                    quiz: sessionDoc.quiz,
                    answers: sessionDoc.answers,
                    score,
                    total: quiz.questions.length,
                    rollNo: user.rollNo,
                    year: user.year,
                    branch: user.branch,
                    division: user.division,
                    submissionType,
                    violationMessage,
                    sessionId: sessionDoc._id,
                    startedAt: sessionDoc.startedAt,
                    submittedAt: new Date(),
                    violationCount: sessionDoc.violationCount
                });

                await result.save({ session });
                await QuizSession.deleteOne({ _id: sessionDoc._id }).session(session);
                console.log(`Auto-submitted session ${sessionDoc._id} due to ${submissionType}`);
            }
        });
    } catch (err) {
        console.error("Error in checkExpiredSessions:", err);
    } finally {
        await session.endSession();
    }
};

setInterval(checkExpiredSessions, 5000);

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
            if (timeLeft <= 0 || session.submitted) {
                return res.json({ sessionId: null });
            }
            return res.json({
                sessionId: session._id,
                answers: session.answers,
                timeLeft,
                violationCount: session.violationCount,
                submitted: session.submitted || false
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
        const existingResult = await Result.findOne({
            student: userId,
            quiz: quizId
        });
        if (existingResult) {
            return res.status(403).json({ msg: "You have already attempted this quiz" });
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
            timer: quiz.timer * 60,
            violationCount: 0,
            lastHeartbeat: Date.now(),
            isProcessing: false
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
        session.lastHeartbeat = Date.now();
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
            session.lastHeartbeat = Date.now();
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
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const { sessionId, submissionType, violationMessage } = req.body;
            const studentId = req.user.id;

            if (!sessionId) {
                return res.status(400).json({ msg: "Session ID is required" });
            }

            const sessionDoc = await QuizSession.findOne({
                _id: sessionId,
                user: studentId,
                isActive: true
            }).populate("quiz").session(session);
            if (!sessionDoc) {
                return res.status(404).json({ msg: "Active session not found" });
            }

            const quiz = sessionDoc.quiz;
            if (!quiz) {
                return res.status(404).json({ msg: "Quiz not found" });
            }

            const user = await User.findById(studentId).session(session);
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
                quiz: sessionDoc.quiz
            }).session(session);
            if (existingResult) {
                return res.status(403).json({ msg: "You have already attempted this quiz" });
            }

            const validSubmissionType = typeof submissionType === "string" && submissionType.trim() !== ""
                ? submissionType
                : "Manual";

            let score = 0;
            sessionDoc.shuffledIndices.forEach((originalIndex, shuffledIndex) => {
                if (quiz.questions[originalIndex].answer === sessionDoc.answers[shuffledIndex]) score++;
            });

            const result = new Result({
                student: studentId,
                quiz: sessionDoc.quiz,
                answers: sessionDoc.answers,
                score,
                total: quiz.questions.length,
                rollNo: user.rollNo,
                year: user.year,
                branch: user.branch,
                division: user.division,
                submissionType: validSubmissionType,
                violationMessage: violationMessage || "",
                sessionId,
                startedAt: sessionDoc.startedAt,
                submittedAt: new Date(),
                violationCount: sessionDoc.violationCount
            });

            await result.save({ session });
            sessionDoc.isActive = false;
            await sessionDoc.save({ session });
            await QuizSession.deleteOne({ _id: sessionId }).session(session);

            return res.json({
                msg: "Quiz submitted successfully",
                score,
                total: quiz.questions.length
            });
        });
    } catch (err) {
        console.error("Submit quiz error:", err);
        return res.status(500).json({ msg: "Submit failed", error: err.message });
    } finally {
        await session.endSession();
    }
};

const heartbeat = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.user.id;
        const session = await QuizSession.findOne({
            user: userId,
            quiz: quizId,
            isActive: true
        });
        if (!session) {
            return res.status(404).json({ msg: "Session not found or inactive" });
        }
        session.lastHeartbeat = Date.now();
        await session.save();
        return res.json({ msg: "Heartbeat received" });
    } catch (err) {
        console.error("Heartbeat error:", err);
        return res.status(500).json({ msg: "Server error" });
    }
};

module.exports = {
    submitQuiz,
    getActiveSession,
    createSession,
    updateAnswers,
    incrementViolation,
    heartbeat
};