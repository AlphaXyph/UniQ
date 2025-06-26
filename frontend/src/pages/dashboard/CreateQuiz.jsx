import React, { useState } from "react";
import API from "../../../api";

function CreateQuiz() {
    const [title, setTitle] = useState("");
    const [questions, setQuestions] = useState([
        { question: "", options: ["", "", "", ""], answer: 0 },
    ]);

    const handleAddQuestion = () => {
        setQuestions([...questions, { question: "", options: ["", "", "", ""], answer: 0 }]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await API.post(
                "/quiz/create",
                { title, questions },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Quiz Created!");
            setTitle("");
            setQuestions([{ question: "", options: ["", "", "", ""], answer: 0 }]);
        } catch (err) {
            alert(err.response?.data?.msg || "Failed to create quiz");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold">Create Quiz</h2>
            <input
                type="text"
                placeholder="Quiz Title"
                className="w-full border p-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            {questions.map((q, i) => (
                <div key={i} className="border p-4 bg-gray-50 space-y-2">
                    <input
                        type="text"
                        placeholder={`Question ${i + 1}`}
                        className="w-full border p-2"
                        value={q.question}
                        onChange={(e) => {
                            const copy = [...questions];
                            copy[i].question = e.target.value;
                            setQuestions(copy);
                        }}
                    />
                    {q.options.map((opt, j) => (
                        <input
                            key={j}
                            type="text"
                            placeholder={`Option ${j + 1}`}
                            className="w-full border p-2"
                            value={opt}
                            onChange={(e) => {
                                const copy = [...questions];
                                copy[i].options[j] = e.target.value;
                                setQuestions(copy);
                            }}
                        />
                    ))}
                    <select
                        value={q.answer}
                        onChange={(e) => {
                            const copy = [...questions];
                            copy[i].answer = Number(e.target.value);
                            setQuestions(copy);
                        }}
                        className="w-full border p-2"
                    >
                        {[0, 1, 2, 3].map((n) => (
                            <option key={n} value={n}>
                                Correct: Option {n + 1}
                            </option>
                        ))}
                    </select>
                </div>
            ))}
            <button type="button" className="bg-yellow-400 p-2 rounded" onClick={handleAddQuestion}>
                + Add Question
            </button>
            <button type="submit" className="bg-green-500 p-2 text-white rounded">
                Create Quiz
            </button>
        </form>
    );
}

export default CreateQuiz;
