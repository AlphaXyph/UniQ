import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "../../../api";
import Papa from "papaparse";
import Popup from "../../components/popup";

function EditQuiz() {
    const { quizId } = useParams();
    const [title, setTitle] = useState("");
    const [questions, setQuestions] = useState([]);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const token = localStorage.getItem("token");
                console.log("Fetching quiz with ID:", quizId, "token:", token); // Debug
                const res = await API.get(`/quiz/${quizId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("Fetched quiz data:", res.data); // Debug
                setTitle(res.data.title);
                setQuestions(res.data.questions);
            } catch (err) {
                console.error("Fetch quiz error:", err.response?.data || err.message); // Debug
                setPopup({ message: err.response?.data?.msg || "Error loading quiz", type: "error" });
            }
        };
        fetchQuiz();
    }, [quizId]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    console.log("Parsed CSV data:", results.data); // Debug
                    const formatted = results.data
                        .filter((row) => row.question && row.question.trim() !== "")
                        .map((row) => {
                            const correctIndex = parseInt(row.correct, 10);
                            const validCorrectIndex = isNaN(correctIndex) || correctIndex < 1 || correctIndex > 4 ? 0 : correctIndex - 1;
                            return {
                                question: row.question || "",
                                options: [row.optionA || "", row.optionB || "", row.optionC || "", row.optionD || ""],
                                answer: validCorrectIndex,
                            };
                        });
                    setQuestions(formatted);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                },
            });
        }
    };

    const handleAddQuestion = () => {
        setQuestions((prev) => [...prev, { question: "", options: ["", "", "", ""], answer: 0 }]);
    };

    const handleRemoveQuestion = (index) => {
        setQuestions((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (title.trim() === "") {
            setPopup({ message: "Title cannot be empty", type: "error" });
            return;
        }
        const validQuestions = questions.filter(
            (q) => q.question.trim() !== "" && q.options.some((opt) => opt.trim() !== "")
        );
        if (validQuestions.length === 0) {
            setPopup({ message: "At least one question with non-empty options is required", type: "error" });
            return;
        }
        if (validQuestions.length < questions.length) {
            setPopup({ message: "Blank questions or questions with empty options have been removed", type: "error" });
        }
        try {
            const token = localStorage.getItem("token");
            console.log("Updating quiz:", { quizId, title, questions: validQuestions, token }); // Debug
            const response = await API.post(
                `/quiz/update/${quizId}`,
                { title, questions: validQuestions },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Update response:", response.data); // Debug
            setPopup({ message: "Quiz Updated!", type: "success" });
            setTitle("");
            setQuestions([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (err) {
            console.error("Update quiz error:", err.response?.data || err.message); // Debug
            setPopup({ message: err.response?.data?.msg || "Failed to update quiz", type: "error" });
        }
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
    };

    const downloadExampleCsv = () => {
        const csvContent = `question,optionA,optionB,optionC,optionD,correct
"What is 2+2?","2","3","4","5",3
"Capital of France?","Paris","London","Berlin","Madrid",1
"What is the largest planet?","Mars","Jupiter","Earth","Venus",2`;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "example.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="relative">
            <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold">Edit Quiz</h2>
                <input
                    type="text"
                    placeholder="Quiz Title"
                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <div className="flex items-center gap-2">
                    <label className="bg-blue-500 text-white p-2 rounded cursor-pointer hover:bg-blue-600">
                        Upload CSV to Override Questions
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="hidden"
                            ref={fileInputRef}
                        />
                    </label>
                    <button
                        type="button"
                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                        onClick={downloadExampleCsv}
                    >
                        ⮯ Example CSV
                    </button>
                </div>
                {questions.length > 0 ? (
                    questions.map((q, i) => (
                        <div key={i} className="border p-6 bg-gray-50 space-y-2 rounded relative">
                            <button
                                type="button"
                                className="absolute top-1 right-1 text-red-500 hover:text-red-700 text-xl z-10"
                                onClick={() => handleRemoveQuestion(i)}
                                aria-label={`Remove question ${i + 1}`}
                            >
                                ✕
                            </button>
                            <input
                                type="text"
                                placeholder={`Question ${i + 1}`}
                                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {[0, 1, 2, 3].map((n) => (
                                    <option key={n} value={n}>
                                        Correct: Option {n + 1}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500">No questions added. Upload a CSV or click "+ Add Question".</p>
                )}
                <div className="flex gap-2">
                    <button type="button" className="bg-yellow-400 p-2 rounded hover:bg-yellow-500" onClick={handleAddQuestion}>
                        + Add Question
                    </button>
                    <button type="submit" className="bg-green-500 p-2 text-white rounded hover:bg-green-600">
                        Update Quiz
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditQuiz;