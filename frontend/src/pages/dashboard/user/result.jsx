import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../../../api";
import Popup from "../../../components/popup";

function Result() {
    const [results, setResults] = useState([]);
    const [canViewAnswersMap, setCanViewAnswersMap] = useState({});
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await API.get("/result/my", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setResults(res.data);

                // Fetch canViewAnswers status for each result
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
        <div className="min-h-screen bg-gray-100 p-2 sm:p-4 md:p-5">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-2 sm:p-4 md:p-5">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                    <i className="fas fa-chart-bar text-base sm:text-lg"></i> Your Results
                </h2>
                <div className="mb-3 sm:mb-4">
                    <label className="block mb-1 font-semibold text-xs sm:text-sm text-gray-700">
                        Search by Subject or Title
                    </label>
                    <input
                        type="text"
                        placeholder="Search by subject or title"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    />
                </div>
                {sortedDates.length === 0 && (
                    <p className="text-gray-500 text-xs sm:text-sm">No results found.</p>
                )}
                {sortedDates.map((date) =>
                    filteredResults[date] ? (
                        <div key={date} className="mb-3 sm:mb-4">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">{date}</h3>
                            <ul className="space-y-2">
                                {filteredResults[date].map((r) => (
                                    <li
                                        key={r._id}
                                        className="p-2 sm:p-3 bg-gray-50 rounded-md shadow-md flex flex-col gap-2 text-xs sm:text-sm"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                            <div>
                                                In <strong>{r.quiz?.subject || "No Subject"}</strong> -{" "}
                                                <strong>{r.quiz?.title || "Deleted Quiz"}</strong> you scored{" "}
                                                <span className={getScoreColor(r.score, r.total)}>
                                                    {r.score}/{r.total}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {r.createdAt
                                                    ? new Date(r.createdAt).toLocaleTimeString("en-US", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        hour12: true,
                                                    })
                                                    : "N/A"}
                                            </span>
                                        </div>
                                        {canViewAnswersMap[r._id] && (
                                            <Link
                                                to={`/dashboard/view-answers/${r._id}`}
                                                className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm flex items-center gap-1 w-fit"
                                            >
                                                <i className="fa-solid fa-magnifying-glass"></i> View Answers
                                            </Link>
                                        )}
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