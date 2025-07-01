import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import API from "../../../api";
import Popup from "../../components/Popup";

function QuizReport() {
    const { quizId } = useParams();
    const [report, setReport] = useState([]);
    const [quiz, setQuiz] = useState({ subject: "", title: "" });
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [sortBy, setSortBy] = useState("name");
    const [order, setOrder] = useState("asc");
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchReport = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await API.get(`/result/quiz/${quizId}/report`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setReport(res.data);
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Error loading report", type: "error" });
        } finally {
            setIsLoading(false);
        }
    }, [quizId]);

    const fetchQuizDetails = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await API.get(`/quiz/${quizId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setQuiz({ subject: res.data.subject || "Unknown", title: res.data.title || "Unknown" });
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Error loading quiz details", type: "error" });
        }
    }, [quizId]);

    useEffect(() => {
        fetchQuizDetails();
        fetchReport();
    }, [fetchQuizDetails, fetchReport]);

    const handleSortChange = (e) => {
        const { name, value } = e.target;
        if (name === "sortBy") setSortBy(value);
        if (name === "order") setOrder(value);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
    };

    const getScoreColor = (score) => {
        const [marks, total] = score.split("/").map(Number);
        const percentage = total > 0 ? (marks / total) * 100 : 0;
        if (percentage >= 70) return "text-green-600";
        if (percentage >= 40) return "text-orange-600";
        return "text-red-600";
    };

    const groupedResults = useMemo(() => {
        const filtered = report.filter((entry) => {
            const searchLower = searchQuery.toLowerCase();
            return (
                String(entry.name || "").toLowerCase().includes(searchLower) ||
                String(entry.rollNo || "").toLowerCase().includes(searchLower) ||
                String(entry.division || "").toLowerCase().includes(searchLower) ||
                String(entry.branch || "").toLowerCase().includes(searchLower) ||
                String(entry.year || "").toLowerCase().includes(searchLower)
            );
        });

        const sortedByDate = filtered.slice().sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        });

        const grouped = sortedByDate.reduce((acc, entry) => {
            const date = entry.createdAt
                ? new Date(entry.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })
                : "Unknown Date";
            if (!acc[date]) acc[date] = [];
            acc[date].push(entry);
            return acc;
        }, {});

        Object.keys(grouped).forEach((date) => {
            grouped[date].sort((a, b) => {
                let valA = a[sortBy] || "";
                let valB = b[sortBy] || "";
                if (sortBy === "name") {
                    valA = String(a.name || "").toLowerCase();
                    valB = String(b.name || "").toLowerCase();
                    if (valA === valB) {
                        valA = a.name.split(" ")[1]?.toLowerCase() || "";
                        valB = b.name.split(" ")[1]?.toLowerCase() || "";
                    }
                } else if (sortBy === "year") {
                    valA = parseInt(valA, 10) || 0;
                    valB = parseInt(valB, 10) || 0;
                } else if (sortBy === "score") {
                    valA = parseInt(a.score.split("/")[0], 10) / (parseInt(a.score.split("/")[1], 10) || 1);
                    valB = parseInt(b.score.split("/")[0], 10) / (parseInt(b.score.split("/")[1], 10) || 1);
                }
                if (order === "asc") {
                    return valA > valB ? 1 : valA < valB ? -1 : 0;
                }
                return valA < valB ? 1 : valA > valB ? -1 : 0;
            });
        });

        return grouped;
    }, [report, sortBy, order, searchQuery]);

    const sortedDates = useMemo(() => {
        return Object.keys(groupedResults).sort((a, b) => {
            if (a === "Unknown Date") return 1;
            if (b === "Unknown Date") return -1;
            return new Date(b) - new Date(a);
        });
    }, [groupedResults]);

    const downloadCSV = () => {
        const headers = ["rollNo,name,year,branch,division,subject,topic,marks,total,createdAt"];
        const rows = sortedDates
            .flatMap((date) => groupedResults[date])
            .map((entry) => {
                const [marks, total] = entry.score.split("/").map(Number);
                const createdAt = entry.createdAt
                    ? new Date(entry.createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                    })
                    : "N/A";
                return [
                    `"${String(entry.rollNo || "N/A")}"`,
                    `"${String(entry.name || "Unknown")}"`,
                    `"${String(entry.year || "N/A")}"`,
                    `"${String(entry.branch || "N/A")}"`,
                    `"${String(entry.division || "N/A")}"`,
                    `"${String(entry.subject || "Unknown")}"`,
                    `"${String(entry.topic || "Unknown")}"`,
                    marks,
                    total,
                    `"${createdAt}"`,
                ].join(",");
            });
        const csvContent = [headers, ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `QuizReport_${String(quiz.subject || "Unknown")}_${String(quiz.title || "Unknown").replace(/\s+/g, "_")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-2 sm:p-4 md:p-5">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-2 sm:p-4 md:p-5">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                    <i className="fas fa-chart-bar text-base sm:text-lg"></i> Quiz Report
                </h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                    <div className="flex flex-col w-full">
                        <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Search:</label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Name, Roll, Branch, Div or Year"
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                        />
                    </div>
                    <div className="flex flex-col w-full">
                        <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Sort by:</label>
                        <select
                            name="sortBy"
                            value={sortBy}
                            onChange={handleSortChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                        >
                            <option value="name">Name</option>
                            <option value="rollNo">Roll No</option>
                            <option value="division">Division</option>
                            <option value="branch">Branch</option>
                            <option value="year">Year</option>
                            <option value="score">Score</option>
                        </select>
                    </div>
                    <div className="flex flex-col w-full">
                        <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Order:</label>
                        <select
                            name="order"
                            value={order}
                            onChange={handleSortChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                        >
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                        </select>
                    </div>
                </div>
                <div className="mb-3 sm:mb-4">
                    <button
                        onClick={downloadCSV}
                        className="w-auto flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs sm:text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                        disabled={isLoading || sortedDates.length === 0}
                    >
                        <i className="fas fa-download text-base p-1"></i>
                        <span>Download CSV</span>
                    </button>
                </div>
                {isLoading ? (
                    <p className="text-gray-500 text-xs sm:text-sm">Loading results...</p>
                ) : sortedDates.length === 0 ? (
                    <p className="text-gray-500 text-xs sm:text-sm">
                        {searchQuery ? "No results match your search." : "No results available for this quiz."}
                    </p>
                ) : (
                    sortedDates.map((date) => (
                        <div key={date} className="mb-3 sm:mb-4">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">{date}</h3>
                            <ul className="space-y-2">
                                {groupedResults[date].map((entry, index) => (
                                    <li
                                        key={`${date}-${index}`}
                                        className="p-2 sm:p-3 bg-gray-50 rounded-md shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm"
                                    >
                                        <div>
                                            <strong>{entry.rollNo}</strong>:{" "}
                                            <span className="group relative">
                                                <strong>{entry.name}</strong>
                                                <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 -top-8 left-0 z-10">
                                                    {entry.email || "No Email"}
                                                </span>
                                            </span>{" "}
                                            from <strong>{entry.year}-{entry.branch}-{entry.division}</strong> attempted{" "}
                                            <strong>
                                                {entry.subject} - {entry.topic}
                                            </strong>{" "}
                                            and scored{" "}
                                            <strong className={getScoreColor(entry.score)}>{entry.score}</strong>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {entry.createdAt
                                                ? new Date(entry.createdAt).toLocaleTimeString("en-US", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    hour12: true,
                                                })
                                                : "N/A"}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default QuizReport;