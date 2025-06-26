import React, { useEffect, useState } from "react";
import API from "../../../api";
import { Link } from "react-router-dom";

function Home() {
    const [quizzes, setQuizzes] = useState([]);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await API.get("/quiz/all", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setQuizzes(res.data);
            } catch (err) {
                alert(err.response?.data?.msg || "Error loading quizzes");
            }
        };

        fetchQuizzes();
    }, []);

    return (
        <div>
            <h1 className="text-xl font-bold mb-4">All Quizzes</h1>
            <ul className="space-y-2">
                {quizzes.map((q, i) => (
                    <li key={i} className="p-4 border rounded bg-white">
                        <strong>{q.title}</strong>
                        <Link to={`/dashboard/attempt/${q._id}`} className="text-blue-600 underline">
                            Attempt Quiz
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Home;
