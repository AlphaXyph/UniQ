import React, { useEffect, useState } from "react";
import API from "../../../api";

function Result() {
    const [results, setResults] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            const token = localStorage.getItem("token");
            const res = await API.get("/result/my", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setResults(res.data);
        };
        fetch();
    }, []);

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Your Results</h2>
            <ul className="space-y-2">
                {results.map((r, i) => (
                    <li key={i} className="p-4 border rounded bg-white">
                        <strong>{r.quiz.title}</strong> - {r.score}/{r.total}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Result;
