import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../../api";
import Popup from "../../../components/popup";

function AttemptQuiz({ setIsQuizActive }) {
    const { quizId } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [originalIndices, setOriginalIndices] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [isStarted, setIsStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [violationCount, setViolationCount] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isBrowserSupported, setIsBrowserSupported] = useState(true);
    const [checksPassed, setChecksPassed] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role || "user";
    const MAX_VIOLATIONS = 5;
    const [sessionId] = useState(`${quizId}-${Date.now()}`);
    const lastViolationTime = useRef(0);
    const fullscreenCheckIntervalRef = useRef(null);
    const isHandlingViolation = useRef(false);
    const popupTimeoutRef = useRef(null);
    const isRotating = useRef(false);

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
            document.mozFullScreenEnabled ||
            document.msFullscreenEnabled ||
            (isMobile && (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen));
        const isWebRTCSupported = !!window.RTCPeerConnection;
        const isWebGLSupported = !!window.WebGLRenderingContext;
        const isNavigatorValid = navigator.userAgent !== "" && (navigator.vendor !== "" || isSafari);
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
            setChecksPassed(false);
            setPopup({ message: "Please use the latest version of Chrome, Firefox, Edge, or Safari with fullscreen support.", type: "error" });
            setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
            return false;
        }
        return true;
    }, []);

    const isFullscreen = () =>
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.webkitCurrentFullScreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

    const checkPreQuizConditions = useCallback(() => {
        if (!checkBrowserSupport()) {
            setChecksPassed(false);
            return false;
        }

        const ua = navigator.userAgent.toLowerCase();
        const isMobile = /mobile|android|iphone|ipad|ipod|tablet/.test(ua);
        if (!isMobile) {
            const threshold = 100;
            const widthDiff = window.outerWidth - window.innerWidth;
            const heightDiff = window.outerHeight - window.innerHeight;
            if (widthDiff > threshold || heightDiff > threshold) {
                setPopup({ message: "Developer tools or split-screen detected. Please close them.", type: "error" });
                setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
                setChecksPassed(false);
                return false;
            }
        }

        if (!isFullscreen()) {
            setPopup({ message: "Please click 'Enter Fullscreen' to start the quiz.", type: "error" });
            setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
            setChecksPassed(false);
            return false;
        }

        setChecksPassed(true);
        return true;
    }, [checkBrowserSupport]);

    const attemptFullscreen = useCallback(() => {
        if (isHandlingViolation.current || isSubmitted) return;
        const elem = document.documentElement;
        try {
            if (elem.requestFullscreen) {
                elem.requestFullscreen({ navigationUI: "hide" });
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            } else {
                setIsBrowserSupported(false);
                setChecksPassed(false);
                setPopup({ message: "Fullscreen mode is not supported. Please use the latest version of Chrome, Firefox, Edge, or Safari.", type: "error" });
                setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
            }
        } catch (err) {
            console.error("Fullscreen request failed:", err);
            let message = "Failed to enter fullscreen mode. Please try again.";
            if (err.name === "NotAllowedError") {
                message = "Fullscreen permission denied. Please allow fullscreen for this site in browser settings and click 'Enter Fullscreen' again.";
            } else if (err.name === "NotSupportedError") {
                message = "Fullscreen mode is not supported on this browser or device. Please use Chrome, Firefox, Edge, or Safari.";
            } else if (err.message.includes("Illegal invocation")) {
                message = "Fullscreen request failed due to a browser issue. Please ensure you're using the latest version of your browser and try again.";
            }
            setPopup({ message, type: "error" });
            setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
            setChecksPassed(false);
            if (err.name === "NotSupportedError") {
                setIsBrowserSupported(false);
            }
        }
    }, [isSubmitted]);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await API.get(`/quiz/${quizId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.data.hasAttempted && role === "user") {
                    setPopup({ message: "You have already attempted this quiz.", type: "error" });
                    setTimeout(() => navigate("/dashboard/result"), 3000);
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
                setPopup({ message: err.response?.data?.msg || "Error loading quiz", type: "error" });
                setTimeout(() => navigate("/dashboard"), 3000);
            }
        };
        fetchQuiz();
    }, [quizId, role, navigate]);

    const handleSubmit = useCallback(
        async (isAutoSubmit = false, violationMessage = "") => {
            if (isSubmitted) return;
            setIsSubmitted(true);
            isHandlingViolation.current = true;

            if (fullscreenCheckIntervalRef.current) {
                clearInterval(fullscreenCheckIntervalRef.current);
                fullscreenCheckIntervalRef.current = null;
            }

            if (popupTimeoutRef.current) {
                clearTimeout(popupTimeoutRef.current);
                popupTimeoutRef.current = null;
            }

            if (!isAutoSubmit) {
                const unansweredIndex = answers.findIndex((ans) => ans === null);
                if (unansweredIndex !== -1) {
                    setPopup({ message: `Please answer Question ${unansweredIndex + 1} before submitting.`, type: "error" });
                    setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
                    setIsSubmitted(false);
                    isHandlingViolation.current = false;
                    return;
                }
            }

            if (isAutoSubmit && violationMessage) {
                setPopup({ message: violationMessage, type: "error" });
                popupTimeoutRef.current = setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
            }

            try {
                const token = localStorage.getItem("token");
                const orderedAnswers = role === "user" ? answers.map((_, i) => answers[originalIndices.indexOf(i)]) : answers;
                const response = await API.post(
                    "/quiz/submit",
                    { quizId, answers: orderedAnswers },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setPopup({ message: response.data.msg || "Quiz submitted successfully!", type: "success" });
                popupTimeoutRef.current = setTimeout(() => {
                    setPopup({ message: "", type: "success" });
                    try {
                        document.exitFullscreen?.();
                    } catch (err) {
                        console.error("Failed to exit fullscreen:", err);
                    }
                    setIsQuizActive(false);
                    navigate("/dashboard/result");
                }, 3000);
            } catch (err) {
                setPopup({ message: err.response?.data?.msg || "Submission failed", type: "error" });
                popupTimeoutRef.current = setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
                setIsSubmitted(false);
                isHandlingViolation.current = false;
            }
        },
        [quizId, answers, navigate, setIsQuizActive, originalIndices, role, isSubmitted]
    );

    const markQuizAttempted = async () => {
        try {
            const token = localStorage.getItem("token");
            await API.post(
                "/quiz/start",
                { quizId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error("Error marking quiz as attempted:", err);
            setPopup({ message: err.response?.data?.msg || "Failed to start quiz", type: "error" });
            setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
        }
    };

    useEffect(() => {
        if (!isStarted && role === "user") {
            const handlePreQuizCheck = () => {
                checkPreQuizConditions();
            };

            window.addEventListener("resize", handlePreQuizCheck);
            document.addEventListener("fullscreenchange", handlePreQuizCheck);
            document.addEventListener("webkitfullscreenchange", handlePreQuizCheck);
            document.addEventListener("mozfullscreenchange", handlePreQuizCheck);
            document.addEventListener("msfullscreenchange", handlePreQuizCheck);

            return () => {
                window.removeEventListener("resize", handlePreQuizCheck);
                document.removeEventListener("fullscreenchange", handlePreQuizCheck);
                document.removeEventListener("webkitfullscreenchange", handlePreQuizCheck);
                document.removeEventListener("mozfullscreenchange", handlePreQuizCheck);
                document.removeEventListener("msfullscreenchange", handlePreQuizCheck);
            };
        }
    }, [isStarted, role, checkPreQuizConditions]);

    useEffect(() => {
        if (isStarted && role === "user") {
            if (!checkBrowserSupport()) return;
            setIsQuizActive(true);
            localStorage.setItem(`quizSession_${quizId}`, sessionId);

            let suppressFullscreenViolation = false;

            const checkMultipleInstances = () => {
                if (localStorage.getItem(`quizSession_${quizId}`) !== sessionId) {
                    handleViolation("Multiple quiz instances detected", true);
                }
            };

            const checkDevTools = () => {
                if (isHandlingViolation.current || isSubmitted || isRotating.current) return false;
                const ua = navigator.userAgent.toLowerCase();
                const isMobile = /mobile|android|iphone|ipad|ipod|tablet/.test(ua);
                const isIOS = /iphone|ipad|ipod/.test(ua);
                let isSplitScreen = false;

                if (isMobile) {
                    // Mobile split-screen detection
                    const widthThreshold = 50;
                    const heightThreshold = isIOS ? 150 : 100;
                    const expectedWidth = window.screen.availWidth || window.screen.width;
                    const expectedHeight = window.screen.availHeight || window.screen.height;
                    const currentWidth = window.innerWidth;
                    const currentHeight = window.innerHeight;

                    if (
                        currentWidth < expectedWidth - widthThreshold ||
                        currentHeight < expectedHeight - heightThreshold
                    ) {
                        isSplitScreen = true;
                    }
                } else {
                    // Desktop split-screen detection
                    const threshold = 100;
                    const widthDiff = window.outerWidth - window.innerWidth;
                    const heightDiff = window.outerHeight - window.innerHeight;
                    if (widthDiff > threshold || heightDiff > threshold || window.innerWidth < 300 || window.innerHeight < 300) {
                        isSplitScreen = true;
                    }
                }

                if (isSplitScreen) {
                    setPopup({
                        message: `Violation: Split-screen or resized window detected. Please fix within 5 seconds. Attempts left: ${MAX_VIOLATIONS - violationCount}`,
                        type: "warning",
                    });
                    setTimeout(() => {
                        const isStillSplitScreen = isMobile
                            ? (window.innerWidth < (window.screen.availWidth || window.screen.width) - 50 ||
                                window.innerHeight < (window.screen.availHeight || window.screen.height) - (isIOS ? 150 : 100))
                            : (window.outerWidth - window.innerWidth) > 100 ||
                            (window.outerHeight - window.innerHeight) > 100 ||
                            window.innerWidth < 300 ||
                            window.innerHeight < 300;
                        if (isStillSplitScreen) {
                            handleViolation("Split-screen or resized window not fixed", true);
                        } else {
                            setPopup({ message: "", type: "success" });
                        }
                    }, 5000);
                    return true;
                }
                return false;
            };

            const handleViolation = (type, isMajor = false) => {
                if (isSubmitted || isHandlingViolation.current) return;
                const now = Date.now();
                if (now - lastViolationTime.current < 500) return;
                lastViolationTime.current = now;
                isHandlingViolation.current = true;
                console.log(`Violation: ${type}, Browser: ${navigator.userAgent}, isMobile: ${/mobile|android|iphone|ipad|ipod|tablet/.test(navigator.userAgent.toLowerCase())}`);

                if (isMajor) {
                    handleSubmit(true, `${type}. Auto-submitting the quiz.`);
                } else {
                    setViolationCount((prev) => {
                        const newCount = prev + 1;
                        setPopup({ message: `Violation: ${type}. Attempts left: ${MAX_VIOLATIONS - newCount}`, type: "error" });
                        popupTimeoutRef.current = setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
                        setShowOverlay(true);
                        if (newCount >= MAX_VIOLATIONS) {
                            handleSubmit(true, `Reached maximum violations (${MAX_VIOLATIONS}). Auto-submitting the quiz.`);
                        }
                        isHandlingViolation.current = false;
                        return newCount;
                    });
                }
            };

            const fullscreenChange = () => {
                if (isHandlingViolation.current || isSubmitted) return;
                const isInFullscreen = isFullscreen();
                if (!suppressFullscreenViolation && !isInFullscreen) {
                    handleViolation("Fullscreen exited");
                    setShowOverlay(true);
                } else {
                    setShowOverlay(false);
                }
            };

            const visibilityChange = () => {
                if (isHandlingViolation.current || isSubmitted) return;
                if (document.hidden) {
                    handleViolation("Tab or app switch", true);
                } else {
                    setShowOverlay(false);
                }
            };

            const handleFocus = () => {
                if (isHandlingViolation.current || isSubmitted) return;
                checkMultipleInstances();
                checkDevTools();
                setShowOverlay(false);
                if (!isFullscreen()) {
                    setPopup({ message: `Please return to fullscreen mode to continue the quiz. Attempts left: ${MAX_VIOLATIONS - violationCount}`, type: "warning" });
                    popupTimeoutRef.current = setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
                }
            };

            const handleBlur = () => {
                if (isHandlingViolation.current || isSubmitted) return;
                handleViolation("Window lost focus", true);
            };

            const handleKeyDown = (e) => {
                if (isHandlingViolation.current || isSubmitted) return;
                if (
                    (e.metaKey && e.key === "t") ||
                    (e.ctrlKey && e.key === "t") ||
                    (e.metaKey && e.key === "n") ||
                    (e.ctrlKey && e.key === "n")
                ) {
                    e.preventDefault();
                    handleViolation("Attempt to open new window/tab", true);
                } else if (
                    e.key === "Escape" ||
                    e.key === "Meta" ||
                    e.key === "Command" ||
                    (e.altKey && e.key === "Tab") ||
                    (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
                    (e.ctrlKey && (e.key === "U" || e.key === "S")) ||
                    e.key === "F12" ||
                    e.key === "F11" ||
                    (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4"))
                ) {
                    e.preventDefault();
                    if (e.key === "Escape") {
                        suppressFullscreenViolation = true;
                        setTimeout(() => { suppressFullscreenViolation = false; }, 100);
                    }
                    handleViolation("Restricted key pressed");
                }
            };

            const disableCopyPaste = (e) => {
                if (isHandlingViolation.current || isSubmitted) return;
                e.preventDefault();
                handleViolation("Right-click attempted");
            };

            const handleOrientationChange = () => {
                isRotating.current = true;
                setTimeout(() => { isRotating.current = false; }, 500);
            };

            document.body.style.userSelect = "none";
            document.body.style.webkitUserSelect = "none";
            document.body.style.msUserSelect = "none";
            document.body.ondragstart = () => false;

            document.addEventListener("fullscreenchange", fullscreenChange);
            document.addEventListener("webkitfullscreenchange", fullscreenChange);
            document.addEventListener("mozfullscreenchange", fullscreenChange);
            document.addEventListener("msfullscreenchange", fullscreenChange);
            document.addEventListener("visibilitychange", visibilityChange);
            window.addEventListener("focus", handleFocus);
            window.addEventListener("blur", handleBlur);
            document.addEventListener("keydown", handleKeyDown);
            document.addEventListener("contextmenu", disableCopyPaste);
            window.addEventListener("orientationchange", handleOrientationChange);

            const ua = navigator.userAgent.toLowerCase();
            const isMobile = /mobile|android|iphone|ipad|ipod|tablet/.test(ua);
            const interval = isMobile ? 1500 : 1000;
            fullscreenCheckIntervalRef.current = setInterval(() => {
                if (isHandlingViolation.current || isSubmitted) return;
                checkMultipleInstances();
                checkDevTools();
                setShowOverlay(!isFullscreen());
            }, interval);

            return () => {
                document.body.style.userSelect = "";
                document.body.style.webkitUserSelect = "";
                document.body.style.msUserSelect = "";
                document.body.ondragstart = null;
                document.removeEventListener("fullscreenchange", fullscreenChange);
                document.removeEventListener("webkitfullscreenchange", fullscreenChange);
                document.removeEventListener("mozfullscreenchange", fullscreenChange);
                document.removeEventListener("msfullscreenchange", fullscreenChange);
                document.removeEventListener("visibilitychange", visibilityChange);
                window.removeEventListener("focus", handleFocus);
                window.removeEventListener("blur", handleBlur);
                document.removeEventListener("keydown", handleKeyDown);
                document.removeEventListener("contextmenu", disableCopyPaste);
                window.removeEventListener("orientationchange", handleOrientationChange);
                if (fullscreenCheckIntervalRef.current) {
                    clearInterval(fullscreenCheckIntervalRef.current);
                }
                if (popupTimeoutRef.current) {
                    clearTimeout(popupTimeoutRef.current);
                }
                localStorage.removeItem(`quizSession_${quizId}`);
                setIsQuizActive(false);
            };
        }
    }, [isStarted, role, violationCount, setIsQuizActive, isSubmitted, sessionId, quizId, checkBrowserSupport, handleSubmit, attemptFullscreen]);

    useEffect(() => {
        if (isStarted && role === "user" && timeLeft > 0 && quiz) {
            const timerId = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerId);
                        handleSubmit(true, "Time limit reached. Auto-submitting the quiz.");
                        return 0;
                    }
                    if (quiz.timer * 60 > 600 && prev === 300) {
                        setPopup({ message: "5 minutes left!", type: "warning" });
                        popupTimeoutRef.current = setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
                    }
                    if (quiz.timer * 60 > 300 && prev === 60) {
                        setPopup({ message: "1 minute left!", type: "warning" });
                        popupTimeoutRef.current = setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timerId);
        }
    }, [isStarted, timeLeft, role, quiz, handleSubmit]);

    const handleOptionChange = (qIndex, optIndex) => {
        const copy = [...answers];
        copy[qIndex] = optIndex;
        setAnswers(copy);
    };

    const handleStartQuiz = async () => {
        if (!checkPreQuizConditions()) {
            return;
        }
        await markQuizAttempted();
        setIsStarted(true);
    };

    const closePopup = () => {
        if (popupTimeoutRef.current) {
            clearTimeout(popupTimeoutRef.current);
            popupTimeoutRef.current = null;
        }
        setPopup({ message: "", type: "success" });
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    const getTimerColor = () => {
        if (!quiz) return "bg-green-500";
        if (timeLeft <= 60) return "bg-red-500";
        if (timeLeft <= 300) return "bg-orange-500";
        return "bg-green-500";
    };

    if (!isBrowserSupported) {
        return (
            <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                </div>
            </div>
        );
    }

    if (!quiz) return <div className="min-h-screen bg-gray-100 p-4 sm:p-6"><p className="text-center text-gray-600 text-xs sm:text-sm">Loading...</p></div>;

    if (role === "admin") {
        return (
            <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <Popup message={popup.message} type={popup.type} onClose={closePopup} />
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
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 text-center">{quiz.title}</h2>
                    <p className="text-sm sm:text-base text-gray-600 text-center">Subject: {quiz.subject}</p>
                    <div className="p-4 sm:p-6 border border-gray-200 rounded-lg bg-gray-100 shadow-md">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 text-center">Quiz Instructions</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mb-4 text-center">
                            Please read the following instructions carefully before starting the quiz. Failure to comply may result in disqualification.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-gray-600">
                            <li><strong>Time Limit</strong>: You have {quiz.timer} minute{quiz.timer !== 1 ? "s" : ""} to complete the quiz. The timer starts upon beginning and cannot be paused and the quiz will be auto-submitted once the time ends.</li>
                            <li><strong>Questions</strong>: The quiz contains {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}. All questions must be answered before submission.</li>
                            <li><strong>Fullscreen Mode</strong>: The quiz must be taken in fullscreen mode. Exiting fullscreen will result in a violation, and failure to return may lead to auto-submission.</li>
                            <li><strong>Violations</strong>: Actions such as pressing restricted keys (e.g., Escape, Meta) or attempting to copy content are recorded as violations. After {MAX_VIOLATIONS} violations, the quiz will auto-submit.</li>
                            <li><strong>Auto-Submission Violations</strong>: Switching tabs, opening new windows/tabs, or losing window focus will trigger immediate auto-submission.</li>
                            <li><strong>Browser Requirements</strong>: Use the latest version of Chrome, Firefox, Edge, or Safari with a stable internet connection. Close all other applications.</li>
                            <li><strong>Technical Issues</strong>: Contact support immediately if you encounter issues. Do not refresh or navigate away, as this may trigger a violation or auto-submission.</li>
                        </ul>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mt-4 sm:mt-6">
                            <button
                                onClick={attemptFullscreen}
                                className="w-full sm:w-auto p-3 sm:p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm sm:text-base font-medium"
                            >
                                Enter Fullscreen
                            </button>
                            <button
                                onClick={handleStartQuiz}
                                className={`w-full sm:w-auto p-3 sm:p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm sm:text-base font-medium ${!checksPassed ? "opacity-50 cursor-not-allowed" : ""}`}
                                disabled={!checksPassed}
                            >
                                Start Quiz
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 quiz-active">
            <div className="fixed top-0 left-0 right-0 bg-white shadow-sm p-3 sm:p-4 z-50">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 text-center">{quiz.subject} - {quiz.title}</h2>
                    <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
                        <div className="text-xs sm:text-sm font-medium text-gray-700">
                            Violation Attempts Left: {MAX_VIOLATIONS - violationCount}
                        </div>
                        <div className={`text-xs sm:text-sm font-medium text-white px-2 sm:px-3 py-1 rounded-md ${getTimerColor()}`}>
                            Time Left: {formatTime(timeLeft)}
                        </div>
                    </div>
                </div>
            </div>
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6 mt-16 sm:mt-20">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                {showOverlay && !isSubmitted && (
                    <div className="fixed inset-0 w-full h-full bg-black/80 flex flex-col items-center justify-center z-[9999]">
                        <div className="text-white text-xl sm:text-2xl md:text-3xl font-semibold text-center px-4 sm:px-6 max-w-[90%] sm:max-w-[600px]">
                            Please return to the quiz and click 'Enter Fullscreen' to continue.
                        </div>
                        <button
                            onClick={attemptFullscreen}
                            className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm sm:text-base font-medium z-[10000]"
                        >
                            Enter Fullscreen
                        </button>
                    </div>
                )}
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