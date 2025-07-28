import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../../../api";
import Popup from "../../../components/popup";

function Result() {
    const [results, setResults] = useState([]);
    const [canViewAnswersMap, setCanViewAnswersMap] = useState({});
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [subjectTopicQuery, setSubjectTopicQuery] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await API.get("/result/my", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setResults(res.data);

                const viewAnswersPromises = res.data.map(async (result) => {
                    try {
                        const response = await API.get(`/result/can-view-answers/${result._id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        return { id: result._id, canView: response.data.canView };
                    } catch (err) {
                        console.error(`Error checking view answers for result ${result._id}:`, err);
                        return { id: result._id, canView: false };
                    }
                });
                const viewAnswersResults = await Promise.all(viewAnswersPromises);
                const viewAnswersMap = viewAnswersResults.reduce((acc, { id, canView }) => {
                    acc[id] = canView;
                    return acc;
                }, {});
                setCanViewAnswersMap(viewAnswersMap);
            } catch (err) {
                setPopup({ message: err.response?.data?.msg || "Error loading results", type: "error" });
            }
        };
        fetchResults();
    }, []);

    const handleSubjectTopicSearchChange = (e) => {
        setSubjectTopicQuery(e.target.value);
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
    };

    const clearFilters = () => {
        setSubjectTopicQuery("");
        setFromDate("");
        setToDate("");
    };

    const getScoreColor = (score, total) => {
        const percentage = total > 0 ? (score / total) * 100 : 0;
        if (percentage >= 70) return "text-green-600";
        if (percentage >= 40) return "text-orange-600";
        return "text-red-600";
    };

    const groupedResults = results
        .slice()
        .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        })
        .reduce((acc, result) => {
            const date = result.createdAt
                ? new Date(result.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })
                : "Unknown Date";
            if (!acc[date]) acc[date] = [];
            acc[date].push(result);
            return acc;
        }, {});

    const sortedDates = Object.keys(groupedResults).sort((a, b) => {
        if (a === "Unknown Date") return 1;
        if (b === "Unknown Date") return -1;
        return new Date(b) - new Date(a);
    });

    const filteredResults = Object.entries(groupedResults).reduce((acc, [date, results]) => {
        const filtered = results.filter(
            (r) =>
                (!subjectTopicQuery ||
                    (() => {
                        const subjectTopicLower = subjectTopicQuery.toLowerCase();
                        const combined = `${r.quiz?.subject || ""} ${r.quiz?.title || ""}`.toLowerCase();
                        if (combined.includes(subjectTopicLower)) return true;
                        if (subjectTopicLower.includes(" - ")) {
                            const [subjectPart, topicPart] = subjectTopicLower.split(" - ").map((s) => s.trim());
                            return (
                                String(r.quiz?.subject || "").toLowerCase().includes(subjectPart) &&
                                String(r.quiz?.title || "").toLowerCase().includes(topicPart)
                            );
                        }
                        return false;
                    })()) &&
                (!fromDate || (r.createdAt && new Date(r.createdAt).toLocaleDateString("en-US") >= new Date(fromDate).toLocaleDateString("en-US"))) &&
                (!toDate || (r.createdAt && new Date(r.createdAt).toLocaleDateString("en-US") <= new Date(toDate).toLocaleDateString("en-US")))
        );
        if (filtered.length > 0) acc[date] = filtered;
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <i className="fas fa-chart-bar text-xl sm:text-2xl"></i> Your Results
                </h2>
                <div className="flex items-center gap-2 mb-2">
                    <label className="block font-semibold text-sm text-gray-700">Filters</label>
                    <button
                        type="button"
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="text-blue-500 hover:text-blue-700 text-base p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 transition"
                        aria-label="Toggle filters"
                    >
                        <i className="fas fa-filter"></i>
                    </button>
                </div>
                {isFilterOpen && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4">
                        <div>
                            <label className="block mb-1 font-semibold text-sm text-gray-700">Subject - Topic</label>
                            <input
                                type="text"
                                value={subjectTopicQuery}
                                onChange={handleSubjectTopicSearchChange}
                                placeholder="Search by Subject - Topic"
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold text-sm text-gray-700">From Date</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold text-sm text-gray-700">To Date</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div className="sm:col-span-3 flex justify-end">
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}
                {sortedDates.length === 0 && (
                    <p className="text-gray-500 text-sm">No results found.</p>
                )}
                {sortedDates.map((date) =>
                    filteredResults[date] ? (
                        <div key={date} className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">{date}</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-200">
                                            <th className="p-2 text-left font-semibold w-32">Subject</th>
                                            <th className="p-2 text-left font-semibold w-32">Topic</th>
                                            <th className="p-2 text-left font-semibold">Score</th>
                                            <th className="p-2 text-left font-semibold">Time</th>
                                            <th className="p-2 text-left font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredResults[date].map((r) => (
                                            <tr key={r._id} className="border-b hover:bg-gray-50">
                                                <td className="p-2 w-32 truncate">
                                                    <span className="group relative">
                                                        {r.quiz?.subject || "No Subject"}
                                                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 -top-8 left-0 z-10">
                                                            {r.quiz?.subject || "No Subject"}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className="p-2 w-32 truncate">
                                                    <span className="group relative">
                                                        {r.quiz?.title || "Deleted Quiz"}
                                                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 -top-8 left-0 z-10">
                                                            {r.quiz?.title || "Deleted Quiz"}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className={getScoreColor(r.score, r.total) + " p-2"}>{`${r.score}/${r.total}`}</td>
                                                <td className="p-2">
                                                    {r.createdAt
                                                        ? new Date(r.createdAt).toLocaleTimeString("en-US", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            hour12: true,
                                                        })
                                                        : "N/A"}
                                                </td>
                                                <td className="p-2">
                                                    {canViewAnswersMap[r._id] && (
                                                        <Link
                                                            to={`/dashboard/view-answers/${r._id}`}
                                                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                                                        >
                                                            <i className="fa-solid fa-magnifying-glass"></i> View Answers
                                                        </Link>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : null
                )}
            </div>
        </div>
    );
}

export default Result;