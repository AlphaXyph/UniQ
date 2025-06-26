import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../api";

function AttemptQuiz() {
    const { quizId } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await API.get("/quiz/all", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const quizFound = res.data.find((q) => q._id === quizId);
                if (!quizFound) return alert("Quiz not found");
                setQuiz(quizFound);
                setAnswers(new Array(quizFound.questions.length).fill(null));
            } catch (err) {
                alert(err.response?.data?.msg || "Error loading quiz");
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
            const res = await API.post(
                "/result/submit",
                { quizId, answers },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(`Your Score: ${res.data.score}/${res.data.total}`);
            navigate("/dashboard/result");
        } catch (err) {
            alert(err.response?.data?.msg || "Submission failed");
        }
    };

    if (!quiz) return <p>Loading...</p>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">{quiz.title}</h2>
            {quiz.questions.map((q, i) => (
                <div key={i} className="p-4 border rounded bg-white">
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
            <button onClick={handleSubmit} className="bg-green-500 text-white px-4 py-2 rounded">
                Submit Quiz
            </button>
        </div>
    );
}

export default AttemptQuiz;
