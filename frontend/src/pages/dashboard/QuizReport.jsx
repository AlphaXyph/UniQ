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

    const fetchReport = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            console.log("Fetching report for quizId:", quizId);
            const res = await API.get(`/result/quiz/${quizId}/report`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Report fetched:", res.data);
            setReport(res.data);
        } catch (err) {
            console.error("Fetch report error:", err.response?.data || err.message);
            setPopup({ message: err.response?.data?.msg || "Error loading report", type: "error" });
        } finally {
            setIsLoading(false);
        }
    }, [quizId]);

    const fetchQuizDetails = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            console.log("Fetching quiz details for:", quizId);
            const res = await API.get(`/quiz/${quizId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setQuiz({ subject: res.data.subject, title: res.data.title });
        } catch (err) {
            console.error("Fetch quiz details error:", err.response?.data || err.message);
            setPopup({ message: err.response?.data?.msg || "Error loading quiz details", type: "error" });
        }
    }, [quizId]);

    useEffect(() => {
        fetchQuizDetails();
        fetchReport();
    }, [fetchQuizDetails, fetchReport]);

    const handleSortChange = (e) => {
        const { name, value } = e.target;
        console.log("Sort change:", { name, value });
        if (name === "sortBy") setSortBy(value);
        if (name === "order") setOrder(value);
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

    const sortedReport = useMemo(() => {
        const sorted = [...report];
        const compare = (a, b) => {
            let valA = a[sortBy] || "";
            let valB = b[sortBy] || "";
            if (sortBy === "name") {
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
                if (valA === valB) {
                    valA = a.name.split(" ")[1]?.toLowerCase() || "";
                    valB = b.name.split(" ")[1]?.toLowerCase() || "";
                }
            } else if (sortBy === "year") {
                valA = parseInt(valA, 10);
                valB = parseInt(valB, 10);
            }
            if (order === "asc") {
                return valA > valB ? 1 : valA < valB ? -1 : 0;
            }
            return valA < valB ? 1 : valA > valB ? -1 : 0;
        };
        console.log("Sorting report:", { sortBy, order, sorted });
        return sorted.sort(compare);
    }, [report, sortBy, order]);

    const downloadCSV = () => {
        const headers = ["rollNo,name,year,branch,division,score,total"];
        const rows = sortedReport.map((entry) => {
            const [marks, total] = entry.score.split("/").map(Number);
            return [
                `"${entry.rollNo}"`,
                `"${entry.name}"`,
                `"${entry.year}"`,
                `"${entry.branch}"`,
                `"${entry.division}"`,
                marks,
                total,
            ].join(",");
        });
        const csvContent = [headers, ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `QuizReport_${quiz.subject}_${quiz.title.replace(/\s+/g, "_")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
            <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                    <i className="fas fa-chart-bar"></i> Quiz Report
                </h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 sm:gap-4">
                    {/* Sort By */}
                    <div className="flex flex-col">
                        <label className="mb-1 font-semibold text-sm sm:text-base text-gray-700">Sort by:</label>
                        <select
                            name="sortBy"
                            value={sortBy}
                            onChange={handleSortChange}
                            className="w-40 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="name">Name</option>
                            <option value="rollNo">Roll No</option>
                            <option value="division">Division</option>
                            <option value="branch">Branch</option>
                            <option value="year">Year</option>
                        </select>
                    </div>
                    {/* Order */}
                    <div className="flex flex-col">
                        <label className="mb-1 font-semibold text-sm sm:text-base text-gray-700">Order:</label>
                        <select
                            name="order"
                            value={order}
                            onChange={handleSortChange}
                            className="w-40 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                        </select>
                    </div>

                    {/* Download Button */}
                    <div className="sm:ml-auto">
                        <button
                            onClick={downloadCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                            disabled={isLoading || sortedReport.length === 0}
                        >
                            <i className="fas fa-download"></i>
                            <span>Download CSV</span>
                        </button>
                    </div>
                </div>
                {isLoading ? (
                    <p className="text-gray-600 text-xs sm:text-sm">Loading results...</p>
                ) : sortedReport.length === 0 ? (
                    <p className="text-gray-600 text-xs sm:text-sm">No results available for this quiz.</p>
                ) : (
                    <ul className="space-y-2 sm:space-y-3">
                        {sortedReport.map((entry, index) => (
                            <li
                                key={index}
                                className="p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
                            >
                                <div>
                                    <strong>{entry.rollNo}</strong>:{" "}
                                    <span className="group relative">
                                        <strong>{entry.name}</strong>
                                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs sm:text-sm rounded px-2 py-1 -top-8 left-0 z-10">
                                            {entry.email || "No Email"}
                                        </span>
                                    </span>{" "}
                                    from {entry.year}-{entry.branch}-{entry.division} took{" "}
                                    <strong>
                                        {entry.subject} - {entry.topic}
                                    </strong>{" "}
                                    and scored <strong className={getScoreColor(entry.score)}>{entry.score}</strong>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default QuizReport;