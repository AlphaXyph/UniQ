import React, { useEffect, useState } from "react";
import API from "../../../api";
import Popup from "../../components/popup";

function Reports() {
    const [reports, setReports] = useState([]);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetch = async () => {
            try {
                const token = localStorage.getItem("token");
                console.log("Fetching reports with token:", token);
                const res = await API.get("/result/all", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("Fetched reports:", res.data);
                setReports(res.data);
            } catch (err) {
                console.error("Fetch reports error:", err.response?.data || err.message);
                setPopup({ message: err.response?.data?.msg || "Error loading reports", type: "error" });
            }
        };
        fetch();
    }, []);

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
    };

    // Group reports by date and sort by date descending
    const groupedReports = reports
        .slice()
        .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        })
        .reduce((acc, report) => {
            const date = report.createdAt
                ? new Date(report.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })
                : "Unknown Date";
            if (!acc[date]) acc[date] = [];
            acc[date].push(report);
            return acc;
        }, {});

    // Sort dates in descending order
    const sortedDates = Object.keys(groupedReports).sort((a, b) => {
        if (a === "Unknown Date") return 1;
        if (b === "Unknown Date") return -1;
        return new Date(b) - new Date(a);
    });

    // Filter reports by search term
    const filteredReports = Object.entries(groupedReports).reduce((acc, [date, reports]) => {
        const filtered = reports.filter(
            (r) =>
                r.quiz?.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.quiz?.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filtered.length > 0) acc[date] = filtered;
        return acc;
    }, {});

    return (
        <div className="relative p-4">
            <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            <h2 className="text-xl font-bold mb-4">All Student Reports</h2>
            <input
                type="text"
                placeholder="Search by subject or title"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4 p-2 border rounded w-full"
            />
            {sortedDates.length === 0 && <p>No reports found.</p>}
            {sortedDates.map((date) => (
                filteredReports[date] && (
                    <div key={date} className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">{date}</h3>
                        <ul className="space-y-2">
                            {filteredReports[date].map((r) => (
                                <li key={r._id} className="p-4 border rounded bg-white flex justify-between items-center">
                                    <div>
                                        <strong>{r.student?.email || "Unknown Student"}</strong> took{" "}
                                        <strong>{r.quiz?.subject || "No Subject"} - {r.quiz?.title || "Deleted Quiz"}</strong> and scored{" "}
                                        <strong>{r.score}/{r.total}</strong>
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
                )
            ))}
        </div>
    );
}

export default Reports;