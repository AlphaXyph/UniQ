import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Popup from "../../../components/popup";
import API from "../../../../api";

function Home() {
    const [quizzes, setQuizzes] = useState([]);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, quizId: null });
    const [confirmInput, setConfirmInput] = useState("");
    const [isVisibleQuizzesOpen, setIsVisibleQuizzesOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterAcademicYear, setFilterAcademicYear] = useState("");
    const [filterPostedBy, setFilterPostedBy] = useState("");
    const [filterSubjectTitle, setFilterSubjectTitle] = useState("");
    const [filterYear, setFilterYear] = useState("");
    const [filterBranch, setFilterBranch] = useState("");
    const [filterDivision, setFilterDivision] = useState("");
    const [filterFromDate, setFilterFromDate] = useState("");
    const [filterToDate, setFilterToDate] = useState("");
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const role = user?.role;
    const userEmail = user?.email;
    const navigate = useNavigate();

    const academicYears = useMemo(() => {
        const years = [...new Set(quizzes.map((q) => q.academicYear).filter((y) => y))];
        return years.sort();
    }, [quizzes]);

    const fetchQuizzes = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await API.get("/quiz/all", {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Fetched quizzes:", res.data);
            res.data.forEach((q) => {
                console.log("Quiz:", q._id, "Created by email:", q.createdBy?.email, "User email:", userEmail);
            });
            setQuizzes(res.data || []);
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Error loading quizzes", type: "error" });
        } finally {
            setIsLoading(false);
        }
    }, [userEmail]);

    useEffect(() => {
        fetchQuizzes();
    }, [fetchQuizzes]);

    const filteredQuizzes = useMemo(() => {
        return quizzes.filter((q) => {
            const matchesAcademicYear = filterAcademicYear ? q.academicYear === filterAcademicYear : true;
            const matchesPostedBy = filterPostedBy
                ? q.createdBy?.email?.toLowerCase().includes(filterPostedBy.toLowerCase())
                : true;
            const matchesSubjectTitle = filterSubjectTitle
                ? (() => {
                    const searchTerm = filterSubjectTitle.toLowerCase();
                    const combined = `${q.subject} ${q.title}`.toLowerCase();
                    if (combined.includes(searchTerm)) return true;
                    if (searchTerm.includes(" - ")) {
                        const [subjectPart, titlePart] = searchTerm.split(" - ").map((s) => s.trim());
                        return (
                            q.subject.toLowerCase().includes(subjectPart) &&
                            q.title.toLowerCase().includes(titlePart)
                        );
                    }
                    return false;
                })()
                : true;
            const matchesYear = filterYear ? q.year === filterYear : true;
            const matchesBranch = filterBranch ? q.branch === filterBranch : true;
            const matchesDivision = filterDivision ? q.division === filterDivision : true;
            const matchesDate =
                !filterFromDate ||
                !filterToDate ||
                (q.createdAt &&
                    new Date(q.createdAt).toLocaleDateString("en-US") >= new Date(filterFromDate).toLocaleDateString("en-US") &&
                    new Date(q.createdAt).toLocaleDateString("en-US") <= new Date(filterToDate).toLocaleDateString("en-US"));
            return matchesAcademicYear && matchesPostedBy && matchesSubjectTitle && matchesYear && matchesBranch && matchesDivision && matchesDate;
        });
    }, [quizzes, filterAcademicYear, filterPostedBy, filterSubjectTitle, filterYear, filterBranch, filterDivision, filterFromDate, filterToDate]);

    const groupedQuizzes = useMemo(() => {
        const grouped = filteredQuizzes
            .slice()
            .sort((a, b) => {
                const dateA = a.createdAt && !isNaN(new Date(a.createdAt).getTime()) ? new Date(a.createdAt) : new Date(0);
                const dateB = b.createdAt && !isNaN(new Date(b.createdAt).getTime()) ? new Date(b.createdAt) : new Date(0);
                return dateB - dateA;
            })
            .reduce((acc, quiz) => {
                const date = quiz.createdAt && !isNaN(new Date(quiz.createdAt).getTime())
                    ? new Date(quiz.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })
                    : "Date Not Available";
                if (!acc[date]) acc[date] = [];
                acc[date].push(quiz);
                return acc;
            }, {});

        const sortedDates = Object.keys(grouped).sort((a, b) => {
            if (a === "Date Not Available") return 1;
            if (b === "Date Not Available") return -1;
            return new Date(b) - new Date(a);
        });

        return { grouped, sortedDates };
    }, [filteredQuizzes]);

    const visibleQuizzes = useMemo(() => {
        return filteredQuizzes.filter((q) => q.isVisible);
    }, [filteredQuizzes]);

    const handleEdit = (quizId) => {
        navigate(`/dashboard/edit/${quizId}`);
    };

    const handleDelete = async (input) => {
        if (input !== "YES") {
            setPopup({ message: "Please type 'YES' to confirm deletion", type: "error" });
            return;
        }
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            await API.delete(`/quiz/${deleteConfirm.quizId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPopup({ message: "Quiz deleted", type: "success" });
            await fetchQuizzes();
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Error deleting quiz", type: "error" });
        } finally {
            setIsLoading(false);
        }
        setDeleteConfirm({ show: false, quizId: null });
        setConfirmInput("");
    };

    const handleToggleVisibility = async (quizId, isVisible) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            await API.post(
                `/quiz/toggle-visibility/${quizId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPopup({ message: `Quiz is now ${isVisible ? "hidden" : "visible"}`, type: "success" });
            await fetchQuizzes();
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Failed to toggle visibility", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
        setDeleteConfirm({ show: false, quizId: null });
        setConfirmInput("");
    };

    const toggleVisibleQuizzes = () => {
        setIsVisibleQuizzesOpen(!isVisibleQuizzesOpen);
    };

    const resetFilters = () => {
        setFilterAcademicYear("");
        setFilterPostedBy("");
        setFilterSubjectTitle("");
        setFilterYear("");
        setFilterBranch("");
        setFilterDivision("");
        setFilterFromDate("");
        setFilterToDate("");
    };

    return (
        <div className="min-h-screen bg-gray-100 p-2 sm:p-4 md:p-2xl">
            <Popup
                message={deleteConfirm.show ? "Are you sure you want to delete this quiz?" : popup.message}
                type={deleteConfirm.show ? "Confirm" : popup.type || "success"}
                onClick={deleteConfirm.show ? handleDelete : closePopup}
                confirmInput={deleteConfirm.show ? confirmInput : undefined}
                setConfirmInput={deleteConfirm.show ? setConfirmInput : undefined}
            />
            {isLoading ? (
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-2 sm:p-4 md:p-6 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                        <span className="mt-2 text-sm text-gray-600">Loading quizzes...</span>
                    </div>
                </div>
            ) : (
                <>
                    {role === "admin" && (
                        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-2 sm:p-4 md:p-6 mb-4">
                            <button
                                onClick={toggleVisibleQuizzes}
                                className="w-full text-left text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2 focus:outline-none"
                                disabled={isLoading}
                            >
                                <i className="fa-solid fa-list text-base sm:text-lg"></i>
                                Ongoing Quizzes
                                <i className={`fas fa-chevron-${isVisibleQuizzesOpen ? "up" : "down"} ml-auto`}></i>
                            </button>
                            {isVisibleQuizzesOpen && (
                                <div className="mt-2">
                                    {visibleQuizzes.length === 0 ? (
                                        <p className="text-xs sm:text-sm text-gray-500">No quizzes are currently visible.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {visibleQuizzes.map((q) => (
                                                <li
                                                    key={q._id}
                                                    className="p-2 sm:p-3 bg-white rounded-md border border-gray-300 shadow-sm hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                                        <div className="flex-1">
                                                            <strong className="text-sm sm:text-base font-bold text-gray-800 break-words">
                                                                {q.subject} - {q.title}
                                                            </strong>
                                                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 break-words">
                                                                Posted by: {q.createdBy?.email || "Unknown"}
                                                            </p>
                                                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                                                Created: {q.createdAt && !isNaN(new Date(q.createdAt).getTime())
                                                                    ? new Date(q.createdAt).toLocaleString("en-US", {
                                                                        year: "numeric",
                                                                        month: "long",
                                                                        day: "numeric",
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    })
                                                                    : "Date Not Available"}
                                                            </p>
                                                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                                                Academic Year: {q.academicYear || "Not set"} | Year: {q.year || "All"} | Branch: {q.branch || "All"} | Division: {q.division || "All"}
                                                            </p>
                                                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                                                Questions: {q.questions?.length || 0} | Time: {q.timer} min | Status: <span className="text-green-500">✦</span>
                                                            </p>
                                                            <div className="flex gap-2 mt-1">
                                                                <Link
                                                                    to={`/dashboard/attempt/${q._id}`}
                                                                    className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
                                                                >
                                                                    View Quiz
                                                                </Link>
                                                                <Link
                                                                    to={`/dashboard/quiz/${q._id}/report`}
                                                                    className="text-green-600 hover:text-green-700 text-xs sm:text-sm font-medium"
                                                                >
                                                                    View Report
                                                                </Link>
                                                            </div>
                                                        </div>
                                                        {role === "admin" && q.createdBy?.email === userEmail && (
                                                            <div className="flex sm:flex-col gap-1 sm:gap-2 mt-2 sm:mt-0 sm:ml-2">
                                                                <button
                                                                    onClick={() => handleToggleVisibility(q._id, q.isVisible)}
                                                                    className="text-gray-500 hover:text-gray-600 text-base p-1 rounded-full hover:bg-gray-100 transition"
                                                                    title="Hide Quiz"
                                                                    disabled={isLoading}
                                                                >
                                                                    <i className="fas fa-eye"></i>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEdit(q._id)}
                                                                    className="text-blue-500 hover:text-blue-700 text-base p-1 rounded-full hover:bg-gray-100 transition"
                                                                    title="Edit Quiz"
                                                                    disabled={isLoading}
                                                                >
                                                                    <i className="fa-solid fa-pen"></i>
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteConfirm({ show: true, quizId: q._id })}
                                                                    className="text-red-500 hover:text-red-700 text-base p-1 rounded-full hover:bg-gray-100 transition"
                                                                    title="Delete Quiz"
                                                                    disabled={isLoading}
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-2 sm:p-4 md:p-6">
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                            <h1 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                                <i className="fa-solid fa-list text-base sm:text-lg"></i> All Quizzes
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <label className="block font-semibold text-xs sm:text-sm text-gray-700">Additional Filters</label>
                            <button
                                type="button"
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className=" text-blue-500 hover:text-blue-700 text-base p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 transition"
                                aria-label="Toggle filters"
                            >
                                <i className="fas fa-filter"></i>
                            </button>
                        </div>
                        {isFilterOpen && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 p-2 sm:p-4 md:p-6">
                                <div>
                                    <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Subject - Topic</label>
                                    <input
                                        type="text"
                                        value={filterSubjectTitle}
                                        onChange={(e) => setFilterSubjectTitle(e.target.value)}
                                        placeholder="Search subject or title"
                                        className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Academic Year</label>
                                    <select
                                        value={filterAcademicYear}
                                        onChange={(e) => setFilterAcademicYear(e.target.value)}
                                        className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                    >
                                        <option value="">All</option>
                                        {academicYears.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Posted by</label>
                                    <input
                                        type="text"
                                        value={filterPostedBy}
                                        onChange={(e) => setFilterPostedBy(e.target.value)}
                                        placeholder="Search email"
                                        className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Year</label>
                                    <select
                                        value={filterYear}
                                        onChange={(e) => setFilterYear(e.target.value)}
                                        className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                    >
                                        <option value="">All</option>
                                        {["FY", "SY", "TY", "4TH"].map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Branch</label>
                                    <input
                                        type="text"
                                        value={filterBranch}
                                        onChange={(e) => setFilterBranch(e.target.value)}
                                        placeholder="Branch"
                                        maxLength={4}
                                        className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Division</label>
                                    <select
                                        value={filterDivision}
                                        onChange={(e) => setFilterDivision(e.target.value)}
                                        className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                    >
                                        <option value="">All</option>
                                        {["A", "B", "C", "D"].map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">From Date</label>
                                    <input
                                        type="date"
                                        value={filterFromDate}
                                        onChange={(e) => setFilterFromDate(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">To Date</label>
                                    <input
                                        type="date"
                                        value={filterToDate}
                                        onChange={(e) => setFilterToDate(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                    />
                                </div>
                                <div className="sm:col-span-3 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-xs sm:text-sm"
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
                        )}
                        {groupedQuizzes.sortedDates.length === 0 ? (
                            <p className="text-xs sm:text-sm text-gray-500">No quizzes found.</p>
                        ) : (
                            groupedQuizzes.sortedDates.map((date) => (
                                groupedQuizzes.grouped[date] && (
                                    <div key={date} className="mb-3 sm:mb-4">
                                        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                                            {date}
                                        </h3>
                                        <ul className="space-y-2">
                                            {groupedQuizzes.grouped[date].map((q) => (
                                                <li
                                                    key={q._id}
                                                    className="p-2 sm:p-3 bg-white rounded-md border border-gray-300 shadow-sm hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                                        <div className="flex-1">
                                                            <strong className="text-sm sm:text-base font-bold text-gray-800 break-words">
                                                                {q.subject} - {q.title}
                                                            </strong>
                                                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 break-words">
                                                                Posted by: {q.createdBy?.email || "Unknown"}
                                                            </p>
                                                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                                                Academic Year: {q.academicYear || "Not set"} | Year: {q.year || "All"} | Branch: {q.branch || "All"} | Division: {q.division || "All"}
                                                            </p>
                                                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                                                Questions: {q.questions?.length || 0} | Time: {q.timer} min
                                                                {role === "admin" && (
                                                                    <span> | Status: <span className={q.isVisible ? "text-green-600" : "text-orange-500"}>{q.isVisible ? "✦" : "✦"}</span></span>
                                                                )}
                                                            </p>
                                                            {role === "user" && q.isVisible && !q.hasAttempted ? (
                                                                <Link
                                                                    to={`/dashboard/attempt/${q._id}`}
                                                                    className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium mt-1 inline-block"
                                                                >
                                                                    Attempt Quiz
                                                                </Link>
                                                            ) : role === "user" && q.isVisible && q.hasAttempted ? (
                                                                <span className="text-green-500 text-xs sm:text-sm mt-1 inline-block">
                                                                    <strong>Quiz Attempted</strong>
                                                                </span>
                                                            ) : role === "admin" ? (
                                                                <div className="flex gap-2 mt-1">
                                                                    <Link
                                                                        to={`/dashboard/attempt/${q._id}`}
                                                                        className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
                                                                    >
                                                                        View Quiz
                                                                    </Link>
                                                                    <Link
                                                                        to={`/dashboard/quiz/${q._id}/report`}
                                                                        className="text-green-600 hover:text-green-700 text-xs sm:text-sm font-medium"
                                                                    >
                                                                        View Report
                                                                    </Link>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                        {role === "admin" && q.createdBy?.email === userEmail && (
                                                            <div className="flex sm:flex-col gap-1 sm:gap-2 mt-2 sm:mt-0 sm:ml-2">
                                                                <button
                                                                    onClick={() => handleToggleVisibility(q._id, q.isVisible)}
                                                                    className={`text-${q.isVisible ? "gray" : "black"}-500 hover:text-${q.isVisible ? "gray" : "black"}-600 text-base p-1 rounded-full hover:bg-gray-100 transition`}
                                                                    title={q.isVisible ? "Hide Quiz" : "Show Quiz"}
                                                                    disabled={isLoading}
                                                                >
                                                                    <i className={`fas ${q.isVisible ? "fa-eye" : "fa-eye-slash"}`}></i>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEdit(q._id)}
                                                                    className="text-blue-500 hover:text-blue-700 text-base p-1 rounded-full hover:bg-gray-100 transition"
                                                                    title="Edit Quiz"
                                                                    disabled={isLoading}
                                                                >
                                                                    <i className="fa-solid fa-pen"></i>
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteConfirm({ show: true, quizId: q._id })}
                                                                    className="text-red-500 hover:text-red-700 text-base p-1 rounded-full hover:bg-gray-100 transition"
                                                                    title="Delete Quiz"
                                                                    disabled={isLoading}
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default Home;