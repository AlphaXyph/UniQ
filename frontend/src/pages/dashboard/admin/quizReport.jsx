import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../../../../api";
import Popup from "../../../components/popup";

function QuizReport() {
    const { quizId } = useParams();
    const [report, setReport] = useState([]);
    const [quiz, setQuiz] = useState({ subject: "", title: "" });
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [sortBy, setSortBy] = useState("name");
    const [order, setOrder] = useState("asc");
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [subjectTopicQuery, setSubjectTopicQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [yearFilter, setYearFilter] = useState("");
    const [branchFilter, setBranchFilter] = useState("");
    const [divisionFilter, setDivisionFilter] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [selectedResults, setSelectedResults] = useState([]);
    const [confirmText, setConfirmText] = useState("");

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

    const handleSortChange = (value) => {
        setSortBy(value);
    };

    const toggleOrder = () => {
        setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSubjectTopicSearchChange = (e) => {
        setSubjectTopicQuery(e.target.value);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        if (name === "year") setYearFilter(value);
        if (name === "branch") setBranchFilter(value);
        if (name === "division") setDivisionFilter(value);
        if (name === "fromDate") setFromDate(value);
        if (name === "toDate") setToDate(value);
    };

    const clearFilters = () => {
        setYearFilter("");
        setBranchFilter("");
        setDivisionFilter("");
        setFromDate("");
        setToDate("");
        setSearchQuery("");
        setSubjectTopicQuery("");
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

    const handleSelect = (resultId) => {
        setSelectedResults((prev) =>
            prev.includes(resultId)
                ? prev.filter((id) => id !== resultId)
                : [...prev, resultId]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allVisibleIds = sortedDates
                .flatMap((date) => groupedResults[date])
                .map((entry) => entry.resultId);
            setSelectedResults(allVisibleIds);
        } else {
            setSelectedResults([]);
        }
    };

    const handleDelete = async (ids) => {
        try {
            const token = localStorage.getItem("token");
            await API.post("/result/delete-many", { ids }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPopup({ message: "Results deleted successfully", type: "success" });
            setSelectedResults([]);
            fetchReport();
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Error deleting results", type: "error" });
        }
    };

    const groupedResults = useMemo(() => {
        const filtered = report.filter((entry) => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                String(entry.name || "").toLowerCase().includes(searchLower) ||
                String(entry.rollNo || "").toLowerCase().includes(searchLower) ||
                String(entry.email || "").toLowerCase().includes(searchLower);
            const subjectTopicLower = subjectTopicQuery.toLowerCase();
            const matchesSubjectTopic =
                !subjectTopicQuery ||
                (() => {
                    const combined = `${quiz.subject} ${quiz.title}`.toLowerCase();
                    if (combined.includes(subjectTopicLower)) return true;
                    if (subjectTopicLower.includes(" - ")) {
                        const [subjectPart, topicPart] = subjectTopicLower.split(" - ").map((s) => s.trim());
                        return (
                            String(quiz.subject || "").toLowerCase().includes(subjectPart) &&
                            String(quiz.title || "").toLowerCase().includes(topicPart)
                        );
                    }
                    return false;
                })();
            const matchesYear = !yearFilter || entry.year === yearFilter;
            const matchesBranch = !branchFilter || String(entry.branch || "").toLowerCase().includes(branchFilter.toLowerCase());
            const matchesDivision = !divisionFilter || entry.division === divisionFilter;
            const matchesDate =
                (!fromDate || (entry.createdAt && new Date(entry.createdAt).toLocaleDateString("en-US") >= new Date(fromDate).toLocaleDateString("en-US"))) &&
                (!toDate || (entry.createdAt && new Date(entry.createdAt).toLocaleDateString("en-US") <= new Date(toDate).toLocaleDateString("en-US")));
            return matchesSearch && matchesSubjectTopic && matchesYear && matchesBranch && matchesDivision && matchesDate;
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
                } else if (sortBy === "score") {
                    valA = parseInt(a.score.split("/")[0], 10) / (parseInt(a.score.split("/")[1], 10) || 1);
                    valB = parseInt(b.score.split("/")[0], 10) / (parseInt(b.score.split("/")[1], 10) || 1);
                } else if (sortBy === "rollNo") {
                    valA = parseInt(valA, 10) || 0;
                    valB = parseInt(valB, 10) || 0;
                }
                if (order === "asc") {
                    return valA > valB ? 1 : valA < valB ? -1 : 0;
                }
                return valA < valB ? 1 : valA > valB ? -1 : 0;
            });
        });

        return grouped;
    }, [report, sortBy, order, searchQuery, subjectTopicQuery, yearFilter, branchFilter, divisionFilter, fromDate, toDate, quiz.subject, quiz.title]);

    const sortedDates = useMemo(() => {
        return Object.keys(groupedResults).sort((a, b) => {
            if (a === "Unknown Date") return 1;
            if (b === "Unknown Date") return -1;
            return new Date(b) - new Date(a);
        });
    }, [groupedResults]);

    const areAllSelected = useMemo(() => {
        const visibleResults = sortedDates.flatMap((date) => groupedResults[date]);
        return visibleResults.length > 0 && visibleResults.every((entry) => selectedResults.includes(entry.resultId));
    }, [selectedResults, sortedDates, groupedResults]);

    const downloadCSV = () => {
        const headers = ["Roll No,Name,Year,Branch,Division,Marks,Total,Submission Time,Submission Type"];
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
                    marks,
                    total,
                    `"${createdAt}"`,
                    `"${String(entry.submissionType || "N/A")}"`,
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
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <Popup
                    message={popup.message}
                    type={popup.type}
                    onClose={closePopup}
                    confirmAction={popup.confirmAction}
                    confirmInput={confirmText}
                    setConfirmInput={setConfirmText}
                />
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="flex items-center gap-1">
                            <i className="fas fa-chart-bar text-xl sm:text-2xl"></i>
                            Quiz Report:
                        </span>
                        <p className="text-green-500 text-xl sm:text-2xl">{quiz.subject} - {quiz.title}</p>
                    </h2>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search by Name, Email, or Roll No"
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                        />
                    </div>
                    <div className="flex-1">
                        <input
                            type="text"
                            value={subjectTopicQuery}
                            onChange={handleSubjectTopicSearchChange}
                            placeholder="Search by Subject - Topic"
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                        />
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                        <label className="block font-semibold text-xs sm:text-sm text-gray-700">
                            Additional Filters
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="text-green-500 hover:text-green-600 text-base p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 transition"
                            aria-label="Toggle filters"
                        >
                            <i className="fas fa-filter"></i>
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={downloadCSV}
                            className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                            disabled={isLoading || sortedDates.length === 0}
                        >
                            <i className="fas fa-download"></i> Download CSV
                        </button>
                    </div>
                </div>
                {isFilterOpen && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border rounded-2xl bg-gray-100 sm:gap-4 mb-4 p-2 sm:p-4 md:p-6">
                        <div>
                            <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Year</label>
                            <select
                                name="year"
                                value={yearFilter}
                                onChange={handleFilterChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            >
                                <option value="">All Years</option>
                                <option value="FY">FY</option>
                                <option value="SY">SY</option>
                                <option value="TY">TY</option>
                                <option value="4TH">4TH</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Branch</label>
                            <input
                                type="text"
                                name="branch"
                                value={branchFilter}
                                onChange={handleFilterChange}
                                placeholder="Enter Branch"
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Division</label>
                            <select
                                name="division"
                                value={divisionFilter}
                                onChange={handleFilterChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            >
                                <option value="">All Divisions</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">From Date</label>
                            <input
                                type="date"
                                name="fromDate"
                                value={fromDate}
                                onChange={handleFilterChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">To Date</label>
                            <input
                                type="date"
                                name="toDate"
                                value={toDate}
                                onChange={handleFilterChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">Sort By</label>
                            <div className="flex items-center gap-2">
                                <select
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                >
                                    <option value="name">Name</option>
                                    <option value="rollNo">Roll No</option>
                                    <option value="score">Score</option>
                                </select>
                                <button
                                    onClick={toggleOrder}
                                    className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 transition duration-200"
                                >
                                    <i className={`fas fa-arrow-${order === "asc" ? "up" : "down"} text-lg`}></i>
                                </button>
                            </div>
                        </div>
                        <div className="sm:col-span-3 flex justify-end">
                            <button
                                onClick={clearFilters}
                                className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-xs sm:text-sm"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}
                {selectedResults.length > 0 && (
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => {
                                setPopup({
                                    message: "Are you sure you want to delete the selected results?<br />Type <strong>YES</strong> to confirm.",
                                    type: "error",
                                    confirmAction: (input) => {
                                        if (input === "YES") {
                                            handleDelete(selectedResults);
                                        }
                                    },
                                });
                                setConfirmText("");
                            }}
                            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                        >
                            Delete Selected
                        </button>
                    </div>
                )}
                {isLoading ? (
                    <p className="text-gray-500 text-sm">Loading results...</p>
                ) : sortedDates.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                        {searchQuery || subjectTopicQuery || yearFilter || branchFilter || divisionFilter || fromDate || toDate
                            ? "No results match your search or filters."
                            : "No results available for this quiz."}
                    </p>
                ) : (
                    sortedDates.map((date) => (
                        <div key={date} className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">{date}</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm no-select">
                                    <thead>
                                        <tr className="bg-gray-200">
                                            <th className="p-2">
                                                <input
                                                    type="checkbox"
                                                    checked={areAllSelected}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th className="p-2 text-left font-semibold">Roll No</th>
                                            <th className="p-2 text-left font-semibold">Name</th>
                                            <th className="p-2 text-left font-semibold">From</th>
                                            <th className="p-2 text-left font-semibold">Score</th>
                                            <th className="p-2 text-left font-semibold">Time</th>
                                            <th className="p-2 text-left font-semibold">Submission Type</th>
                                            <th className="p-2 text-left font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupedResults[date].map((entry, index) => (
                                            <tr key={`${date}-${index}`} className="border-b hover:bg-gray-50">
                                                <td className="p-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedResults.includes(entry.resultId)}
                                                        onChange={() => handleSelect(entry.resultId)}
                                                    />
                                                </td>
                                                <td className="p-2">{entry.rollNo}</td>
                                                <td className="p-2">
                                                    <span className="group relative">
                                                        {entry.name}
                                                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 top-0 left-full ml-2 z-10">
                                                            {entry.email || "No Email"}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className="p-2">{entry.from}</td>
                                                <td className={getScoreColor(entry.score) + " p-2"}>{entry.score}</td>
                                                <td className="p-2">
                                                    {entry.createdAt
                                                        ? new Date(entry.createdAt).toLocaleTimeString("en-US", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            hour12: true,
                                                        })
                                                        : "N/A"}
                                                </td>
                                                <td className="p-2">{entry.submissionType}</td>
                                                <td className="p-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="group relative">
                                                            <Link
                                                                to={`/dashboard/view-answers/${entry.resultId}`}
                                                                className="text-blue-600 hover:text-blue-800"
                                                            >
                                                                <i className="fas fa-list-check"></i>
                                                            </Link>
                                                            <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 top-0 left-full ml-2 z-10">
                                                                View Answers
                                                            </span>
                                                        </span>
                                                        <span className="group relative">
                                                            <button
                                                                onClick={() => {
                                                                    setPopup({
                                                                        message: "Are you sure you want to delete this result?<br />Type <strong>YES</strong> to confirm.",
                                                                        type: "error",
                                                                        confirmAction: (input) => {
                                                                            if (input === "YES") {
                                                                                handleDelete([entry.resultId]);
                                                                            }
                                                                        },
                                                                    });
                                                                    setConfirmText("");
                                                                }}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                            <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 top-0 left-full ml-2 z-10">
                                                                Delete Record
                                                            </span>
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default QuizReport;