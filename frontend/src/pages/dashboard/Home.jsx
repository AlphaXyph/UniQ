import React, { useEffect, useState, useMemo } from "react";
import API from "../../../api";
import { Link, useNavigate } from "react-router-dom";
import Popup from "../../components/Popup";

function Home() {
    const [quizzes, setQuizzes] = useState([]);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, quizId: null });
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role;
    const navigate = useNavigate();

    const fetchQuizzes = async () => {
        try {
            const token = localStorage.getItem("token");
            console.log("Fetching quizzes with token:", token);
            const res = await API.get("/quiz/all", {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Fetched quizzes:", res.data);

            res.data.forEach((quiz, index) => {
                if (!quiz.createdAt || isNaN(new Date(quiz.createdAt).getTime())) {
                    console.warn(`Quiz ${index + 1} has invalid createdAt:`, {
                        id: quiz._id,
                        subject: quiz.subject,
                        title: quiz.title,
                        createdAt: quiz.createdAt,
                    });
                }
            });
            setQuizzes(res.data);
        } catch (err) {
            console.error("Fetch quizzes error:", err.response?.data || err.message);
            setPopup({ message: err.response?.data?.msg || "Error loading quizzes", type: "error" });
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const groupedQuizzes = useMemo(() => {
        // Group quizzes by date and sort by date descending
        const grouped = quizzes
            .slice()
            .sort((a, b) => {
                const dateA = a.createdAt && !isNaN(new Date(a.createdAt).getTime()) ? new Date(a.createdAt) : new Date(0);
                const dateB = b.createdAt && !isNaN(new Date(b.createdAt).getTime()) ? new Date(b.createdAt) : new Date(0);
                return dateB - dateA; // Sort quizzes within date descending
            })
            .reduce((acc, quiz) => {
                const date = quiz.createdAt && !isNaN(new Date(quiz.createdAt).getTime())
                    ? new Date(quiz.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })
                    : "Date Not Available";
                if (!acc[date]) acc[date] = [];
                acc[date].push(quiz);
                return acc;
            }, {});

        // Sort dates in descending order
        const sortedDates = Object.keys(grouped).sort((a, b) => {
            if (a === "Date Not Available") return 1;
            if (b === "Date Not Available") return -1;
            return new Date(b) - new Date(a);
        });

        return { grouped, sortedDates };
    }, [quizzes]);

    const handleEdit = (quizId) => {
        console.log("Navigating to edit:", quizId);
        navigate(`/dashboard/edit/${quizId}`);
    };

    const handleDelete = (quizId) => {
        console.log("Initiating delete for quiz:", quizId);
        setDeleteConfirm({ show: true, quizId });
    };

    const confirmDelete = async () => {
        try {
            const token = localStorage.getItem("token");
            console.log("Deleting quiz:", deleteConfirm.quizId, "with token:", token);
            const response = await API.delete(`/quiz/${deleteConfirm.quizId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Delete response:", response.data);
            setPopup({ message: "Quiz deleted", type: "success" });
            fetchQuizzes();
        } catch (err) {
            console.error("Delete quiz error:", err.response?.data || err.message);
            setPopup({ message: err.response?.data?.msg || "Error deleting quiz", type: "error" });
        }
        setDeleteConfirm({ show: false, quizId: null });
    };

    const handleToggleVisibility = async (quizId, isVisible) => {
        try {
            const token = localStorage.getItem("token");
            console.log(`Toggling visibility for quiz: ${quizId} to ${!isVisible}`);
            const response = await API.post(
                `/quiz/toggle-visibility/${quizId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Toggle visibility response:", response.data);
            setPopup({ message: response.data.msg || `Quiz is now ${isVisible ? "hidden" : "visible"}`, type: "success" });
            fetchQuizzes();
        } catch (err) {
            console.error("Toggle visibility error:", err.response?.data || err.message);
            setPopup({ message: err.response?.data?.msg || "Failed to toggle visibility. Please try again.", type: "error" });
        }
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
    };

    const closeDeleteConfirm = () => {
        setDeleteConfirm({ show: false, quizId: null });
    };

    return (
        <div className="relative p-4">
            <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            {deleteConfirm.show && (
                <Popup
                    message="Are you sure you want to delete this quiz?"
                    type="error"
                    onClose={closeDeleteConfirm}
                    confirmAction={confirmDelete}
                />
            )}
            <h1 className="text-xl font-bold mb-4">All Quizzes</h1>
            {groupedQuizzes.sortedDates.length === 0 && <p>No quizzes found.</p>}
            {groupedQuizzes.sortedDates.map((date) => (
                groupedQuizzes.grouped[date] && (
                    <div key={date} className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">{date}</h3>
                        <ul className="space-y-2">
                            {groupedQuizzes.grouped[date].map((q) => (
                                <li key={q._id} className="p-4 border rounded bg-white relative">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <strong className="text-lg">{q.subject} - {q.title}</strong>
                                            <p className="text-sm text-blue-500">Posted by: {q.createdBy?.email || "Unknown"}</p>
                                            <p className="text-sm text-gray-600">
                                                Total Questions: {q.questions.length} | Total Time: {q.timer} minutes
                                                {role === "admin" && (
                                                    <span> | Status: {q.isVisible ? "Visible" : "Hidden"}</span>
                                                )}
                                            </p>
                                            {role === "user" && q.isVisible ? (
                                                <Link to={`/dashboard/attempt/${q._id}`} className="text-blue-600 underline">
                                                    Attempt Quiz
                                                </Link>
                                            ) : role === "admin" ? (
                                                <div className="flex gap-2">
                                                    <Link to={`/dashboard/attempt/${q._id}`} className="text-blue-600 underline">
                                                        View Quiz
                                                    </Link>
                                                    <Link to={`/dashboard/quiz/${q._id}/report`} className="text-blue-600 underline">
                                                        View Report
                                                    </Link>
                                                </div>
                                            ) : null}
                                        </div>
                                        {role === "admin" && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleToggleVisibility(q._id, q.isVisible)}
                                                    className={`text-${q.isVisible ? "gray" : "green"}-500 mx-1 hover:text-${q.isVisible ? "gray" : "green"}-700`}
                                                    title={q.isVisible ? "Hide Quiz" : "Show Quiz"}
                                                >
                                                    {q.isVisible ? <i className="fas fa-eye"></i> : <i className="fas fa-eye-slash"></i>}
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(q._id)}
                                                    className="text-blue-500 hover:text-blue-700"
                                                    title="Edit Quiz"
                                                >
                                                    📝
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(q._id)}
                                                    className="text-red-500 hover:text-red-700"
                                                    title="Delete Quiz"
                                                >
                                                    ❌
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )
            ))}
        </div>
    );
}

export default Home;