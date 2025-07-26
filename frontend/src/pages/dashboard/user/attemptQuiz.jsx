import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../../api";
import Popup from "../../../components/popup";
import { jwtDecode } from "jwt-decode";

function AttemptQuiz({ setIsQuizActive }) {
    const { quizId } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [isStarted, setIsStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [violationCount, setViolationCount] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isBrowserSupported, setIsBrowserSupported] = useState(true);
    const [checksPassed, setChecksPassed] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [_countdown, setCountdown] = useState(null);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role || "user";
    const MAX_VIOLATIONS = 5;
    const [sessionId, setSessionId] = useState(null);
    const lastViolationTime = useRef(0);
    const lastPopStateTime = useRef(0);
    const THROTTLE_MS = 500;
    const FOCUS_GRACE_PERIOD = 5000;
    const fullscreenCheckIntervalRef = useRef(null);
    const focusCheckIntervalRef = useRef(null);
    const isHandlingViolation = useRef(false);
    const popupTimeoutRef = useRef(null);
    const isRotating = useRef(false);
    const isSubmitting = useRef(false);
    const focusLossTimeoutRef = useRef(null);
    const lastFocusLossTime = useRef(0);

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
            (isMobile && (document.documentElement.requestFullscreen ||
                document.documentElement.webkitRequestFullscreen));
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
            setPopup({ message: "Please click 'Fullscreen' to start the quiz.", type: "error" });
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
                setPopup({ message: "Fullscreen mode not supported. Please use the latest version of Chrome, Firefox, Edge, or Safari.", type: "error" });
                setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
            }
        } catch (err) {
            console.error("Fullscreen request failed:", err);
            let message = "Failed to enter fullscreen mode. Please try again.";
            if (err.name === "NotAllowedError") {
                message = "Fullscreen permission denied. Please allow fullscreen for this site in browser settings and click 'Enter Fullscreen' again.";
            } else if (err.name === "NotSupportedError") {
                message = "Fullscreen mode is not supported on this browser or device. Please use Chrome, Firefox, or Safari.";
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

    const refreshToken = useCallback(async () => {
        try {
            const token = await localStorage.getItem("token");
            if (!token) {
                setPopup({ message: "Session expired. Please log in again.", type: "error" });
                setTimeout(() => navigate("/login"), 3000);
                return;
            }

            const decoded = jwtDecode(token);
            const currentTime = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = decoded.exp - currentTime;

            if (timeUntilExpiry < 15 * 60) {
                const res = await API.post("/auth/refresh-token", {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const newToken = res.data.token;
                localStorage.setItem("token", newToken);
                setPopup({ message: "Session extended successfully.", type: "success" });
                setTimeout(() => setPopup({ message: "", type: "success" }), 2000);
            }
        } catch (err) {
            console.error("Token refresh failed:", err);
            setPopup({ message: "Session expired. Please log in again.", type: "error" });
            setTimeout(() => navigate("/login"), 3000);
        }
    }, [navigate]);

    useEffect(() => {
        const fetchQuizAndSession = async () => {
            try {
                const token = localStorage.getItem("token");
                const [quizRes, sessionRes] = await Promise.all([
                    API.get(`/quiz/${quizId}`, { headers: { Authorization: `Bearer ${token}` } }),
                    API.get(`/quiz/${quizId}/session`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (quizRes.data.hasAttempted && role === "user") {
                    setPopup({ message: "You have already attempted this quiz.", type: "error" });
                    setTimeout(() => navigate("/dashboard/result"), 3000);
                    return;
                }

                setQuiz(quizRes.data);
                if (role === "user") {
                    if (sessionRes.data.sessionId) {
                        setSessionId(sessionRes.data.sessionId);
                        setAnswers(sessionRes.data.answers);
                        setTimeLeft(sessionRes.data.timeLeft);
                        setViolationCount(sessionRes.data.violationCount);
                        setIsStarted(true);
                    } else {
                        setAnswers(new Array(quizRes.data.questions.length).fill(null));
                        setTimeLeft(quizRes.data.timer * 60);
                        setViolationCount(0);
                    }
                }
            } catch (err) {
                console.error("Fetch quiz or session failed:", err);
                setPopup({ message: err.response?.data?.msg || "Error loading quiz", type: "error" });
                setTimeout(() => navigate("/dashboard"), 3000);
            }
        };
        fetchQuizAndSession();
    }, [quizId, role, navigate]);

    const handleSubmit = useCallback(
        async (isAutoSubmit = false, violationMessage = "", autoSubmissionType = null) => {
            if (isSubmitted || isSubmitting.current) return;
            isSubmitting.current = true;
            setIsSubmitted(true);
            isHandlingViolation.current = true;

            if (fullscreenCheckIntervalRef.current) {
                clearInterval(fullscreenCheckIntervalRef.current);
                fullscreenCheckIntervalRef.current = null;
            }
            if (focusCheckIntervalRef.current) {
                clearInterval(focusCheckIntervalRef.current);
                focusCheckIntervalRef.current = null;
            }
            if (popupTimeoutRef.current) {
                clearTimeout(popupTimeoutRef.current);
                popupTimeoutRef.current = null;
            }
            if (focusLossTimeoutRef.current) {
                clearTimeout(focusLossTimeoutRef.current);
                focusLossTimeoutRef.current = null;
            }

            try {
                let finalSubmissionType;
                if (!isAutoSubmit) {
                    const unansweredIndex = answers.findIndex((ans) => ans === null);
                    if (unansweredIndex !== -1) {
                        setPopup({ message: `Please answer Question ${unansweredIndex + 1} before submitting.`, type: "error" });
                        setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
                        setIsSubmitted(false);
                        isSubmitting.current = false;
                        isHandlingViolation.current = false;
                        return;
                    }
                    finalSubmissionType = "Submitted";
                } else {
                    finalSubmissionType = autoSubmissionType || "Auto-Submitted";
                    if (violationMessage) {
                        setPopup({ message: violationMessage, type: "error" });
                        popupTimeoutRef.current = setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
                    }
                }

                const token = localStorage.getItem("token");
                if (!token) {
                    setPopup({ message: "Session expired. Please log in again.", type: "error" });
                    setTimeout(() => navigate("/login"), 3000);
                    setIsSubmitted(false);
                    isSubmitting.current = false;
                    isHandlingViolation.current = false;
                    return;
                }

                const payload = { sessionId, submissionType: finalSubmissionType, violationMessage };
                const response = await API.post("/quiz/submit", payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Set popup message for user feedback
                setPopup({ message: response.data.msg || "Quiz submitted successfully!", type: "success" });
                popupTimeoutRef.current = setTimeout(() => {
                    setPopup({ message: "", type: "success" });
                }, 3000);

                // Exit fullscreen and navigate immediately
                try {
                    await document.exitFullscreen?.();
                } catch (err) {
                    console.error("Failed to exit fullscreen:", err);
                }
                setIsQuizActive(false);
                navigate("/dashboard/result");

                if (isAutoSubmit && navigator.sendBeacon) {
                    const beaconPayload = JSON.stringify(payload);
                    const blob = new Blob([beaconPayload], { type: "application/json" });
                    navigator.sendBeacon("/quiz/submit", blob);
                }
            } catch (err) {
                console.error("Submission error:", err);
                setPopup({ message: err.response?.data?.msg || "Submission failed", type: "error" });
                popupTimeoutRef.current = setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
                setIsSubmitted(false);
                isSubmitting.current = false;
                isHandlingViolation.current = false;
            }
        },
        [sessionId, navigate, setIsQuizActive, answers, isSubmitted]
    );

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

            window.history.pushState({ quiz: true }, "", window.location.href);

            let suppressFullscreenViolation = false;

            const fetchSessionState = async () => {
                try {
                    const token = localStorage.getItem("token");
                    const res = await API.get(`/quiz/${quizId}/session`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setTimeLeft(res.data.timeLeft);
                    setViolationCount(res.data.violationCount);
                    if (res.data.timeLeft <= 0) {
                        handleSubmit(true, "Time limit reached. Auto-submitting the quiz.", "Submitted: Time Up");
                    } else if (res.data.violationCount >= MAX_VIOLATIONS) {
                        handleSubmit(true, `Reached maximum violations (${MAX_VIOLATIONS}). Auto-submitting the quiz.`, "Max Violations Reached");
                    } else if (quiz && res.data.timeLeft <= 300 && res.data.timeLeft > 295 && quiz.timer * 60 > 600) {
                        setPopup({ message: "5 minutes left!", type: "warning" });
                        popupTimeoutRef.current = setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
                    } else if (quiz && res.data.timeLeft <= 60 && res.data.timeLeft > 55 && quiz.timer * 60 > 300) {
                        setPopup({ message: "1 minute left!", type: "warning" });
                        popupTimeoutRef.current = setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
                    }
                } catch (err) {
                    console.error("Fetch session state failed:", err);
                }
            };

            const checkMultipleInstances = () => {
                if (localStorage.getItem(`quizSession_${quizId}`) !== sessionId) {
                    handleViolation("Multiple Instances Detected", true);
                }
            };

            const checkDevTools = () => {
                if (isHandlingViolation.current || isSubmitted || isRotating.current) return false;
                const ua = navigator.userAgent.toLowerCase();
                const isMobile = /mobile|android|iphone|ipad|ipod|tablet/.test(ua);
                const isIOS = /iphone|ipad|ipod/.test(ua);
                let isSplitScreen = false;

                if (isMobile) {
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
                        type: "warning"
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
                            handleViolation("Split-Screen Detected", true);
                        } else {
                            setPopup({ message: "", type: "success" });
                        }
                    }, 5000);
                    return true;
                }
                return false;
            };

            const handleViolation = async (type, isMajor = false) => {
                if (isSubmitted || isHandlingViolation.current) return;
                const now = Date.now();
                if (now - lastViolationTime.current < 500) return;
                lastViolationTime.current = now;
                isHandlingViolation.current = true;

                try {
                    const token = localStorage.getItem("token");
                    if (isMajor) {
                        await handleSubmit(true, `${type}. Auto-submitting the quiz.`, type);
                    } else {
                        await API.post(`/quiz/${quizId}/session/${sessionId}/violation`, { violationType: type, isMajor }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        await fetchSessionState();
                        setPopup({ message: `Violation: ${type}. Attempts left: ${MAX_VIOLATIONS - violationCount}`, type: "error" });
                        popupTimeoutRef.current = setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
                        if (type === "Fullscreen exited") {
                            setShowOverlay(true);
                        }
                    }
                } catch (err) {
                    console.error("Violation handling failed:", err);
                } finally {
                    isHandlingViolation.current = false;
                }
            };

            const fullscreenChange = () => {
                if (isHandlingViolation.current || isSubmitted) return;
                const isInFullscreen = isFullscreen();
                if (!suppressFullscreenViolation && !isInFullscreen) {
                    handleViolation("Fullscreen exited");
                } else {
                    setShowOverlay(false);
                    setPopup({ message: "", type: "success" });
                }
            };

            const visibilityChange = () => {
                if (isHandlingViolation.current || isSubmitted) return;
                if (document.hidden) {
                    handleViolation("Tab Change Detected", true);
                } else {
                    setShowOverlay(false);
                    setPopup({ message: "", type: "success" });
                }
            };

            const checkFocusLoss = () => {
                if (isHandlingViolation.current || isSubmitted) return;
                const now = Date.now();
                if (now - lastFocusLossTime.current < 3000) return;
                if (!document.hasFocus()) {
                    lastFocusLossTime.current = now;
                    setCountdown(FOCUS_GRACE_PERIOD / 1000);
                    setShowOverlay(true);
                    setPopup({
                        message: `Please return focus to the quiz window within ${FOCUS_GRACE_PERIOD / 1000} seconds. Attempts left: ${MAX_VIOLATIONS - violationCount}`,
                        type: "warning"
                    });

                    const countdownInterval = setInterval(() => {
                        setCountdown((prev) => {
                            if (prev <= 1) {
                                clearInterval(countdownInterval);
                                if (!document.hasFocus()) {
                                    handleViolation("Focus Loss Detected", true);
                                } else {
                                    setPopup({ message: "", type: "success" });
                                    setShowOverlay(false);
                                }
                                return null;
                            }
                            setPopup({
                                message: `Please return focus to the quiz window within ${prev - 1} seconds. Attempts left: ${MAX_VIOLATIONS - violationCount}`,
                                type: "warning"
                            });
                            return prev - 1;
                        });
                    }, 1000);

                    focusLossTimeoutRef.current = setTimeout(() => {
                        clearInterval(countdownInterval);
                        if (!document.hasFocus()) {
                            handleViolation("Focus Loss Detected", true);
                        } else {
                            setPopup({ message: "", type: "success" });
                            setShowOverlay(false);
                            setCountdown(null);
                        }
                    }, FOCUS_GRACE_PERIOD);
                } else if (focusLossTimeoutRef.current) {
                    clearTimeout(focusLossTimeoutRef.current);
                    focusLossTimeoutRef.current = null;
                    setShowOverlay(false);
                    setPopup({ message: "", type: "success" });
                    setCountdown(null);
                }
            };

            const handleKeyDown = (e) => {
                if (isHandlingViolation.current || isSubmitted) return;
                const key = e.key.toLowerCase();

                if (
                    (e.altKey && key === "printscreen") ||
                    (e.metaKey && e.shiftKey && (key === "3" || key === "4")) ||
                    (e.metaKey && e.shiftKey && key === "s") ||
                    (e.metaKey && key === "printscreen") ||
                    (e.ctrlKey && key === "t") ||
                    (e.metaKey && key === "t") ||
                    (e.ctrlKey && key === "n") ||
                    (e.metaKey && key === "n") ||
                    (e.ctrlKey && e.shiftKey && key === "t") ||
                    (e.ctrlKey && e.shiftKey && key === "n") ||
                    (e.altKey && key === "tab") ||
                    (e.metaKey && key === "tab") ||
                    key === "f5" ||
                    (e.ctrlKey && key === "r") ||
                    (e.metaKey && key === "r")
                ) {
                    e.preventDefault();
                    const violationMessage =
                        (e.altKey && key === "printscreen") ? "Alt + PrintScreen Detected" :
                            (e.metaKey && e.shiftKey && key === "3") ? "Cmd + Shift + 3 Detected" :
                                (e.metaKey && e.shiftKey && key === "4") ? "Cmd + Shift + 4 Detected" :
                                    (e.metaKey && e.shiftKey && key === "s") ? "Windows + Shift + S Detected" :
                                        (e.metaKey && key === "printscreen") ? "Windows + PrintScreen Detected" :
                                            (e.ctrlKey && key === "t") ? "Ctrl + T Detected" :
                                                (e.metaKey && key === "t") ? "Cmd + T Detected" :
                                                    (e.ctrlKey && key === "n") ? "Ctrl + N Detected" :
                                                        (e.metaKey && key === "n") ? "Cmd + N Detected" :
                                                            (e.ctrlKey && e.shiftKey && key === "t") ? "Ctrl + Shift + T Detected" :
                                                                (e.ctrlKey && e.shiftKey && key === "n") ? "Ctrl + Shift + N Detected" :
                                                                    (e.altKey && key === "tab") ? "Alt + Tab Detected" :
                                                                        (e.metaKey && key === "tab") ? "Cmd + Tab Detected" :
                                                                            key === "f5" ? "F5 Detected" :
                                                                                (e.ctrlKey && key === "r") ? "Ctrl + R Detected" :
                                                                                    "Cmd + R Detected";
                    handleViolation(violationMessage, true);
                    return;
                }

                if (
                    key === "printscreen" ||
                    key === "meta" ||
                    key === "command" ||
                    (e.ctrlKey || e.metaKey) && (key === "c" || key === "v" || key === "x") ||
                    (e.ctrlKey || e.metaKey) && key === "p" ||
                    (e.ctrlKey || e.metaKey) && key === "s" ||
                    key === "f7" ||
                    (e.altKey && (key === "arrowleft" || key === "arrowright" || key === "arrowup" || key === "arrowdown")) ||
                    (e.ctrlKey && e.shiftKey && (key === "i" || key === "j" || key === "c")) ||
                    key === "f12" ||
                    key === "f11" ||
                    key === "escape"
                ) {
                    e.preventDefault();
                    if (key === "escape") {
                        suppressFullscreenViolation = true;
                        setTimeout(() => {
                            suppressFullscreenViolation = false;
                        }, 100);
                    }
                    handleViolation(`Restricted key pressed: ${key}`);
                }
            };

            const disableCopyPaste = (e) => {
                if (isHandlingViolation.current || isSubmitted) return;
                e.preventDefault();
                handleViolation("Right-click attempted");
            };

            const handleOrientationChange = () => {
                isRotating.current = true;
                setTimeout(() => {
                    isRotating.current = false;
                }, 500);
            };

            const handlePopState = () => {
                if (isHandlingViolation.current || isSubmitted) return;
                const now = Date.now();
                if (now - lastPopStateTime.current < THROTTLE_MS) return;
                lastPopStateTime.current = now;
                window.history.pushState({ quiz: true }, "", window.location.href);
                handleSubmit(true, "Back Button Detected. Auto-submitting the quiz.", "Back Button Detected");
            };

            const handleResize = () => {
                if (isHandlingViolation.current || isSubmitted || isRotating.current) return;
                checkDevTools();
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
            document.addEventListener("keydown", handleKeyDown, { capture: true });
            document.addEventListener("contextmenu", disableCopyPaste);
            window.addEventListener("orientationchange", handleOrientationChange);
            window.addEventListener("popstate", handlePopState);
            window.addEventListener("resize", handleResize);

            const ua = navigator.userAgent.toLowerCase();
            const isMobile = /mobile|android|iphone|ipad|ipod|tablet/.test(ua);
            const interval = isMobile ? 1500 : 1000;
            fullscreenCheckIntervalRef.current = setInterval(() => {
                if (isHandlingViolation.current || isSubmitted) return;
                checkMultipleInstances();
                checkDevTools();
                if (!isFullscreen()) {
                    setShowOverlay(true);
                }
            }, interval);

            focusCheckIntervalRef.current = setInterval(checkFocusLoss, 2000);
            const sessionStateInterval = setInterval(fetchSessionState, 1000);

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
                document.removeEventListener("keydown", handleKeyDown, { capture: true });
                document.removeEventListener("contextmenu", disableCopyPaste);
                window.removeEventListener("orientationchange", handleOrientationChange);
                window.removeEventListener("popstate", handlePopState);
                window.removeEventListener("resize", handleResize);
                if (fullscreenCheckIntervalRef.current) {
                    clearInterval(fullscreenCheckIntervalRef.current);
                }
                if (focusCheckIntervalRef.current) {
                    clearInterval(focusCheckIntervalRef.current);
                }
                if (sessionStateInterval) {
                    clearInterval(sessionStateInterval);
                }
                if (popupTimeoutRef.current) {
                    clearTimeout(popupTimeoutRef.current);
                }
                if (focusLossTimeoutRef.current) {
                    clearTimeout(focusLossTimeoutRef.current);
                }
                localStorage.removeItem(`quizSession_${quizId}`);
                setIsQuizActive(false);
            };
        }
    }, [isStarted, role, violationCount, setIsQuizActive, isSubmitted, sessionId, quizId, checkBrowserSupport, handleSubmit, quiz]);

    useEffect(() => {
        if (isStarted && role === "user" && timeLeft > 0 && quiz) {
            const tokenCheckInterval = setInterval(() => {
                refreshToken();
            }, 60000);
            return () => clearInterval(tokenCheckInterval);
        }
    }, [isStarted, role, timeLeft, quiz, refreshToken]);

    const handleOptionChange = async (qIndex, optIndex) => {
        const copy = [...answers];
        copy[qIndex] = optIndex;
        setAnswers(copy);
        try {
            const token = localStorage.getItem("token");
            await API.put(`/quiz/${quizId}/session/${sessionId}/answers`, { answers: copy }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Update answers failed:", err);
        }
    };

    const handleStartQuiz = async () => {
        if (!checkPreQuizConditions()) return;
        try {
            const token = localStorage.getItem("token");
            const res = await API.post(`/quiz/${quizId}/session`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSessionId(res.data.sessionId);
            setTimeLeft(res.data.timeLeft);
            setViolationCount(res.data.violationCount);
            const quizRes = await API.get(`/quiz/${quizId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuiz(quizRes.data);
            setAnswers(new Array(quizRes.data.questions.length).fill(null));
            setIsStarted(true);
        } catch (err) {
            console.error("Start quiz failed:", err);
            setPopup({ message: err.response?.data?.msg || "Failed to start quiz", type: "error" });
            setTimeout(() => setPopup({ message: "", type: "success" }), 3000);
        }
    };

    const closePopup = () => {
        if (popupTimeoutRef.current) {
            clearTimeout(popupTimeoutRef.current);
            popupTimeoutRef.current = null;
        }
        setPopup({ message: "", type: "success" });
        setCountdown(null);
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
                            <p className="font-semibold text-xs sm:text-sm mb-2">Question {i + 1}</p>
                            {q.questionImage && (
                                <img
                                    src={q.questionImage}
                                    alt={`Question ${i + 1}`}
                                    className="w-full max-w-xs h-auto object-contain mx-auto mb-2"
                                />
                            )}
                            <p className="text-xs sm:text-sm mb-4">{q.question || ""}</p>
                            <hr className="border-gray-300 mb-4" />
                            <div className="space-y-3">
                                {q.options.map((opt, j) => (
                                    <div key={j} className="flex flex-col gap-1 text-xs sm:text-sm">
                                        {opt.image && (
                                            <div className="flex items-start gap-2">
                                                <span className="text-sm text-gray-600 font-medium self-start mt-1">{j + 1}.</span>
                                                <img
                                                    src={opt.image}
                                                    alt={`Option ${j + 1}`}
                                                    className="w-16 h-16 object-contain"
                                                />
                                            </div>
                                        )}
                                        <p>
                                            {!opt.image && <span className="text-sm text-gray-600 font-medium mr-2">{j + 1}.</span>}
                                            {opt.text || ""} {q.answer === j ? <span className="text-green-600">(✔️ Correct)</span> : ""}
                                        </p>
                                    </div>
                                ))}
                            </div>
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
                            <li><strong>Violations</strong>: Actions such as pressing restricted keys (e.g., PrintScreen, Escape) or attempting to copy content are recorded as violations. After {MAX_VIOLATIONS} violations, the quiz will auto-submit.</li>
                            <li><strong>Auto-Submission Violations</strong>: Switching tabs, opening new windows/tabs, navigating away, or prolonged loss of window focus will trigger immediate auto-submission.</li>
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
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 sm:text-left">{quiz.subject} - {quiz.title}</h2>
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
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6 mt-10 sm:mt-20">
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
                        <p className="font-semibold text-xs sm:text-sm mb-2">Question {i + 1}</p>
                        {q.questionImage && (
                            <img
                                src={q.questionImage}
                                alt={`Question ${i + 1}`}
                                className="w-full max-w-xs h-auto object-contain mx-auto mb-2"
                            />
                        )}
                        <p className="text-xs sm:text-sm mb-4">{q.question || ""}</p>
                        <hr className="border-gray-300 mb-4" />
                        <div className="space-y-3">
                            {q.options.map((opt, j) => (
                                <label key={j} className="block text-xs sm:text-sm">
                                    <div className="flex flex-col gap-2">
                                        {opt.image && (
                                            <div className="flex items-start gap-2">
                                                <span className="text-sm text-gray-600 font-medium self-start mt-1">{j + 1}.</span>
                                                <img
                                                    src={opt.image}
                                                    alt={`Option ${j + 1}`}
                                                    className="w-16 h-16 object-contain"
                                                />
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-2 pl-6 sm:pl-0">
                                            <input
                                                type="radio"
                                                name={`q${i}`}
                                                checked={answers[i] === j}
                                                onChange={() => handleOptionChange(i, j)}
                                                disabled={timeLeft === 0 || isSubmitted}
                                                className="mr-2"
                                            />
                                            <span>
                                                {!opt.image && <span className="text-sm text-gray-600 font-medium mr-2">{j + 1}.</span>}
                                                {opt.text || ""}
                                            </span>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
                <button
                    onClick={() => handleSubmit(false)}
                    className={`w-full sm:w-auto p-2 sm:p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs sm:text-sm ${timeLeft === 0 || isSubmitted ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={timeLeft === 0 || isSubmitted}
                >
                    Submit Quiz
                </button>
            </div>
        </div>
    );
}

export default AttemptQuiz;