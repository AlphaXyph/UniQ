import React, { useState, useRef } from "react";
import API from "../../../api";
import Papa from "papaparse";
import Popup from "../../components/Popup";
import AIChatbot from "../../components/AiChatbot";

function CreateQuiz() {
    const [title, setTitle] = useState("");
    const [questions, setQuestions] = useState([]);
    const [timer, setTimer] = useState(5);
    const [subject, setSubject] = useState("");
    const [subjects, setSubjects] = useState(JSON.parse(localStorage.getItem("subjects")) || ["TESTING", "UXDD", "BDAV"]);
    const [newSubjectName, setNewSubjectName] = useState("");
    const [showNewSubjectInput, setShowNewSubjectInput] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [popup, setPopup] = useState({ message: "", type: "success", confirmAction: null, confirmInput: "" });
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const fileInputRef = useRef(null);
    const user = JSON.parse(localStorage.getItem("user"));

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    console.log("Parsed CSV data:", results.data);
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
                    setQuestions((prev) => {
                        console.log("Appending questions:", { prevLength: prev.length, newQuestions: formatted.length, total: prev.length + formatted.length });
                        return [...prev, ...formatted];
                    });
                    if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                },
            });
        }
    };

    const addSubject = () => {
        if (newSubjectName && !subjects.includes(newSubjectName)) {
            const updatedSubjects = [...subjects, newSubjectName];
            setSubjects(updatedSubjects);
            localStorage.setItem("subjects", JSON.stringify(updatedSubjects));
            setSubject(newSubjectName);
            setNewSubjectName("");
            setShowNewSubjectInput(false);
        }
    };

    const handleDeleteSubject = (subjectToDelete) => {
        setIsDropdownOpen(false);
        setPopup({
            message: `Are you sure you want to remove "${subjectToDelete}"? Type YES to confirm.`,
            type: "error",
            confirmAction: (input) => {
                if (input === "YES") {
                    const updatedSubjects = subjects.filter((s) => s !== subjectToDelete);
                    setSubjects(updatedSubjects);
                    localStorage.setItem("subjects", JSON.stringify(updatedSubjects));
                    if (subject === subjectToDelete) setSubject("");
                    setPopup({ message: "Subject deleted", type: "success", confirmAction: null, confirmInput: "" });
                } else {
                    setPopup({ message: "Deletion cancelled. Please type YES to confirm.", type: "error", confirmAction: popup.confirmAction, confirmInput: "" });
                }
            },
            confirmInput: "",
        });
    };

    const handleAddQuestion = () => {
        setQuestions((prev) => [...prev, { question: "", options: ["", "", "", ""], answer: 0 }]);
    };

    const handleRemoveQuestion = (index) => {
        setQuestions((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (subject.trim() === "") {
            setPopup({ message: "Subject is required", type: "error" });
            return;
        }
        if (title.trim() === "") {
            setPopup({ message: "Title cannot be empty", type: "error" });
            return;
        }
        if (timer < 1) {
            setPopup({ message: "Timer must be at least 1 minute", type: "error" });
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
            await API.post(
                "/quiz/create",
                { subject, title, questions: validQuestions, timer, isVisible: false },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPopup({ message: "Quiz Created! It is hidden by default. Go to Home to make it visible.", type: "success" });
            setSubject("");
            setTitle("");
            setQuestions([]);
            setTimer(5);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Failed to create quiz", type: "error" });
        }
    };

    const importGeneratedQuestions = (generatedQuestions) => {
        const formattedQuestions = generatedQuestions.map((q) => ({
            question: q.question,
            options: [q.optionA, q.optionB, q.optionC, q.optionD],
            answer: parseInt(q.correct, 10) - 1,
        }));
        setQuestions((prev) => [...prev, ...formattedQuestions]);
        setSubject(generatedQuestions[0]?.subject || subject);
        setIsChatbotOpen(false);
        setPopup({ message: "Questions imported to form!", type: "success" });
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success", confirmAction: null, confirmInput: "" });
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
            <Popup
                message={popup.message}
                type={popup.type}
                onClose={closePopup}
                confirmAction={popup.confirmAction}
                confirmInput={popup.confirmInput}
                setConfirmInput={(value) => setPopup({ ...popup, confirmInput: value })}
            />
            <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold">Create Quiz</h2>
                <div>
                    <label className="block mb-1 font-semibold">Subject</label>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <div
                                className="w-full border p-2 rounded bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                {subject || "Select Subject"}
                            </div>
                            {isDropdownOpen && (
                                <ul className="absolute z-10 w-full bg-white border rounded mt-1 max-h-40 overflow-auto shadow-lg">
                                    {subjects.length > 0 ? (
                                        subjects.map((s, index) => (
                                            <li
                                                key={index}
                                                className="flex items-center justify-between p-2 hover:bg-gray-100"
                                                onClick={() => {
                                                    setSubject(s);
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                <span>{s}</span>
                                                {user.role === "admin" && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteSubject(s);
                                                        }}
                                                        className="text-red-500 hover:text-red-700"
                                                        aria-label={`Remove ${s}`}
                                                    >
                                                        ─
                                                    </button>
                                                )}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="p-2 text-gray-500">No subjects available</li>
                                    )}
                                </ul>
                            )}
                        </div>
                        {user.role === "admin" && (
                            <button
                                type="button"
                                onClick={() => setShowNewSubjectInput(true)}
                                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                ✚
                            </button>
                        )}
                    </div>
                    {showNewSubjectInput && user.role === "admin" && (
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="text"
                                value={newSubjectName}
                                onChange={(e) => setNewSubjectName(e.target.value)}
                                placeholder="New Subject Name"
                                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={addSubject}
                                className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
                                disabled={!newSubjectName}
                            >
                                Add
                            </button>
                        </div>
                    )}
                </div>
                <input
                    type="text"
                    placeholder="Quiz Title"
                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <label className="block mb-2 font-semibold">Quiz Timer (minutes)</label>
                <input
                    type="number"
                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={timer}
                    onChange={(e) => setTimer(Number(e.target.value))}
                    min={1}
                />
                <div className="flex items-center gap-2">
                    <label className="bg-blue-500 text-white p-2 rounded cursor-pointer hover:bg-blue-600">
                        Upload CSV
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
                        Create Quiz
                    </button>
                </div>
            </form>
            <button
                onClick={() => setIsChatbotOpen(!isChatbotOpen)}
                className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 z-50"
                title="AI Quiz Generator"
            >
                🤖
            </button>
            {isChatbotOpen && <AIChatbot onClose={() => setIsChatbotOpen(false)} importQuestions={importGeneratedQuestions} />}
        </div>
    );
}

export default CreateQuiz;