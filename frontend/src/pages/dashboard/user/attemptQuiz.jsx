import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../../api";
import Popup from "../../../components/popup";

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
    const [isBrowserSupported, setIsBrowserSupported] = useState(true);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role || "user";
    const MAX_VIOLATIONS = 3;
    const [sessionId] = useState(`${quizId}-${Date.now()}`);

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

    const checkBrowserSupport = useCallback(() => {
        const ua = navigator.userAgent.toLowerCase();
        const isMobile = /mobile|android|iphone|ipad|ipod|tablet/.test(ua);
        const isChrome = /chrome|chromium|crios/.test(ua) && !/edge|edgios|opr|opera|ucbrowser|samsungbrowser/.test(ua);
        const isFirefox = /firefox|fxios/.test(ua) && !/seamonkey/.test(ua);
        const isSafari = /safari/.test(ua) && !/chrome|crios|opr|opera|ucbrowser|samsungbrowser/.test(ua);
        const isEdge = /edge|edgios/.test(ua);
        const isFullscreenSupported =
            document.fullscreenEnabled ||
            document.webkitFullscreenEnabled ||
            document.msFullscreenEnabled ||
            (isMobile && (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen));

        const isWebRTCSupported = !!window.RTCPeerConnection;
        const isWebGLSupported = !!window.WebGLRenderingContext;
        const isNavigatorValid = navigator.userAgent !== "" && (navigator.vendor !== "" || isSafari); // Safari on iOS may have empty vendor
        const isSuspiciousUA = /bot|crawler|spider|headless|phantom|splash|playwright|selenium|ucbrowser|opera mini|puffin|qqbrowser/.test(ua);

        if (
            !(isChrome || isFirefox || isSafari || isEdge) ||
            !isFullscreenSupported ||
            !isWebRTCSupported ||
            !isWebGLSupported ||
            !isNavigatorValid ||
            isSuspiciousUA
        ) {
            setIsBrowserSupported(false);
            setPopup({
                message:
                    "Your browser is not supported or appears to be a third-party/fake browser. Please use the latest version of Chrome, Firefox, Edge, or Safari.",
                type: "error",
                confirmAction: () => navigate("/dashboard"),
            });
            return false;
        }
        return true;
    }, [navigate]);

    useEffect(() => {
        const fetchQuiz = async () => {
            if (!checkBrowserSupport()) return;

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
    }, [quizId, role, navigate, checkBrowserSupport]);

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
                elem.requestFullscreen({ navigationUI: "hide" }).catch(() => {
                    setPopup({
                        message: "Failed to enter fullscreen mode. Please ensure your browser supports fullscreen and use Chrome, Firefox, Edge, or Safari.",
                        type: "error",
                        confirmAction: null,
                    });
                });
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen().catch(() => {
                    setPopup({
                        message: "Failed to enter fullscreen mode. Please ensure your browser supports fullscreen and use Chrome, Firefox, Edge, or Safari.",
                        type: "error",
                        confirmAction: null,
                    });
                });
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen().catch(() => {
                    setPopup({
                        message: "Failed to enter fullscreen mode. Please ensure your browser supports fullscreen and use Chrome, Firefox, Edge, or Safari.",
                        type: "error",
                        confirmAction: null,
                    });
                });
            } else {
                setPopup({
                    message: "Fullscreen mode is not supported on this device. Please use a supported browser (Chrome, Firefox, Edge, or Safari).",
                    type: "error",
                    confirmAction: null,
                });
            }
        }
    }, []);

    useEffect(() => {
        if (isStarted && role === "user") {
            if (!checkBrowserSupport()) return;

            enforceFullscreen();
            setIsQuizActive(true);

            localStorage.setItem(`quizSession_${quizId}`, sessionId);

            let resizeTimeout = null;
            let focusTimeout = null;

            const checkMultipleInstances = () => {
                if (localStorage.getItem(`quizSession_${quizId}`) !== sessionId) {
                    setViolationCount((prev) => prev + 1);
                    setPopup({
                        message: "Multiple quiz instances detected. This is not allowed.",
                        type: "error",
                        confirmAction: null,
                    });
                    enforceFullscreen();
                    if (violationCount + 1 >= MAX_VIOLATIONS) {
                        handleSubmit(true);
                    }
                }
            };

            const checkDevTools = () => {
                const ua = navigator.userAgent.toLowerCase();
                const isMobile = /mobile|android|iphone|ipad|ipod|tablet/.test(ua);
                if (!isMobile) {
                    const threshold = 100;
                    const widthDiff = window.outerWidth - window.innerWidth;
                    const heightDiff = window.outerHeight - window.innerHeight;
                    if (widthDiff > threshold || heightDiff > threshold) {
                        setViolationCount((prev) => prev + 1);
                        setPopup({
                            message: "Developer tools detected. Please close them and restore fullscreen.",
                            type: "error",
                            confirmAction: null,
                        });
                        enforceFullscreen();
                        if (violationCount + 1 >= MAX_VIOLATIONS) {
                            handleSubmit(true);
                        }
                        return true;
                    }
                }
                return false;
            };

            const checkFullscreenCompliance = () => {
                if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
                    setViolationCount((prev) => prev + 1);
                    setPopup({
                        message: `Fullscreen not restored within 5 seconds. Attempts left: ${MAX_VIOLATIONS - violationCount - 1}`,
                        type: "error",
                        confirmAction: null,
                    });
                    enforceFullscreen();
                    if (violationCount + 1 < MAX_VIOLATIONS) {
                        resizeTimeout = setTimeout(checkFullscreenCompliance, 5000);
                    } else {
                        handleSubmit(true);
                    }
                }
            };

            const checkFocusCompliance = () => {
                if (document.hidden || !document.hasFocus()) {
                    setViolationCount((prev) => prev + 1);
                    setPopup({
                        message: `Focus not restored within 5 seconds. Return to the quiz window. Attempts left: ${MAX_VIOLATIONS - violationCount - 1}`,
                        type: "error",
                        confirmAction: null,
                    });
                    enforceFullscreen();
                    if (violationCount + 1 < MAX_VIOLATIONS) {
                        focusTimeout = setTimeout(checkFocusCompliance, 5000);
                    } else {
                        handleSubmit(true);
                    }
                }
            };

            const handleResize = () => {
                const expectedWidth = window.screen.width;
                const expectedHeight = window.screen.height;
                if (window.innerWidth < expectedWidth * 0.9 || window.innerHeight < expectedHeight * 0.9) {
                    setViolationCount((prev) => prev + 1);
                    setPopup({
                        message: "Window resizing or split-screen detected. Restore fullscreen within 5 seconds.",
                        type: "error",
                        confirmAction: null,
                    });
                    enforceFullscreen();
                    if (violationCount + 1 < MAX_VIOLATIONS) {
                        if (resizeTimeout) clearTimeout(resizeTimeout);
                        resizeTimeout = setTimeout(checkFullscreenCompliance, 5000);
                    } else {
                        handleSubmit(true);
                    }
                }
            };

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
                    if (resizeTimeout) clearTimeout(resizeTimeout);
                    if (violationCount + 1 < MAX_VIOLATIONS) {
                        resizeTimeout = setTimeout(checkFullscreenCompliance, 5000);
                    }
                }
            };

            const visibilityChange = () => {
                if (document.hidden) {
                    handleViolation("Tab switch or app switch");
                    if (focusTimeout) clearTimeout(focusTimeout);
                    if (violationCount + 1 < MAX_VIOLATIONS) {
                        focusTimeout = setTimeout(checkFocusCompliance, 5000);
                    }
                }
            };

            const handleBlur = () => {
                handleViolation("Window lost focus (possible activity on another screen)");
                if (focusTimeout) clearTimeout(focusTimeout);
                if (violationCount + 1 < MAX_VIOLATIONS) {
                    focusTimeout = setTimeout(checkFocusCompliance, 5000);
                }
            };

            const handleFocus = () => {
                enforceFullscreen();
                checkMultipleInstances();
                checkBrowserSupport();
                checkDevTools();
                if (focusTimeout) clearTimeout(focusTimeout);
            };

            const handleKeyDown = (e) => {
                if (
                    e.key === "Escape" ||
                    e.key === "Tab" ||
                    (e.altKey && e.key === "Tab") ||
                    (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
                    (e.ctrlKey && (e.key === "U" || e.key === "S")) ||
                    e.key === "F12" ||
                    e.key === "Meta"
                ) {
                    e.preventDefault();
                    handleViolation("Keyboard shortcut or device-specific key");
                }
            };

            const disableCopyPaste = (e) => {
                e.preventDefault();
                setPopup({
                    message: "Copying, pasting, or right-clicking is not allowed during the quiz.",
                    type: "error",
                    confirmAction: null,
                });
            };

            document.body.style.userSelect = "none";
            document.body.style.webkitUserSelect = "none";
            document.body.style.msUserSelect = "none";
            document.body.style.pointerEvents = "auto";
            document.body.ondragstart = () => false;

            document.addEventListener("fullscreenchange", fullscreenChange);
            document.addEventListener("webkitfullscreenchange", fullscreenChange);
            document.addEventListener("msfullscreenchange", fullscreenChange);
            document.addEventListener("visibilitychange", visibilityChange);
            window.addEventListener("blur", handleBlur);
            window.addEventListener("focus", handleFocus);
            document.addEventListener("keydown", handleKeyDown);
            document.addEventListener("copy", disableCopyPaste);
            document.addEventListener("cut", disableCopyPaste);
            document.addEventListener("paste", disableCopyPaste);
            document.addEventListener("contextmenu", disableCopyPaste);
            document.addEventListener("dragstart", disableCopyPaste);
            window.addEventListener("resize", handleResize);

            const interval = setInterval(() => {
                enforceFullscreen();
                checkMultipleInstances();
                checkBrowserSupport();
                checkDevTools();
            }, 100);

            return () => {
                document.body.style.userSelect = "";
                document.body.style.webkitUserSelect = "";
                document.body.style.msUserSelect = "";
                document.body.style.pointerEvents = "";
                document.body.ondragstart = null;
                document.removeEventListener("fullscreenchange", fullscreenChange);
                document.removeEventListener("webkitfullscreenchange", fullscreenChange);
                document.removeEventListener("msfullscreenchange", fullscreenChange);
                document.removeEventListener("visibilitychange", visibilityChange);
                window.removeEventListener("blur", handleBlur);
                window.removeEventListener("focus", handleFocus);
                document.removeEventListener("keydown", handleKeyDown);
                document.removeEventListener("copy", disableCopyPaste);
                document.removeEventListener("cut", disableCopyPaste);
                document.removeEventListener("paste", disableCopyPaste);
                document.removeEventListener("contextmenu", disableCopyPaste);
                document.removeEventListener("dragstart", disableCopyPaste);
                window.removeEventListener("resize", handleResize);
                clearInterval(interval);
                if (resizeTimeout) clearTimeout(resizeTimeout);
                if (focusTimeout) clearTimeout(focusTimeout);
                localStorage.removeItem(`quizSession_${quizId}`);
                setIsQuizActive(false);
            };
        }
    }, [isStarted, role, violationCount, enforceFullscreen, handleSubmit, setIsQuizActive, isSubmitted, checkBrowserSupport, sessionId, quizId]);

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

    if (!isBrowserSupported) {
        return (
            <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
                <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <Popup message={popup.message} type={popup.type} onClose={closePopup} confirmAction={popup.confirmAction} />
                </div>
            </div>
        );
    }

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
                            <li><strong>Fullscreen Mode</strong>: The quiz must be taken in fullscreen mode on supported browsers. Exiting fullscreen, resizing the window, switching apps, or using unsupported browsers will be considered a violation.</li>
                            <li><strong>Violation Policy</strong>: You are allowed {MAX_VIOLATIONS} violations (e.g., exiting fullscreen, switching apps/screens, using device-specific keys, or resizing). You have 5 seconds to restore fullscreen and focus after a violation, or additional violations will be counted.</li>
                            <li><strong>Browser Requirements</strong>: Use only the latest version of Chrome, Firefox, Edge, or Safari on desktop or mobile. Other browsers (e.g., UC Browser, Opera Mini) are not allowed and will be blocked.</li>
                            <li><strong>Technical Requirements</strong>: Ensure a stable internet connection and avoid refreshing the page to prevent quiz interruptions.</li>
                        </ul>
                        <button
                            onClick={() => setIsStarted(true)}
                            className="mt-3 sm:mt-4 w-full sm:w-auto p-2 sm:p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs sm:text-sm"
                            disabled={!isBrowserSupported}
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