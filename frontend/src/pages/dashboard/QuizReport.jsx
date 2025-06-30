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
        const percentage = (marks / total) * 100;
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
                // Secondary sort by surname for name
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
        <div className="relative p-4">
            <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            <h1 className="text-xl font-bold mb-4">Quiz Report</h1>
            <div className="mb-4">
                <strong className="text-lg">{quiz.subject} - {quiz.title}</strong>
            </div>
            <div className="mb-4 flex gap-4 items-center">
                <div>
                    <label className="mr-2">Sort by:</label>
                    <select
                        name="sortBy"
                        value={sortBy}
                        onChange={handleSortChange}
                        className="p-2 border rounded"
                    >
                        <option value="name">Name</option>
                        <option value="rollNo">Roll No</option>
                        <option value="division">Division</option>
                        <option value="branch">Branch</option>
                        <option value="year">Year</option>
                    </select>
                </div>
                <div>
                    <label className="mr-2">Order:</label>
                    <select
                        name="order"
                        value={order}
                        onChange={handleSortChange}
                        className="p-2 border rounded"
                    >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>
                <button
                    onClick={downloadCSV}
                    className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    disabled={isLoading || sortedReport.length === 0}
                >
                    Download CSV
                </button>
            </div>
            {isLoading ? (
                <p>Loading results...</p>
            ) : sortedReport.length === 0 ? (
                <p>No results available for this quiz.</p>
            ) : (
                <ul className="space-y-2">
                    {sortedReport.map((entry, index) => (
                        <li key={index} className="p-4 border rounded bg-white">
                            <strong>{entry.rollNo}</strong>: <span className="group relative">
                                <strong>{entry.name}</strong>
                                <span className="absolute hidden group-hover:block bg-gray-800 text-white text-sm rounded px-2 py-1 -top-8 left-0 z-10">
                                    {entry.email || "No Email"}
                                </span>
                            </span> from {entry.year}-{entry.branch}-{entry.division} took <strong>{entry.subject} - {entry.topic}</strong> and scored <strong className={getScoreColor(entry.score)}>{entry.score}</strong>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default QuizReport;