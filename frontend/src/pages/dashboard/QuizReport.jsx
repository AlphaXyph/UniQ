import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api";

function QuizReport() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [reportData, setReportData] = useState([]);
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await API.get(`/result/quiz/${quizId}`);
                setReportData(res.data);
            } catch (err) {
                console.error("Fetch report error:", err.response?.data || err.message);
                navigate("/dashboard"); // Redirect on error
            }
        };
        fetchReport();
    }, [quizId, navigate]);

    const sortData = (data) => {
        return [...data].sort((a, b) => {
            const aValue = sortBy === "name" ? `${a.student.name} ${a.student.surname}` : a.student[sortBy];
            const bValue = sortBy === "name" ? `${b.student.name} ${b.student.surname}` : b.student[sortBy];
            if (sortOrder === "asc") {
                return aValue.localeCompare(bValue, undefined, { numeric: true });
            } else {
                return bValue.localeCompare(aValue, undefined, { numeric: true });
            }
        });
    };

    const sortedData = sortData(reportData);

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Quiz Report</h1>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Back to Dashboard
                    </button>
                </div>
                <div className="mb-6 flex gap-4">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="border rounded p-2"
                    >
                        <option value="name">Name</option>
                        <option value="rollNo">Roll No</option>
                        <option value="division">Div</option>
                        <option value="branch">Branch</option>
                        <option value="year">Year</option>
                    </select>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="border rounded p-2"
                    >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>
                <div className="space-y-4">
                    {sortedData.length > 0 ? (
                        sortedData.map((r) => (
                            <div
                                key={r._id}
                                className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <p className="text-lg">
                                    Roll number: {r.student.rollNo}: {r.student.name} {r.student.surname} from {r.student.year}-{r.student.branch}-{r.student.division} took {r.quiz.subject} - {r.quiz.title} and scored {r.score}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500">No results available for this quiz.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default QuizReport;