import React, { useEffect, useState } from "react";
import API from "../../../api";
import Popup from "../../components/popup";

function Result() {
    const [results, setResults] = useState([]);
    const [popup, setPopup] = useState({ message: "", type: "success" });

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

    // Group results by date and sort by date descending
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

    // Sort dates in descending order
    const sortedDates = Object.keys(groupedResults).sort((a, b) => {
        if (a === "Unknown Date") return 1;
        if (b === "Unknown Date") return -1;
        return new Date(b) - new Date(a);
    });

    return (
        <div className="relative">
            <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            <h2 className="text-xl font-bold mb-4">Your Results</h2>
            {sortedDates.length === 0 && <p>No results found.</p>}
            {sortedDates.map((date) => (
                <div key={date} className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">{date}</h3>
                    <ul className="space-y-2">
                        {groupedResults[date].map((r) => (
                            <li key={r._id} className="p-4 border rounded bg-white flex justify-between items-center">
                                <div>
                                    <strong>{r.quiz?.title || "Deleted Quiz"}</strong> - {r.score}/{r.total}
                                </div>
                                <span className="text-sm text-gray-500">
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
            ))}
        </div>
    );
}

export default Result;