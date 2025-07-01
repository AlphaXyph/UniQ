import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Popup from "../../components/Popup";
import API from "../../../api";

function Home() {
    const [quizzes, setQuizzes] = useState([]);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, quizId: null });
    const [confirmInput, setConfirmInput] = useState("");
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role;
    const navigate = useNavigate();

    const fetchQuizzes = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await API.get("/quiz/all", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setQuizzes(res.data);
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Error loading quizzes", type: "error" });
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const groupedQuizzes = useMemo(() => {
        const grouped = quizzes
            .slice()
            .sort((a, b) => {
                const dateA = a.createdAt && !isNaN(new Date(a.createdAt).getTime()) ? new Date(a.createdAt) : new Date(0);
                const dateB = b.createdAt && !isNaN(new Date(b.createdAt).getTime()) ? new Date(b.createdAt) : new Date(0);
                return dateB - dateA;
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

        const sortedDates = Object.keys(grouped).sort((a, b) => {
            if (a === "Date Not Available") return 1;
            if (b === "Date Not Available") return -1;
            return new Date(b) - new Date(a);
        });

        return { grouped, sortedDates };
    }, [quizzes]);

    const handleEdit = (quizId) => {
        navigate(`/dashboard/edit/${quizId}`);
    };

    const handleDelete = async (input) => {
        if (input !== "YES") {
            setPopup({ message: "Please type 'YES' to confirm deletion", type: "error" });
            return;
        }
        try {
            const token = localStorage.getItem("token");
            await API.delete(`/quiz/${deleteConfirm.quizId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPopup({ message: "Quiz deleted", type: "success" });
            fetchQuizzes();
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Error deleting quiz", type: "error" });
        }
        setDeleteConfirm({ show: false, quizId: null });
        setConfirmInput("");
    };

    const handleToggleVisibility = async (quizId, isVisible) => {
        try {
            const token = localStorage.getItem("token");
            await API.post(
                `/quiz/toggle-visibility/${quizId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPopup({ message: `Quiz is now ${isVisible ? "hidden" : "visible"}`, type: "success" });
            fetchQuizzes();
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Failed to toggle visibility", type: "error" });
        }
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
        setDeleteConfirm({ show: false, quizId: null });
        setConfirmInput("");
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
            <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6">
                <Popup
                    message={deleteConfirm.show ? "Are you sure you want to delete this quiz?" : popup.message}
                    type={deleteConfirm.show ? "warning" : popup.type}
                    onClose={closePopup}
                    confirmAction={deleteConfirm.show ? handleDelete : null}
                    confirmInput={confirmInput}
                    setConfirmInput={setConfirmInput}
                />
                <h1 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                    <i className="fa-solid fa-list"></i> All Quizzes
                </h1>
                {groupedQuizzes.sortedDates.length === 0 && <p className="text-sm sm:text-base text-gray-600">No quizzes found.</p>}
                {groupedQuizzes.sortedDates.map((date) => (
                    groupedQuizzes.grouped[date] && (
                        <div key={date} className="mb-6 sm:mb-8">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">{date}</h3>
                            <ul className="space-y-3 sm:space-y-4">
                                {groupedQuizzes.grouped[date].map((q) => (
                                    <li key={q._id} className="p-3 sm:p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
                                            <div className="flex-1">
                                                <strong className="text-base sm:text-lg truncate">{q.subject} - {q.title}</strong>
                                                <p className="text-xs sm:text-sm text-blue-500 truncate">Posted by: {q.createdBy?.email || "Unknown"}</p>
                                                <p className="text-xs sm:text-sm text-gray-600">
                                                    Total Questions: {q.questions.length} | Total Time: {q.timer} minutes
                                                    {role === "admin" && (
                                                        <span> | Status: {q.isVisible ? "Visible" : "Hidden"}</span>
                                                    )}
                                                </p>
                                                {role === "user" && q.isVisible ? (
                                                    <Link to={`/dashboard/attempt/${q._id}`} className="text-blue-600 hover:underline text-xs sm:text-sm">
                                                        Attempt Quiz
                                                    </Link>
                                                ) : role === "admin" ? (
                                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2 sm:mt-0">
                                                        <Link to={`/dashboard/attempt/${q._id}`} className="text-blue-600 hover:underline text-xs sm:text-sm">
                                                            View Quiz
                                                        </Link>
                                                        <Link to={`/dashboard/quiz/${q._id}/report`} className="text-green-600 hover:underline text-xs sm:text-sm">
                                                            View Report
                                                        </Link>
                                                    </div>
                                                ) : null}
                                            </div>
                                            {role === "admin" && (
                                                <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-0">
                                                    <button
                                                        onClick={() => handleToggleVisibility(q._id, q.isVisible)}
                                                        className={`text-${q.isVisible ? "gray" : "green"}-500 hover:text-${q.isVisible ? "gray" : "green"}-700 text-xs sm:text-sm`}
                                                        title={q.isVisible ? "Hide Quiz" : "Show Quiz"}
                                                    >
                                                        {q.isVisible ? <i className="fas fa-eye"></i> : <i className="fas fa-eye-slash"></i>}
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(q._id)}
                                                        className="text-blue-500 hover:text-blue-700 text-xs sm:text-sm"
                                                        title="Edit Quiz"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm({ show: true, quizId: q._id })}
                                                        className="text-red-500 hover:text-red-700 text-xs sm:text-sm"
                                                        title="Delete Quiz"
                                                    >
                                                        <i className="fas fa-trash"></i>
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
        </div>
    );
}

export default Home;