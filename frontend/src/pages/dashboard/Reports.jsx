import React, { useEffect, useState } from "react";
import API from "../../../api";
import Popup from "../../components/popup";

function Reports() {
    const [reports, setReports] = useState([]);
    const [popup, setPopup] = useState({ message: "", type: "success" });

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

    return (
        <div className="relative">
            <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            <h2 className="text-xl font-bold mb-4">All Student Reports</h2>
            <ul className="space-y-2">
                {[...reports].reverse().map((r) => (
                    <li key={r._id} className="p-4 border rounded bg-white">
                        <strong>{r.student?.email || "Unknown Student"}</strong> took{" "}
                        <strong>{r.quiz?.title || "Deleted Quiz"}</strong> and scored{" "}
                        <strong>{r.score}/{r.total}</strong>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Reports;