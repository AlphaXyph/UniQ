import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../api";
import Popup from "../../components/popup";

function AttemptQuiz() {
    const { quizId } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const token = localStorage.getItem("token");
                console.log("Fetching quiz with ID:", quizId, "token:", token); // Debug
                const res = await API.get(`/quiz/${quizId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("Fetched quiz:", res.data); // Debug
                setQuiz(res.data);
                setAnswers(new Array(res.data.questions.length).fill(null));
            } catch (err) {
                console.error("Fetch quiz error:", err.response?.data || err.message); // Debug
                setPopup({ message: err.response?.data?.msg || "Error loading quiz", type: "error" });
            }
        };
        fetchQuiz();
    }, [quizId]);

    const handleOptionChange = (qIndex, optIndex) => {
        const copy = [...answers];
        copy[qIndex] = optIndex;
        setAnswers(copy);
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem("token");
            console.log("Submitting quiz:", { quizId, answers, token }); // Debug
            const res = await API.post(
                "/result/submit",
                { quizId, answers },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Submit response:", res.data); // Debug
            setPopup({ message: `Your Score: ${res.data.score}/${res.data.total}`, type: "success" });
            setTimeout(() => navigate("/dashboard/result"), 2000);
        } catch (err) {
            console.error("Submit quiz error:", err.response?.data || err.message); // Debug
            setPopup({ message: err.response?.data?.msg || "Submission failed", type: "error" });
        }
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
    };

    if (!quiz) return <p>Loading...</p>;

    return (
        <div className="relative space-y-6">
            <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            <h2 className="text-2xl font-bold">{quiz.title}</h2>
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
                            />
                            <span className="ml-2">{opt}</span>
                        </label>
                    ))}
                </div>
            ))}
            <button onClick={handleSubmit} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                Submit Quiz
            </button>
        </div>
    );
}

export default AttemptQuiz;