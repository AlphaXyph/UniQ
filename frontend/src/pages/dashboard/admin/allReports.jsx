import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import API from "../../../../api";
import Popup from "../../../components/popup";

function AllReports() {
    const [results, setResults] = useState([]);
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

    const fetchResults = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await API.get("/result/all", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const formattedResults = res.data.map((r) => ({
                resultId: r._id,
                rollNo: r.rollNo || "N/A",
                name: `${r.student?.name || "Unknown"} ${r.student?.surname || ""}`.trim(),
                email: r.student?.email || "No Email",
                year: r.year || "N/A",
                branch: r.branch || "N/A",
                division: r.division || "N/A",
                from: `${r.year || "N/A"}-${r.branch || "N/A"}-${r.division || "N/A"}`,
                subject: r.quiz?.subject || "Unknown",
                topic: r.quiz?.title || "Unknown",
                score: `${r.score ?? 0}/${r.total ?? 0}`,
                createdAt: r.createdAt,
            }));
            setResults(formattedResults);
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Error loading results", type: "error" });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

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
        const filtered = results.filter((entry) => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                String(entry.name || "").toLowerCase().includes(searchLower) ||
                String(entry.rollNo || "").toLowerCase().includes(searchLower) ||
                String(entry.email || "").toLowerCase().includes(searchLower);
            const subjectTopicLower = subjectTopicQuery.toLowerCase();
            const matchesSubjectTopic =
                !subjectTopicQuery ||
                (() => {
                    const combined = `${entry.subject} ${entry.topic}`.toLowerCase();
                    if (combined.includes(subjectTopicLower)) return true;
                    if (subjectTopicLower.includes(" - ")) {
                        const [subjectPart, topicPart] = subjectTopicLower.split(" - ").map((s) => s.trim());
                        return (
                            String(entry.subject || "").toLowerCase().includes(subjectPart) &&
                            String(entry.topic || "").toLowerCase().includes(topicPart)
                        );
                    }
                    return false;
                })();
            const matchesYear = !yearFilter || entry.year === yearFilter;
            const matchesBranch = !branchFilter || String(entry.branch || "").toLowerCase().includes(branchFilter.toLowerCase());
            const matchesDivision = !divisionFilter || entry.division === divisionFilter;
            const matchesDate =
                !fromDate ||
                !toDate ||
                (entry.createdAt &&
                    new Date(entry.createdAt).toLocaleDateString("en-US") >= new Date(fromDate).toLocaleDateString("en-US") &&
                    new Date(entry.createdAt).toLocaleDateString("en-US") <= new Date(toDate).toLocaleDateString("en-US"));
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
    }, [results, sortBy, order, searchQuery, subjectTopicQuery, yearFilter, branchFilter, divisionFilter, fromDate, toDate]);

    const sortedDates = useMemo(() => {
        return Object.keys(groupedResults).sort((a, b) => {
            if (a === "Unknown Date") return 1;
            if (b === "Unknown Date") return -1;
            return new Date(b) - new Date(a);
        });
    }, [groupedResults]);

    const downloadCSV = () => {
        const headers = ["Roll No,Name,Year,Branch,Division,Subject,Topic,Marks,Total,Submission Time"];
        const rows = sortedDates
            .flatMap((date) => groupedResults[date])
            .map((entry) => {
                const [marks, total] = entry.score.split("/").map(Number);
                const submissionTime = entry.createdAt
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
                    `"${submissionTime}"`,
                ].join(",");
            });
        const csvContent = [headers, ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "All_Quiz_Results.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                {/* SEARCH + FILTER SECTION */}
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <i className="fas fa-chart-bar text-xl sm:text-2xl"></i> All Quiz Results
                    </h2>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search by Name, Roll No, or Email"
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
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <div className="flex items-center gap-2">
                        <label className="block font-semibold text-xs sm:text-sm text-gray-700">Additional Filters</label>
                        <button
                            type="button"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="text-blue-500 hover:text-blue-700 text-base p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 transition"
                            aria-label="Toggle filters"
                        >
                            <i className="fas fa-filter"></i>
                        </button>
                    </div>
                    <button
                        onClick={downloadCSV}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                        disabled={isLoading || sortedDates.length === 0}
                    >
                        <i className="fas fa-download"></i> Download CSV
                    </button>
                </div>
                {isFilterOpen && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 p-2 sm:p-4 md:p-6">
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
                                    name="sortBy"
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
                {isLoading ? (
                    <p className="text-gray-500 text-sm">Loading results...</p>
                ) : sortedDates.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                        {searchQuery || subjectTopicQuery || yearFilter || branchFilter || divisionFilter || fromDate || toDate
                            ? "No results match your search or filters."
                            : "No results available."}
                    </p>
                ) : (
                    sortedDates.map((date) => (
                        <div key={date} className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">{date}</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-200">
                                            <th className="p-2 text-left font-semibold">Roll No</th>
                                            <th className="p-2 text-left font-semibold">Name</th>
                                            <th className="p-2 text-left font-semibold">From</th>
                                            <th className="p-2 text-left font-semibold w-32">Subject</th>
                                            <th className="p-2 text-left font-semibold w-32">Topic</th>
                                            <th className="p-2 text-left font-semibold">Score</th>
                                            <th className="p-2 text-left font-semibold">Time</th>
                                            <th className="p-2 text-left font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupedResults[date].map((entry, index) => (
                                            <tr key={`${date}-${index}`} className="border-b hover:bg-gray-50">
                                                <td className="p-2">{entry.rollNo}</td>
                                                <td className="p-2">
                                                    <span className="group relative">
                                                        {entry.name}
                                                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 -top-8 left-0 z-10">
                                                            {entry.email}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className="p-2">{entry.from}</td>
                                                <td className="p-2 w-32 truncate">
                                                    <span className="group relative">
                                                        {entry.subject}
                                                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 -top-8 left-0 z-10">
                                                            {entry.subject}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className="p-2 w-32 truncate">
                                                    <span className="group relative">
                                                        {entry.topic}
                                                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 -top-8 left-0 z-10">
                                                            {entry.topic}
                                                        </span>
                                                    </span>
                                                </td>
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
                                                <td className="p-2">
                                                    <Link
                                                        to={`/dashboard/view-answers/${entry.resultId}`}
                                                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                                                    >
                                                        <i className="fa-solid fa-magnifying-glass"></i> View Answers
                                                    </Link>
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

export default AllReports;