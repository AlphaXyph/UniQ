import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../api";
import Popup from "../../components/popup";

function AttemptQuiz() {
    const { quizId } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [isStarted, setIsStarted] = useState(false); // Track if quiz has started
    const [timeLeft, setTimeLeft] = useState(null); // Timer in seconds
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role || "user";

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const token = localStorage.getItem("token");
                console.log("Fetching quiz with ID:", quizId, "token:", token);
                const res = await API.get(`/quiz/${quizId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("Fetched quiz:", res.data);
                setQuiz(res.data);
                if (role === "user") {
                    setAnswers(new Array(res.data.questions.length).fill(null));
                    setTimeLeft(res.data.timer * 60); // Convert minutes to seconds
                }
            } catch (err) {
                console.error("Fetch quiz error:", err.response?.data || err.message);
                setPopup({ message: err.response?.data?.msg || "Error loading quiz", type: "error" });
            }
        };
        fetchQuiz();
    }, [quizId, role]);

    const handleSubmit = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            console.log("Submitting quiz:", { quizId, answers, token });
            const res = await API.post(
                "/result/submit",
                { quizId, answers },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Submit response:", res.data);
            setPopup({ message: `Your Score: ${res.data.score}/${res.data.total}`, type: "success" });
            setTimeout(() => navigate("/dashboard/result"), 2000);
        } catch (err) {
            console.error("Submit quiz error:", err.response?.data || err.message);
            setPopup({ message: err.response?.data?.msg || "Submission failed", type: "error" });
        }
    }, [quizId, answers, navigate]);

    useEffect(() => {
        if (role === "user" && isStarted && timeLeft > 0) {
            const timerId = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerId);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timerId);
        }
    }, [isStarted, timeLeft, role, handleSubmit]); // Added handleSubmit

    const handleOptionChange = (qIndex, optIndex) => {
        const copy = [...answers];
        copy[qIndex] = optIndex;
        setAnswers(copy);
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
    };

    if (!quiz) return <p>Loading...</p>;

    if (role === "admin") {
        return (
            <div className="relative space-y-6">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                <h2 className="text-2xl font-bold">{quiz.title} (View Only)</h2>
                {quiz.questions.map((q, i) => (
                    <div key={q._id || i} className="p-4 border rounded bg-white">
                        <p className="font-semibold">{i + 1}. {q.question}</p>
                        {q.options.map((opt, j) => (
                            <p key={j} className="ml-2">
                                {j + 1}. {opt} {q.answer === j ? "( ✔️Correct )" : ""}
                            </p>
                        ))}
                    </div>
                ))}
                <button
                    onClick={() => navigate("/dashboard")}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (!isStarted) {
        return (
            <div className="relative space-y-6">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                <h2 className="text-2xl font-bold">{quiz.title}</h2>
                <div className="p-4 border rounded bg-white">
                    <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>This quiz must be completed in {quiz.timer} minute{quiz.timer !== 1 ? "s" : ""}.</li>
                        <li>Total Questions: {quiz.questions.length}</li>
                        <li>Once submitted, you cannot change your answers.</li>
                        <li>Do not reload the page during the quiz.</li>
                        <li>Do not try to copy or minimize the screen (fullscreen mode to be added later).</li>
                    </ul>
                    <button
                        onClick={() => setIsStarted(true)}
                        className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        Start Quiz
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative space-y-6">
            <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{quiz.title}</h2>
                <p className="text-lg font-semibold text-red-500">Time Left: {formatTime(timeLeft)}</p>
            </div>
            {quiz.questions.map((q, i) => (
                <div key={q._id || i} className="p-4 border rounded bg-white">
                    <p className="font-semibold">{i + 1}. {q.question}</p>
                    {q.options.map((opt, j) => (
                        <label key={j} className="block">
                            <input
                                type="radio"
                                name={`q${i}`}
                                checked={answers[i] === j}
                                onChange={() => handleOptionChange(i, j)}
                                disabled={timeLeft === 0}
                            />
                            <span className="ml-2">{opt}</span>
                        </label>
                    ))}
                </div>
            ))}
            <button
                onClick={handleSubmit}
                className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ${timeLeft === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={timeLeft === 0}
            >
                Submit Quiz
            </button>
        </div>
    );
}

export default AttemptQuiz;