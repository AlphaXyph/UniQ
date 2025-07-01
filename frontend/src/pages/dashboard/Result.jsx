import React, { useEffect, useState } from "react";
import API from "../../../api";
import Popup from "../../components/Popup";

function Result() {
    const [results, setResults] = useState([]);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetch = async () => {
            try {
                const token = localStorage.getItem("token");
                console.log("Fetching results with token:", token);
                const res = await API.get("/result/my", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("Fetched results:", res.data);
                setResults(res.data);
            } catch (err) {
                console.error("Fetch results error:", err.response?.data || err.message);
                setPopup({ message: err.response?.data?.msg || "Error loading results", type: "error" });
            }
        };
        fetch();
    }, []);

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
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
                r.quiz?.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.quiz?.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filtered.length > 0) acc[date] = filtered;
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
            <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                    <i className="fas fa-chart-bar"></i> Your Results
                </h2>
                <div>
                    <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">
                        Search by Subject or Title
                    </label>
                    <input
                        type="text"
                        placeholder="Search by subject or title"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    />
                </div>
                {sortedDates.length === 0 && (
                    <p className="text-gray-600 text-xs sm:text-sm">No results found.</p>
                )}
                {sortedDates.map((date) =>
                    filteredResults[date] ? (
                        <div key={date} className="space-y-3 sm:space-y-4">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800">{date}</h3>
                            <ul className="space-y-2 sm:space-y-3">
                                {filteredResults[date].map((r) => (
                                    <li
                                        key={r._id}
                                        className="p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 text-sm"
                                    >
                                        <div>
                                            In <strong>{r.quiz?.subject || "No Subject"}</strong> -{" "}
                                            <strong>{r.quiz?.title || "Deleted Quiz"}</strong> you scored{" "}
                                            <span className={getScoreColor(r.score, r.total)}>
                                                {r.score}/{r.total}
                                            </span>
                                        </div>
                                        <span className="text-xs sm:text-sm text-gray-500">
                                            {r.createdAt
                                                ? new Date(r.createdAt).toLocaleTimeString("en-US", {
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
                    ) : null
                )}
            </div>
        </div>
    );
}

export default Result;