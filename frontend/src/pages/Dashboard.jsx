import React, { useState } from "react";
import { Link, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Home from "./dashboard/Home";
import Reports from "./dashboard/Reports";
import Result from "./dashboard/Result";
import CreateQuiz from "./dashboard/createQuiz";
import AttemptQuiz from "./dashboard/AttemptQuiz";
import EditQuiz from "./dashboard/EditQuiz";
import Popup from "../components/popup";

function Dashboard() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [isQuizActive, setIsQuizActive] = useState(false);
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role || "user";

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setPopup({ message: "Logged out successfully!", type: "success" });
        setTimeout(() => navigate("/"), 2000);
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
    };

    return (
        <div className="relative flex min-h-screen bg-gray-100 flex-col sm:flex-row">
            <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            {/* Mobile Top Bar Toggle Button */}
            {!isQuizActive && (
                <header className="sm:hidden p-4 bg-blue-700 text-white flex justify-between items-center shadow-md">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold">UniQ</h2>
                        <span className="text-sm text-yellow-200 mb-2">Role: {role}</span>
                    </div>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="text-white text-2xl focus:outline-none"
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                    >
                        {menuOpen ? "✕" : "☰"}
                    </button>
                </header>
            )}

            {/* Mobile Dropdown Menu */}
            {!isQuizActive && (
                <nav
                    className={`${menuOpen ? "flex" : "hidden"
                        } sm:hidden bg-blue-700 text-white p-4 border-b border-blue-800 shadow-md z-10 flex-col gap-2`}
                >
                    <Link
                        to="/dashboard"
                        className="px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-yellow-300 transition-colors duration-200 text-base"
                        onClick={() => setMenuOpen(false)}
                    >
                        Home
                    </Link>
                    {role === "admin" ? (
                        <>
                            <Link
                                to="/dashboard/create"
                                className="px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-yellow-300 transition-colors duration-200 text-base"
                                onClick={() => setMenuOpen(false)}
                            >
                                Create Quiz
                            </Link>
                            <Link
                                to="/dashboard/reports"
                                className="px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-yellow-300 transition-colors duration-200 text-base"
                                onClick={() => setMenuOpen(false)}
                            >
                                Reports
                            </Link>
                        </>
                    ) : (
                        <Link
                            to="/dashboard/result"
                            className="px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-yellow-300 transition-colors duration-200 text-base"
                            onClick={() => setMenuOpen(false)}
                        >
                            Result
                        </Link>
                    )}
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors duration-200 text-base"
                    >
                        Logout
                    </button>
                </nav>
            )}

            {/* Desktop Sidebar */}
            {!isQuizActive && (
                <aside className="hidden sm:flex w-64 bg-blue-700 text-white flex-col p-6 sticky top-0 h-screen shadow-lg transition-all duration-300 ease-in-out z-10">
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold text-yellow-300">UniQ</h2>
                        <p className="text-sm text-yellow-200 mt-1">Role: {role}</p>
                    </div>
                    <div className="flex flex-col flex-1 justify-center">
                        <nav className="flex flex-col gap-2 text-lg">
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-600 hover:text-yellow-300 transition-colors duration-200"
                            >
                                🏠 Home
                            </Link>
                            {role === "admin" ? (
                                <>
                                    <Link
                                        to="/dashboard/create"
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-600 hover:text-yellow-300 transition-colors duration-200"
                                    >
                                        ➕ Create Quiz
                                    </Link>
                                    <Link
                                        to="/dashboard/reports"
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-600 hover:text-yellow-300 transition-colors duration-200"
                                    >
                                        📊 Reports
                                    </Link>
                                </>
                            ) : (
                                <Link
                                    to="/dashboard/result"
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-600 hover:text-yellow-300 transition-colors duration-200"
                                >
                                    📋 Result
                                </Link>
                            )}
                        </nav>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-4 p-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-left transition-colors duration-200"
                    >
                        🚪 Logout
                    </button>
                </aside>
            )}

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route
                            path="create"
                            element={role === "admin" ? <CreateQuiz /> : <Navigate to="/dashboard" />}
                        />
                        <Route
                            path="reports"
                            element={role === "admin" ? <Reports /> : <Navigate to="/dashboard" />}
                        />
                        <Route
                            path="result"
                            element={role === "user" ? <Result /> : <Navigate to="/dashboard" />}
                        />
                        <Route
                            path="edit/:quizId"
                            element={role === "admin" ? <EditQuiz /> : <Navigate to="/dashboard" />}
                        />
                        <Route path="attempt/:quizId" element={<AttemptQuiz setIsQuizActive={setIsQuizActive} />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;