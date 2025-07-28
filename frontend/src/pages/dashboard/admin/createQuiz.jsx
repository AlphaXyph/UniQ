import React, { useState, useRef, useEffect } from "react";
import API from "../../../../api";
import Papa from "papaparse";
import Popup from "../../../components/popup";
import AIChatbot from "../../../components/aiChatbot";

function CreateQuiz() {
    const [title, setTitle] = useState("");
    const [questions, setQuestions] = useState([]);
    const [timer, setTimer] = useState(5);
    const [subject, setSubject] = useState("");
    const [subjects, setSubjects] = useState(JSON.parse(localStorage.getItem("subjects")) || []);
    const [newSubjectName, setNewSubjectName] = useState("");
    const [showNewSubjectInput, setShowNewSubjectInput] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [academicYear, setAcademicYear] = useState("");
    const [academicYears, setAcademicYears] = useState(JSON.parse(localStorage.getItem("academicYears")) || []);
    const [newAcademicYearStart, setNewAcademicYearStart] = useState("");
    const [newAcademicYearEnd, setNewAcademicYearEnd] = useState("");
    const [showNewAcademicYearInput, setShowNewAcademicYearInput] = useState(false);
    const [isAcademicYearDropdownOpen, setIsAcademicYearDropdownOpen] = useState(false);
    const [year, setYear] = useState("");
    const [branch, setBranch] = useState("");
    const [division, setDivision] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [popup, setPopup] = useState({ message: "", type: "success", confirmAction: null, confirmInput: "" });
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [showSpeechBubble, setShowSpeechBubble] = useState(true);
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(true);
    const fileInputRef = useRef(null);
    const imageInputRefs = useRef({});
    const user = JSON.parse(localStorage.getItem("user"));

    const fullText = "Hello! Would you like my help in creating a quiz?";

    useEffect(() => {
        if (isChatbotOpen || !showSpeechBubble) {
            setShowSpeechBubble(false);
            setDisplayedText("");
            setIsTyping(true);
            return;
        }

        let timer;
        let currentIndex = displayedText.length;

        if (isTyping) {
            if (currentIndex < fullText.length) {
                timer = setInterval(() => {
                    setDisplayedText(fullText.slice(0, currentIndex + 1));
                    currentIndex++;
                    if (currentIndex >= fullText.length) {
                        clearInterval(timer);
                        setTimeout(() => setIsTyping(false), 1000);
                    }
                }, 50);
            } else {
                setTimeout(() => setIsTyping(false), 1000);
            }
        } else {
            if (currentIndex > 0) {
                timer = setInterval(() => {
                    setDisplayedText(fullText.slice(0, currentIndex - 1));
                    currentIndex--;
                    if (currentIndex <= 0) {
                        clearInterval(timer);
                        setShowSpeechBubble(false);
                        setIsTyping(true);
                    }
                }, 30);
            } else {
                setShowSpeechBubble(false);
                setIsTyping(true);
            }
        }

        return () => clearInterval(timer);
    }, [isChatbotOpen, showSpeechBubble, isTyping, displayedText, fullText]);

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
                                questionImage: row.questionImage || null,
                                options: [
                                    { text: row.optionA || `Option 1`, image: row.optionAImage || null },
                                    { text: row.optionB || `Option 2`, image: row.optionBImage || null },
                                    { text: row.optionC || `Option 3`, image: row.optionCImage || null },
                                    { text: row.optionD || `Option 4`, image: row.optionDImage || null },
                                ],
                                answer: validCorrectIndex,
                            };
                        });
                    if (questions.length > 0) {
                        setPopup({
                            message: "Do you want to append(A) these questions to the existing ones or replace(R) them? Type 'A' or 'R'.",
                            type: "success",
                            confirmAction: (input) => {
                                if (input === "A") {
                                    setQuestions((prev) => [...prev, ...formatted]);
                                    setPopup({ message: "Questions appended!", type: "success", confirmAction: null, confirmInput: "" });
                                } else if (input === "R") {
                                    setQuestions(formatted);
                                    setPopup({ message: "Questions replaced!", type: "success", confirmAction: null, confirmInput: "" });
                                } else {
                                    setPopup({ message: "Please type 'A' or 'R' in capital letter.", type: "error", confirmAction: null, confirmInput: "" });
                                }
                            },
                            confirmInput: "",
                        });
                    } else {
                        setQuestions(formatted);
                        setPopup({ message: "Questions uploaded!", type: "success", confirmAction: null, confirmInput: "" });
                    }
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

    const addAcademicYear = () => {
        if (newAcademicYearStart && newAcademicYearEnd) {
            if (!/^\d{4}$/.test(newAcademicYearStart) || !/^\d{4}$/.test(newAcademicYearEnd)) {
                setPopup({ message: "Academic year must be in format YYYY-YYYY (e.g., 2025-2026)", type: "error", confirmAction: null, confirmInput: "" });
                return;
            }
            const newAcademicYear = `${newAcademicYearStart}-${newAcademicYearEnd}`;
            if (!academicYears.includes(newAcademicYear)) {
                const updatedAcademicYears = [...academicYears, newAcademicYear];
                setAcademicYears(updatedAcademicYears);
                localStorage.setItem("academicYears", JSON.stringify(updatedAcademicYears));
                setAcademicYear(newAcademicYear);
                setNewAcademicYearStart("");
                setNewAcademicYearEnd("");
                setShowNewAcademicYearInput(false);
            }
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

    const handleDeleteAcademicYear = (yearToDelete) => {
        setIsAcademicYearDropdownOpen(false);
        setPopup({
            message: `Are you sure you want to remove "${yearToDelete}"? Type YES to confirm.`,
            type: "warning",
            confirmAction: (input) => {
                if (input !== "YES") {
                    setPopup({ message: "Please type YES in capital letters", type: "error", confirmAction: null, confirmInput: "" });
                    return;
                }
                const updatedAcademicYears = academicYears.filter((y) => y !== yearToDelete);
                setAcademicYears(updatedAcademicYears);
                localStorage.setItem("academicYears", JSON.stringify(updatedAcademicYears));
                if (academicYear === yearToDelete) setAcademicYear("");
                setPopup({ message: "Academic year deleted", type: "success", confirmAction: null, confirmInput: "" });
            },
            confirmInput: "",
        });
    };

    const handleAddQuestion = () => {
        setQuestions((prev) => [...prev, {
            question: "",
            questionImage: null,
            options: [
                { text: "", image: null },
                { text: "", image: null },
                { text: "", image: null },
                { text: "", image: null },
            ],
            answer: 0
        }]);
    };

    const handleRemoveQuestion = (index) => {
        setQuestions((prev) => prev.filter((_, i) => i !== index));
    };

    const handleImageUpload = async (e, questionIndex, optionIndex = null) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        try {
            const token = localStorage.getItem("token");
            const response = await API.post("/quiz/upload-image", formData, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
            });
            const imageUrl = response.data.imageUrl;

            setQuestions((prev) => {
                const copy = [...prev];
                if (optionIndex === null) {
                    copy[questionIndex].questionImage = imageUrl;
                } else {
                    copy[questionIndex].options[optionIndex].image = imageUrl;
                }
                return copy;
            });

            const inputKey = optionIndex === null ? `question-${questionIndex}` : `option-${questionIndex}-${optionIndex}`;
            if (imageInputRefs.current[inputKey]) {
                imageInputRefs.current[inputKey].value = "";
            }
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Failed to upload image", type: "error", confirmAction: null, confirmInput: "" });
        }
    };

    const handleRemoveImage = (questionIndex, optionIndex = null) => {
        setQuestions((prev) => {
            const copy = [...prev];
            if (optionIndex === null) {
                copy[questionIndex].questionImage = null;
            } else {
                copy[questionIndex].options[optionIndex].image = null;
            }
            return copy;
        });

        const inputKey = optionIndex === null ? `question-${questionIndex}` : `option-${questionIndex}-${optionIndex}`;
        if (imageInputRefs.current[inputKey]) {
            imageInputRefs.current[inputKey].value = "";
        }
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
        if (timer < 1 || timer > 720) {
            setPopup({ message: "Timer must be between 1 and 720 minutes", type: "error", confirmAction: null, confirmInput: "" });
            return;
        }
        if (academicYear.trim() === "") {
            setPopup({ message: "Academic Year is required", type: "error", confirmAction: null, confirmInput: "" });
            return;
        }

        for (let i = 0; i < questions.length; i++) {
            if (questions[i].question.trim() === "" && !questions[i].questionImage) {
                setPopup({
                    message: `Question no. ${i + 1} cannot have empty question.`,
                    type: "error",
                    confirmAction: null,
                    confirmInput: ""
                });
                return;
            }
        }

        const updatedQuestions = questions.map((q) => ({
            ...q,
            options: q.options.map((opt, j) => ({
                ...opt,
                text: opt.text.trim() === "" ? `Option ${j + 1}` : opt.text
            }))
        }));

        const validQuestions = updatedQuestions.filter(
            (q) => q.question.trim() !== "" || q.questionImage !== null || q.options.some((opt) => opt.text.trim() !== "" || opt.image !== null)
        );

        if (validQuestions.length === 0) {
            setPopup({ message: "At least one question with non-empty content is required", type: "error", confirmAction: null, confirmInput: "" });
            return;
        }
        if (validQuestions.length < updatedQuestions.length) {
            setPopup({ message: "Blank questions or questions with empty content have been removed", type: "error", confirmAction: null, confirmInput: "" });
            setQuestions(validQuestions);
        }

        try {
            const token = localStorage.getItem("token");
            await API.post(
                "/quiz/create",
                { subject, title, questions: validQuestions, timer, isVisible: false, academicYear, year, branch, division },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPopup({ message: "Quiz Created! It is hidden by default. Go to Home to make it visible.", type: "success", confirmAction: null, confirmInput: "" });
            setSubject("");
            setTitle("");
            setQuestions([]);
            setTimer(5);
            setAcademicYear("");
            setYear("");
            setBranch("");
            setDivision("");
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
            questionImage: q.questionImage || null,
            options: [
                { text: q.optionA || "Option 1", image: q.optionAImage || null },
                { text: q.optionB || "Option 2", image: q.optionBImage || null },
                { text: q.optionC || "Option 3", image: q.optionCImage || null },
                { text: q.optionD || "Option 4", image: q.optionDImage || null },
            ],
            answer: parseInt(q.correct, 10) - 1,
        }));
        setQuestions((prev) => [...prev, ...formattedQuestions]);
        setSubject(generatedQuestions[0]?.subject || subject);
        setAcademicYear(generatedQuestions[0]?.academicYear || academicYear);
        setYear(generatedQuestions[0]?.year || year);
        setBranch(generatedQuestions[0]?.branch || branch);
        setDivision(generatedQuestions[0]?.division || division);
        setIsChatbotOpen(false);
        setPopup({ message: "Questions imported to form!", type: "success", confirmAction: null, confirmInput: "" });
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success", confirmAction: null, confirmInput: "" });
    };

    const sampleCsvContent = `question,questionImage,optionA,optionAImage,optionB,optionBImage,optionC,optionCImage,optionD,optionDImage,correct
"What is the capital of France?","","Paris","","London","","Berlin","","Madrid","",1
"What is 2 + 2?","","3","","4","","5","","6","",2`;

    const handleDownloadSample = () => {
        const blob = new Blob([sampleCsvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Sample.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const adjustTextareaRows = (textarea, index, optionIndex = null) => {
        const lines = textarea.value.split('\n').length;
        const minRows = 1;
        const maxRows = 50;
        const newRows = Math.max(minRows, Math.min(maxRows, lines));
        textarea.rows = newRows;

        const copy = [...questions];
        if (optionIndex !== null) {
            copy[index].options[optionIndex].text = textarea.value || "";
        } else {
            copy[index].question = textarea.value;
        }
        setQuestions(copy);
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
                        <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Academic Year</label>
                        <div className="flex flex-row items-center gap-1 flex-nowrap">
                            <div className="relative flex-grow">
                                <div
                                    className="w-full border border-gray-300 p-2 rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs sm:text-sm truncate"
                                    onClick={() => setIsAcademicYearDropdownOpen(!isAcademicYearDropdownOpen)}
                                >
                                    {academicYear || "Select Academic Year"}
                                </div>
                                {isAcademicYearDropdownOpen && (
                                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-auto shadow-md">
                                        {academicYears.length > 0 ? (
                                            academicYears.map((y, index) => (
                                                <li
                                                    key={index}
                                                    className="flex items-center justify-between p-2 hover:bg-gray-100 text-xs sm:text-sm truncate"
                                                >
                                                    <span onClick={() => { setAcademicYear(y); setIsAcademicYearDropdownOpen(false); }}>{y}</span>
                                                    {user.role === "admin" && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteAcademicYear(y); }}
                                                            className="text-red-500 hover:text-red-700 text-xs p-1 rounded-full hover:bg-gray-100 transition"
                                                            aria-label={`Remove ${y}`}
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    )}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="p-2 text-gray-500 text-xs sm:text-sm">No academic years available</li>
                                        )}
                                    </ul>
                                )}
                            </div>
                            {user.role === "admin" && (
                                <button
                                    type="button"
                                    onClick={() => setShowNewAcademicYearInput(true)}
                                    className="px-2 py-1.5 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 text-xs"
                                >
                                    <i className="fas fa-plus"></i>
                                </button>
                            )}
                        </div>
                        {showNewAcademicYearInput && user.role === "admin" && (
                            <div className="flex flex-row items-center gap-1 flex-nowrap mt-2">
                                <input
                                    type="text"
                                    value={newAcademicYearStart}
                                    onChange={(e) => setNewAcademicYearStart(e.target.value)}
                                    placeholder="YYYY"
                                    maxLength={4}
                                    className="w-20 border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
                                />
                                <span className="text-gray-700">-</span>
                                <input
                                    type="text"
                                    value={newAcademicYearEnd}
                                    onChange={(e) => setNewAcademicYearEnd(e.target.value)}
                                    placeholder="YYYY"
                                    maxLength={4}
                                    className="w-20 border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
                                />
                                <button
                                    type="button"
                                    onClick={addAcademicYear}
                                    className="px-2 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs"
                                    disabled={!newAcademicYearStart || !newAcademicYearEnd}
                                >
                                    Add
                                </button>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Subject</label>
                        <div className="flex flex-row items-center gap-1 flex-nowrap">
                            <div className="relative flex-grow">
                                <div
                                    className="w-full border border-gray-300 p-2 rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs sm:text-sm truncate"
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
                                                            className="text-red-500 hover:text-red-700 text-xs p-1 rounded-full hover:bg-gray-100 transition"
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
                                    className="px-2 py-1.5 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 text-xs"
                                >
                                    <i className="fas fa-plus"></i>
                                </button>
                            )}
                        </div>
                        {showNewSubjectInput && user.role === "admin" && (
                            <div className="flex flex-row items-center gap-1 flex-nowrap mt-2">
                                <input
                                    type="text"
                                    value={newSubjectName}
                                    onChange={(e) => setNewSubjectName(e.target.value.slice(0, 20))}
                                    placeholder="New Subject Name"
                                    className="flex-grow border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
                                    maxLength={20}
                                />
                                <button
                                    type="button"
                                    onClick={addSubject}
                                    className="px-2 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs"
                                    disabled={!newSubjectName}
                                >
                                    Add
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                        <div className="sm:col-span-2">
                            <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Quiz Title</label>
                            <input
                                type="text"
                                placeholder="Quiz Title"
                                className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs sm:text-sm"
                                value={title}
                                onChange={(e) => setTitle(e.target.value.slice(0, 40))}
                                maxLength={40}
                            />
                        </div>
                        <div className="sm:col-span-1">
                            <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Quiz Timer (minutes)</label>
                            <input
                                type="number"
                                className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs sm:text-sm"
                                value={timer}
                                onChange={(e) => setTimer(Number(e.target.value))}
                                min={1}
                                max={720}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <label className="block font-semibold text-xs sm:text-sm text-gray-700">Additional Filters</label>
                            <button
                                type="button"
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className=" text-green-500 hover:text-green-600 text-base p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 transition"
                                aria-label="Toggle filters"
                            >
                                <i className="fas fa-filter"></i>
                            </button>
                        </div>
                        {isFilterOpen && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border rounded-2xl bg-gray-100 sm:gap-4 mb-4 p-2 sm:p-4 md:p-6">
                                <div>
                                    <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Year</label>
                                    <select
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs sm:text-sm"
                                    >
                                        <option value="">Select Year</option>
                                        {["FY", "SY", "TY", "4TH"].map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Branch</label>
                                    <input
                                        type="text"
                                        value={branch}
                                        onChange={(e) => setBranch(e.target.value.slice(0, 4))}
                                        placeholder="Branch"
                                        maxLength={4}
                                        className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Division</label>
                                    <select
                                        value={division}
                                        onChange={(e) => setDivision(e.target.value)}
                                        className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs sm:text-sm"
                                    >
                                        <option value="">Select Division</option>
                                        {["A", "B", "C", "D"].map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Upload Questions (CSV)</label>
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                            <label className="inline-block w-auto px-3 py-2 bg-cyan-500 text-white rounded-md cursor-pointer hover:bg-cyan-600 text-xs sm:text-sm text-center">
                                <i className="fa-solid fa-arrow-up-from-bracket mr-1"></i> Upload CSV
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
                                className="inline-block w-auto px-3 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 text-xs sm:text-sm text-center"
                                onClick={handleDownloadSample}
                            >
                                <i className="fa-solid fa-download mr-1"></i> Sample.csv
                            </button>
                            <button
                                type="button"
                                className="inline-block w-auto px-3 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 text-xs sm:text-sm text-center"
                                onClick={() => setIsChatbotOpen(true)}
                            >
                                <i className="fas fa-robot mr-1"></i> Create with AI
                            </button>
                        </div>
                    </div>
                    {questions.length > 0 ? (
                        questions.map((q, i) => (
                            <div key={i} className="border border-gray-200 p-4 bg-gray-50 rounded-lg shadow-sm space-y-4 relative mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-sm sm:text-base text-green-600">Question {i + 1}</h3>
                                    <button
                                        type="button"
                                        className="text-red-500 hover:text-red-700 text-base p-1.5 rounded-full hover:bg-gray-100 transition"
                                        onClick={() => handleRemoveQuestion(i)}
                                        aria-label={`Remove question ${i + 1}`}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <label className="block font-semibold text-xs sm:text-sm text-gray-700">Question:</label>
                                    <textarea
                                        placeholder={`Question ${i + 1}`}
                                        className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm resize-none"
                                        value={q.question}
                                        onChange={(e) => adjustTextareaRows(e.target, i)}
                                        rows={1}
                                    />
                                    {q.questionImage && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <img src={q.questionImage} alt="Question" className="w-24 h-24 object-contain rounded" />
                                            <button
                                                type="button"
                                                className="text-red-500 hover:text-red-700 text-sm p-1 rounded-full hover:bg-gray-100 transition"
                                                onClick={() => handleRemoveImage(i)}
                                                aria-label="Remove question image"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    )}
                                    <label className="inline-block px-2 py-1 bg-cyan-500 text-white rounded-md cursor-pointer hover:bg-cyan-600 text-xs text-center">
                                        <i className="fas fa-image mr-1"></i> Add Image
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, i)}
                                            className="hidden"
                                            ref={(el) => (imageInputRefs.current[`question-${i}`] = el)}
                                        />
                                    </label>
                                </div>
                                <div className="space-y-2">
                                    <label className="block font-semibold text-xs sm:text-sm text-gray-700">Options:</label>
                                    {q.options.map((opt, j) => (
                                        <div key={j} className="flex items-start gap-2">
                                            <span className="text-sm text-gray-600 w-8 pt-2">{j + 1}.</span>
                                            <div className="flex-1 space-y-2">
                                                {opt.image && (
                                                    <div className="flex items-center gap-2">
                                                        <img src={opt.image} alt={`Option ${j + 1}`} className="w-16 h-16 object-contain rounded" />
                                                        <button
                                                            type="button"
                                                            className="text-red-500 hover:text-red-700 text-sm p-1 rounded-full hover:bg-gray-100 transition"
                                                            onClick={() => handleRemoveImage(i, j)}
                                                            aria-label={`Remove option ${j + 1} image`}
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="flex items-start gap-2">
                                                    <textarea
                                                        placeholder={`Option ${j + 1}`}
                                                        className="flex-1 border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm resize-none"
                                                        value={opt.text}
                                                        onChange={(e) => adjustTextareaRows(e.target, i, j)}
                                                        rows={1}
                                                    />
                                                    <label className="inline-block px-2 py-1 bg-cyan-500 text-white rounded-md cursor-pointer hover:bg-cyan-600 text-xs text-center self-start">
                                                        <i className="fas fa-image mr-1"></i> Add Image
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleImageUpload(e, i, j)}
                                                            className="hidden"
                                                            ref={(el) => (imageInputRefs.current[`option-${i}-${j}`] = el)}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <label className="block font-semibold text-xs sm:text-sm text-gray-700">Answer:</label>
                                    <select
                                        value={q.answer}
                                        onChange={(e) => {
                                            const copy = [...questions];
                                            copy[i].answer = Number(e.target.value);
                                            setQuestions(copy);
                                        }}
                                        className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
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
                        <p className="text-gray-500 text-xs sm:text-sm">No questions added. Upload a CSV, click "+ Add Question", or use "Create with AI".</p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <button
                            type="button"
                            className="w-auto px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-xs sm:text-sm"
                            onClick={handleAddQuestion}
                        >
                            <i className="fas fa-plus mr-1"></i> Add Question
                        </button>
                        <button
                            type="submit"
                            className="w-auto px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs sm:text-sm"
                        >
                            Create Quiz
                        </button>
                    </div>
                </form>
                <div className="fixed bottom-4 right-4 z-50">
                    <div className="relative">
                        {showSpeechBubble && !isChatbotOpen && (
                            <div className="absolute right-14 bottom-0 bg-blue-500 text-white text-sm sm:text-base md:text-md rounded-lg px-3 py-2 shadow-md w-44 sm:w-56 md:w-80">
                                <span className="block">{displayedText}</span>
                                <div className="absolute top-1/2 right-[-6px] w-3 h-3 bg-blue-500 transform rotate-45 -translate-y-1/2"></div>
                            </div>
                        )}
                        <button
                            onClick={() => setIsChatbotOpen(!isChatbotOpen)}
                            className="bg-blue-500 text-white p-2 sm:p-3 rounded-full shadow-md hover:bg-blue-600 text-base"
                            title="AI Quiz Generator"
                        >
                            <i className="fas fa-robot"></i>
                        </button>
                    </div>
                </div>
                {isChatbotOpen && <AIChatbot onClose={() => setIsChatbotOpen(false)} importQuestions={importGeneratedQuestions} />}
            </div>
        </div>
    );
}

export default CreateQuiz;