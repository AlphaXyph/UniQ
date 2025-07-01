import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../api";
import Popup from "../../components/Popup";

function AttemptQuiz({ setIsQuizActive }) {
    const { quizId } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [originalIndices, setOriginalIndices] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [popup, setPopup] = useState({ message: "", type: "success", confirmAction: null });
    const [isStarted, setIsStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [violationCount, setViolationCount] = useState(0);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role || "user";
    const MAX_VIOLATIONS = 3;

    const shuffleArray = (array) => {
        const shuffled = [...array];
        const indices = array.map((_, index) => index);
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        return { shuffled, indices };
    };

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await API.get(`/quiz/${quizId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (role === "user") {
                    const { shuffled, indices } = shuffleArray(res.data.questions);
                    setQuiz({ ...res.data, questions: shuffled });
                    setOriginalIndices(indices);
                    setAnswers(new Array(shuffled.length).fill(null));
                    setTimeLeft(res.data.timer * 60);
                } else {
                    setQuiz(res.data);
                }
            } catch (err) {
                setPopup({ message: err.response?.data?.msg || "Error loading quiz", type: "error", confirmAction: null });
            }
        };
        fetchQuiz();
    }, [quizId, role]);

    const handleSubmit = useCallback(
        async (isAutoSubmit = false) => {
            if (!isAutoSubmit) {
                const unansweredIndex = answers.findIndex((ans) => ans === null);
                if (unansweredIndex !== -1) {
                    setPopup({
                        message: `You haven't answered Question no. ${unansweredIndex + 1}.<br />Please answer all questions before submitting.`,
                        type: "error",
                        confirmAction: null,
                    });
                    return;
                }
            }

            try {
                const token = localStorage.getItem("token");
                const orderedAnswers = role === "user" ? answers.map((_, i) => answers[originalIndices.indexOf(i)]) : answers;
                await API.post(
                    "/result/submit",
                    { quizId, answers: orderedAnswers },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setPopup({ message: "Your test was submitted successfully", type: "success", confirmAction: null });
                document.exitFullscreen?.();
                setIsQuizActive(false);
                setTimeout(() => navigate("/dashboard/result"), 2000);
            } catch (err) {
                setPopup({ message: err.response?.data?.msg || "Submission failed", type: "error", confirmAction: null });
            }
        },
        [quizId, answers, navigate, setIsQuizActive, originalIndices, role]
    );

    const enforceFullscreen = useCallback(() => {
        const elem = document.documentElement;
        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            if (elem.requestFullscreen) {
                elem.requestFullscreen({ navigationUI: "hide" });
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        }
    }, []);

    useEffect(() => {
        if (isStarted && role === "user") {
            enforceFullscreen();
            setIsQuizActive(true);

            const handleViolation = (type) => {
                if (violationCount < MAX_VIOLATIONS) {
                    setViolationCount((prev) => prev + 1);
                    setPopup({
                        message: `${type} detected! Stay in fullscreen and on this tab.<br />Attempts left: ${MAX_VIOLATIONS - violationCount - 1}`,
                        type: "error",
                        confirmAction: null,
                    });
                    enforceFullscreen();
                } else {
                    setPopup({
                        message: "Too many attempts to leave the quiz. Submitting now.",
                        type: "error",
                        confirmAction: null,
                    });
                    handleSubmit(true);
                }
            };

            const fullscreenChange = () => {
                if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
                    handleViolation("Fullscreen exit");
                }
            };

            const visibilityChange = () => {
                if (document.hidden) {
                    handleViolation("Tab switch or minimization");
                }
            };

            const handleBlur = () => handleViolation("Window lost focus");
            const handleFocus = () => enforceFullscreen();
            const handleKeyDown = (e) => {
                if (e.key === "Escape" || e.key === "Tab" || (e.altKey && e.key === "Tab")) {
                    e.preventDefault();
                    handleViolation("Keyboard shortcut");
                }
            };

            document.addEventListener("fullscreenchange", fullscreenChange);
            document.addEventListener("webkitfullscreenchange", fullscreenChange);
            document.addEventListener("msfullscreenchange", fullscreenChange);
            document.addEventListener("visibilitychange", visibilityChange);
            window.addEventListener("blur", handleBlur);
            window.addEventListener("focus", handleFocus);
            document.addEventListener("keydown", handleKeyDown);

            const interval = setInterval(enforceFullscreen, 100);

            return () => {
                document.removeEventListener("fullscreenchange", fullscreenChange);
                document.removeEventListener("webkitfullscreenchange", fullscreenChange);
                document.removeEventListener("msfullscreenchange", fullscreenChange);
                document.removeEventListener("visibilitychange", visibilityChange);
                window.removeEventListener("blur", handleBlur);
                window.removeEventListener("focus", handleFocus);
                document.removeEventListener("keydown", handleKeyDown);
                clearInterval(interval);
                setIsQuizActive(false);
            };
        }
    }, [isStarted, role, violationCount, enforceFullscreen, handleSubmit, setIsQuizActive]);

    useEffect(() => {
        if (role === "user" && isStarted && timeLeft > 0) {
            const timerId = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerId);
                        handleSubmit(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timerId);
        }
    }, [isStarted, timeLeft, role, handleSubmit]);

    const handleOptionChange = (qIndex, optIndex) => {
        const copy = [...answers];
        copy[qIndex] = optIndex;
        setAnswers(copy);
    };

    const closePopup = () => setPopup({ message: "", type: "success", confirmAction: null });
    const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

    if (!quiz) return <div className="min-h-screen bg-gray-100 p-4 sm:p-6"><p className="text-center text-gray-600 text-xs sm:text-sm">Loading...</p></div>;

    if (role === "admin") {
        return (
            <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
                <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <Popup message={popup.message} type={popup.type} onClose={closePopup} confirmAction={popup.confirmAction} />
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">{quiz.subject} - {quiz.title}</h2>
                    <p className="text-sm sm:text-base text-gray-600">Subject: {quiz.subject}</p>
                    {quiz.questions.map((q, i) => (
                        <div key={q._id || i} className="p-4 sm:p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                            <p className="font-semibold text-xs sm:text-sm">{i + 1}. {q.question}</p>
                            {q.options.map((opt, j) => (
                                <p key={j} className="ml-2 text-xs sm:text-sm">{j + 1}. {opt} {q.answer === j ? <span className="text-green-600">(✔️ Correct)</span> : ""}</p>
                            ))}
                        </div>
                    ))}
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="w-full sm:w-auto p-2 sm:p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs sm:text-sm"
                    >
                        <i className="fas fa-arrow-left"></i> Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!isStarted) {
        return (
            <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
                <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <Popup message={popup.message} type={popup.type} onClose={closePopup} confirmAction={popup.confirmAction} />
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">{quiz.title}</h2>
                    <p className="text-sm sm:text-base text-gray-600">Subject: {quiz.subject}</p>
                    <div className="p-4 sm:p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Instructions</h3>
                        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-gray-600">
                            <li>This quiz must be completed in {quiz.timer} minute{quiz.timer !== 1 ? "s" : ""}.</li>
                            <li>Total Questions: {quiz.questions.length}</li>
                            <li>Once submitted, you cannot change your answers.</li>
                            <li>Stay in fullscreen mode and on this tab at all times.</li>
                            <li>{MAX_VIOLATIONS} attempts allowed before auto-submission.</li>
                        </ul>
                        <button
                            onClick={() => setIsStarted(true)}
                            className="mt-3 sm:mt-4 w-full sm:w-auto p-2 sm:p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs sm:text-sm"
                        >
                            Start Quiz
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
            <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} confirmAction={popup.confirmAction} />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">{quiz.subject} - {quiz.title}</h2>
                    <p className="text-sm sm:text-base font-semibold text-red-600">Time Left: {formatTime(timeLeft)}</p>
                </div>
                {quiz.questions.map((q, i) => (
                    <div key={q._id || i} className="p-4 sm:p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                        <p className="font-semibold text-xs sm:text-sm">{i + 1}. {q.question}</p>
                        {q.options.map((opt, j) => (
                            <label key={j} className="block mt-2 text-xs sm:text-sm">
                                <input
                                    type="radio"
                                    name={`q${i}`}
                                    checked={answers[i] === j}
                                    onChange={() => handleOptionChange(i, j)}
                                    disabled={timeLeft === 0}
                                    className="mr-2"
                                />
                                <span>{opt}</span>
                            </label>
                        ))}
                    </div>
                ))}
                <button
                    onClick={() => handleSubmit(false)}
                    className={`w-full sm:w-auto p-2 sm:p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs sm:text-sm ${timeLeft === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={timeLeft === 0}
                >
                    Submit Quiz
                </button>
            </div>
        </div>
    );
}

export default AttemptQuiz;