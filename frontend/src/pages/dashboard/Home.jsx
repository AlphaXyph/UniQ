import React, { useEffect, useState } from "react";
import API from "../../../api";
import { Link, useNavigate } from "react-router-dom";
import Popup from "../../components/popup";

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
            setQuizzes(res.data);
        } catch (err) {
            console.error("Fetch quizzes error:", err.response?.data || err.message);
            setPopup({ message: err.response?.data?.msg || "Error loading quizzes", type: "error" });
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, []);

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

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
    };

    const closeDeleteConfirm = () => {
        setDeleteConfirm({ show: false, quizId: null });
    };

    return (
        <div className="relative">
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
            <ul className="space-y-2">
                {quizzes.map((q) => (
                    <li key={q._id} className="p-4 border rounded bg-white relative">
                        <div className="flex justify-between items-center">
                            <div>
                                <strong className="text-lg">{q.subject} - {q.title}</strong>
                                <p className="text-sm text-blue-500">Posted by: {q.createdBy?.email || "Unknown"}</p>
                                <p className="text-sm text-gray-600">Total Questions: {q.questions.length} | Total Time: {q.timer} minutes</p>
                                {role === "user" ? (
                                    <Link to={`/dashboard/attempt/${q._id}`} className="text-blue-600 underline">
                                        Attempt Quiz
                                    </Link>
                                ) : (
                                    <Link to={`/dashboard/attempt/${q._id}`} className="text-blue-600 underline">
                                        View Quiz
                                    </Link>
                                )}
                            </div>
                            {role === "admin" && (
                                <div className="flex gap-2">
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
    );
}

export default Home;