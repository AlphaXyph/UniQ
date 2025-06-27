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

    return (
        <div className="relative">
            <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            <h2 className="text-xl font-bold mb-4">Your Results</h2>
            <ul className="space-y-2">
                {[...results].reverse().map((r) => (
                    <li key={r._id} className="p-4 border rounded bg-white">
                        <strong>{r.quiz?.title || "Deleted Quiz"}</strong> - {r.score}/{r.total}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Result;