import React, { useState, useRef } from "react";
import API from "../../../api";
import Papa from "papaparse";
import Popup from "../../components/Popup";
import AIChatbot from "../../components/AIChatbot";

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
                    setQuestions((prev) => [...prev, ...formatted]);
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
            type: "warning",
            confirmAction: (input) => {
                if (input !== "YES") {
                    setPopup({ message: "Please type YES in capital letters", type: "error", confirmAction: null, confirmInput: "" });
                    return;
                }
                const updatedSubjects = subjects.filter((s) => s !== subjectToDelete);
                setSubjects(updatedSubjects);
                localStorage.setItem("subjects", JSON.stringify(updatedSubjects));
                if (subject === subjectToDelete) setSubject("");
                setPopup({ message: "Subject deleted", type: "success", confirmAction: null, confirmInput: "" });
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
            setPopup({ message: "Subject is required", type: "error", confirmAction: null, confirmInput: "" });
            return;
        }
        if (title.trim() === "") {
            setPopup({ message: "Title cannot be empty", type: "error", confirmAction: null, confirmInput: "" });
            return;
        }
        if (timer < 1) {
            setPopup({ message: "Timer must be at least 1 minute", type: "error", confirmAction: null, confirmInput: "" });
            return;
        }
        const validQuestions = questions.filter(
            (q) => q.question.trim() !== "" && q.options.some((opt) => opt.trim() !== "")
        );
        if (validQuestions.length === 0) {
            setPopup({ message: "At least one question with non-empty options is required", type: "error", confirmAction: null, confirmInput: "" });
            return;
        }
        if (validQuestions.length < questions.length) {
            setPopup({ message: "Blank questions or questions with empty options have been removed", type: "error", confirmAction: null, confirmInput: "" });
        }
        try {
            const token = localStorage.getItem("token");
            await API.post(
                "/quiz/create",
                { subject, title, questions: validQuestions, timer, isVisible: false },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPopup({ message: "Quiz Created! It is hidden by default. Go to Home to make it visible.", type: "success", confirmAction: null, confirmInput: "" });
            setSubject("");
            setTitle("");
            setQuestions([]);
            setTimer(5);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Failed to create quiz", type: "error", confirmAction: null, confirmInput: "" });
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
        setPopup({ message: "Questions imported to form!", type: "success", confirmAction: null, confirmInput: "" });
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success", confirmAction: null, confirmInput: "" });
    };

    return (
        <div className="min-h-screen bg-gray-100 p-2 sm:p-4 md:p-5">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-2 sm:p-4 md:p-5">
                <Popup
                    message={popup.message}
                    type={popup.type}
                    onClose={closePopup}
                    confirmAction={popup.confirmAction}
                    confirmInput={popup.confirmInput}
                    setConfirmInput={(value) => setPopup({ ...popup, confirmInput: value })}
                />
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                        <i className="fas fa-plus text-base sm:text-lg"></i> Create Quiz
                    </h2>
                    <div>
                        <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Subject</label>
                        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                            <div className="relative w-full">
                                <div
                                    className="w-full border border-gray-300 p-2 rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    {subject || "Select Subject"}
                                </div>
                                {isDropdownOpen && (
                                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-auto shadow-md">
                                        {subjects.length > 0 ? (
                                            subjects.map((s, index) => (
                                                <li
                                                    key={index}
                                                    className="flex items-center justify-between p-2 hover:bg-gray-100 text-xs sm:text-sm truncate"
                                                >
                                                    <span onClick={() => { setSubject(s); setIsDropdownOpen(false); }}>{s}</span>
                                                    {user.role === "admin" && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteSubject(s); }}
                                                            className="text-red-500 hover:text-red-700 text-base p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition"
                                                            aria-label={`Remove ${s}`}
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    )}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="p-2 text-gray-500 text-xs sm:text-sm">No subjects available</li>
                                        )}
                                    </ul>
                                )}
                            </div>
                            {user.role === "admin" && (
                                <button
                                    type="button"
                                    onClick={() => setShowNewSubjectInput(true)}
                                    className="whitespace-nowrap px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs sm:text-sm"
                                >
                                    <i className="fas fa-plus mr-1"></i> Add Subject
                                </button>
                            )}
                        </div>
                        {showNewSubjectInput && user.role === "admin" && (
                            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mt-2">
                                <input
                                    type="text"
                                    value={newSubjectName}
                                    onChange={(e) => setNewSubjectName(e.target.value)}
                                    placeholder="New Subject Name"
                                    className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={addSubject}
                                    className="w-auto max-w-[100px] px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs sm:text-sm"
                                    disabled={!newSubjectName}
                                >
                                    Add
                                </button>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Quiz Title</label>
                        <input
                            type="text"
                            placeholder="Quiz Title"
                            className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Quiz Timer (minutes)</label>
                        <input
                            type="number"
                            className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            value={timer}
                            onChange={(e) => setTimer(Number(e.target.value))}
                            min={1}
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Upload Questions (CSV)</label>
                        <label className="inline-block w-auto px-3 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 text-xs sm:text-sm text-center">
                            Upload CSV
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="hidden"
                                ref={fileInputRef}
                            />
                        </label>
                    </div>
                    {questions.length > 0 ? (
                        questions.map((q, i) => (
                            <div key={i} className="border border-gray-300 p-2 sm:p-3 bg-white rounded-md shadow-md space-y-2 relative">
                                <button
                                    type="button"
                                    className="absolute top-2 sm:top-3 right-2 sm:right-3 text-red-500 hover:text-red-700 text-base p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition z-10"
                                    onClick={() => handleRemoveQuestion(i)}
                                    aria-label={`Remove question ${i + 1}`}
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                                <div className="flex flex-col gap-1 sm:gap-2">
                                    <label className="block font-semibold text-xs sm:text-sm text-gray-700">Question:</label>
                                    <input
                                        type="text"
                                        placeholder={`Question ${i + 1}`}
                                        className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                        value={q.question}
                                        onChange={(e) => {
                                            const copy = [...questions];
                                            copy[i].question = e.target.value;
                                            setQuestions(copy);
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col gap-1 sm:gap-2">
                                    <label className="block font-semibold text-xs sm:text-sm text-gray-700">Options:</label>
                                    {q.options.map((opt, j) => (
                                        <input
                                            key={j}
                                            type="text"
                                            placeholder={`Option ${j + 1}`}
                                            className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                            value={opt}
                                            onChange={(e) => {
                                                const copy = [...questions];
                                                copy[i].options[j] = e.target.value;
                                                setQuestions(copy);
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="flex flex-col gap-1 sm:gap-2">
                                    <label className="block font-semibold text-xs sm:text-sm text-gray-700">Answer:</label>
                                    <select
                                        value={q.answer}
                                        onChange={(e) => {
                                            const copy = [...questions];
                                            copy[i].answer = Number(e.target.value);
                                            setQuestions(copy);
                                        }}
                                        className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                    >
                                        {[0, 1, 2, 3].map((n) => (
                                            <option key={n} value={n}>
                                                Option {n + 1}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-xs sm:text-sm">No questions added. Upload a CSV or click "+ Add Question".</p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <button
                            type="button"
                            className="w-auto px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-xs sm:text-sm"
                            onClick={handleAddQuestion}
                        >
                            <i className="fas fa-plus"></i> Add Question
                        </button>
                        <button
                            type="submit"
                            className="w-auto px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs sm:text-sm"
                        >
                            Create Quiz
                        </button>
                    </div>
                </form>
                <button
                    onClick={() => setIsChatbotOpen(!isChatbotOpen)}
                    className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 sm:p-3 rounded-full shadow-md hover:bg-blue-600 z-50 text-base"
                    title="AI Quiz Generator"
                >
                    <i className="fas fa-robot"></i>
                </button>
                {isChatbotOpen && <AIChatbot onClose={() => setIsChatbotOpen(false)} importQuestions={importGeneratedQuestions} />}
            </div>
        </div>
    );
}

export default CreateQuiz;