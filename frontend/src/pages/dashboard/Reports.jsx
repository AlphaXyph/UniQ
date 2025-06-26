import React, { useEffect, useState } from "react";
import API from "../../../api";

function Reports() {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            const token = localStorage.getItem("token");
            const res = await API.get("/result/all", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setReports(res.data);
        };
        fetch();
    }, []);

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">All Student Reports</h2>
            <ul className="space-y-2">
                {reports.map((r, i) => (
                    <li key={i} className="p-4 border rounded bg-white">
                        <strong>{r.student.email}</strong> took <strong>{r.quiz.title}</strong> and scored <strong>{r.score}/{r.total}</strong>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Reports;
