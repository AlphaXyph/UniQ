import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../api";
import Popup from "../../components/popup";

function AttemptQuiz({ setIsQuizActive }) {
    const { quizId } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [originalIndices, setOriginalIndices] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [popup, setPopup] = useState({ message: "", type: "success", confirmAction: null });
    const [isStarted, setIsStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [violationCount, setViolationCount] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
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
                if (res.data.hasAttempted && role === "user") {
                    setPopup({
                        message: "You have already attempted this quiz.",
                        type: "error",
                        confirmAction: () => navigate("/dashboard/result"),
                    });
                    return;
                }
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
    }, [quizId, role, navigate]);

    const handleSubmit = useCallback(
        async (isAutoSubmit = false) => {
            if (isSubmitted) return;
            setIsSubmitted(true);

            if (!isAutoSubmit) {
                const unansweredIndex = answers.findIndex((ans) => ans === null);
                if (unansweredIndex !== -1) {
                    setPopup({
                        message: `You haven't answered Question no. ${unansweredIndex + 1}.<br />Please answer all questions before submitting.`,
                        type: "error",
                        confirmAction: null,
                    });
                    setIsSubmitted(false);
                    return;
                }
            }

            try {
                const token = localStorage.getItem("token");
                const orderedAnswers = role === "user" ? answers.map((_, i) => answers[originalIndices.indexOf(i)]) : answers;
                const response = await API.post(
                    "/result/submit",
                    { quizId, answers: orderedAnswers },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setPopup({ message: response.data.msg || "Your test was submitted successfully", type: "success", confirmAction: null });
                document.exitFullscreen?.();
                setIsQuizActive(false);
                setTimeout(() => navigate("/dashboard/result"), 2000);
            } catch (err) {
                setPopup({ message: err.response?.data?.msg || "Submission failed", type: "error", confirmAction: null });
                setIsSubmitted(false);
            }
        },
        [quizId, answers, navigate, setIsQuizActive, originalIndices, role, isSubmitted]
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
                if (isSubmitted) return;
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

            const disableCopyPaste = (e) => {
                e.preventDefault();
                setPopup({
                    message: "Copying or pasting is not allowed during the quiz.",
                    type: "error",
                    confirmAction: null,
                });
            };

            document.body.style.userSelect = "none";
            document.body.style.webkitUserSelect = "none";
            document.body.style.msUserSelect = "none";

            document.addEventListener("fullscreenchange", fullscreenChange);
            document.addEventListener("webkitfullscreenchange", fullscreenChange);
            document.addEventListener("msfullscreenchange", fullscreenChange);
            document.addEventListener("visibilitychange", visibilityChange);
            window.addEventListener("blur", handleBlur);
            window.addEventListener("focus", handleFocus);
            document.addEventListener("keydown", handleKeyDown);
            document.addEventListener("copy", disableCopyPaste);
            document.addEventListener("cut", disableCopyPaste);
            document.addEventListener("contextmenu", disableCopyPaste);

            const interval = setInterval(enforceFullscreen, 100);

            return () => {
                document.body.style.userSelect = "";
                document.body.style.webkitUserSelect = "";
                document.body.style.msUserSelect = "";
                document.removeEventListener("fullscreenchange", fullscreenChange);
                document.removeEventListener("webkitfullscreenchange", fullscreenChange);
                document.removeEventListener("msfullscreenchange", fullscreenChange);
                document.removeEventListener("visibilitychange", visibilityChange);
                window.removeEventListener("blur", handleBlur);
                window.removeEventListener("focus", handleFocus);
                document.removeEventListener("keydown", handleKeyDown);
                document.removeEventListener("copy", disableCopyPaste);
                document.removeEventListener("cut", disableCopyPaste);
                document.removeEventListener("contextmenu", disableCopyPaste);
                clearInterval(interval);
                setIsQuizActive(false);
            };
        }
    }, [isStarted, role, violationCount, enforceFullscreen, handleSubmit, setIsQuizActive, isSubmitted]);

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
                        <div key={q._id || i} className="p-4 sm:p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-md">
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
                    <div className="p-4 sm:p-6 border border-gray-200 rounded-lg bg-gray-100 shadow-md">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Quiz Instructions</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mb-4">
                            Please read the following instructions carefully before starting the quiz to ensure a fair and smooth experience.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-gray-600">
                            <li><strong>Time Limit</strong>: You have {quiz.timer} minute{quiz.timer !== 1 ? "s" : ""} to complete the quiz. The timer starts as soon as you click "Start Quiz."</li>
                            <li><strong>Questions</strong>: The quiz contains {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}. All questions must be answered before submission.</li>
                            <li><strong>Submission</strong>: Once you submit the quiz, you cannot change your answers. Ensure all questions are answered before submitting.</li>
                            <li><strong>Fullscreen Mode</strong>: The quiz must be taken in fullscreen mode. Exiting fullscreen or switching tabs will be considered a violation.</li>
                            <li><strong>Violation Policy</strong>: You are allowed {MAX_VIOLATIONS} violations (e.g., exiting fullscreen or switching tabs). Exceeding this will result in automatic submission.</li>
                            <li><strong>Technical Requirements</strong>: Ensure a stable internet connection and avoid refreshing the page to prevent quiz interruptions.</li>
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
                    <div key={q._id || i} className="p-4 sm:p-6 border border-gray-200 rounded-lg bg-gray-100 shadow-md">
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