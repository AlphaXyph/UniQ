import React, { useState } from "react";
import { Link, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Home from "./dashboard/Home";
import Reports from "./dashboard/Reports";
import Result from "./dashboard/Result";
import CreateQuiz from "./dashboard/createQuiz";
import Profile from "./dashboard/Profile";
import AttemptQuiz from "./dashboard/AttemptQuiz";
import EditQuiz from "./dashboard/EditQuiz";
import QuizReport from "./dashboard/QuizReport";
import Popup from "../components/Popup";

function Dashboard() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [isQuizActive, setIsQuizActive] = useState(false);
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const role = user?.role || "user";
    const name = user?.name || "User";
    const surname = user?.surname || "Surname";
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setPopup({ message: "Logged out successfully!", type: "success" });
        setTimeout(() => navigate("/"), 2000);
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col sm:flex-row">
            <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            {/* Mobile Top Bar */}
            {!isQuizActive && (
                <header className="sm:hidden bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
                    <div className="flex items-center gap-2">
                        <Link to="/dashboard/profile" className="text-xl">
                            <i className="fa-solid mx-2 fa-circle-user"></i>
                        </Link>
                        <div className="flex-1 overflow-hidden">
                            <h2 className="text-[clamp(0.875rem,2.5vw,1rem)] font-bold whitespace-normal break-words" title={name}>
                                {name} {surname}
                            </h2>
                            <span className="text-xs text-yellow-200">Role: {role}</span>
                        </div>
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
                    className={`${menuOpen ? "flex" : "hidden"} sm:hidden bg-gray-800 text-white p-4 border-b border-blue-800 shadow-md z-10 flex-col hike-gap-2`}
                >
                    <Link
                        to="/dashboard"
                        className={`px-4 py-2 rounded-lg ${isActive("/dashboard") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 flex items-center gap-2`}
                        onClick={() => setMenuOpen(false)}
                    >
                        <i className="fa-solid fa-house"></i> Home
                    </Link>
                    {role === "admin" ? (
                        <>
                            <Link
                                to="/dashboard/create"
                                className={`px-4 py-2 rounded-lg ${isActive("/dashboard/create") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 flex items-center gap-2`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <i className="fa-solid fa-hexagon-nodes"></i> Create Quiz
                            </Link>
                            <Link
                                to="/dashboard/reports"
                                className={`px-4 py-2 rounded-lg ${isActive("/dashboard/reports") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 flex items-center gap-2`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <i className="fa-solid fa-chart-simple"></i> Reports
                            </Link>
                        </>
                    ) : (
                        <Link
                            to="/dashboard/result"
                            className={`px-4 py-2 rounded-lg ${isActive("/dashboard/result") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 flex items-center gap-2`}
                            onClick={() => setMenuOpen(false)}
                        >
                            <i className="fa-solid fa-chart-simple"></i> Result
                        </Link>
                    )}
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors duration-200 mt-2"
                    >
                        <i className="fa-solid fa-right-from-bracket"></i> Logout
                    </button>
                </nav>
            )}

            {/* Desktop Sidebar */}
            {!isQuizActive && (
                <aside className="hidden sm:flex w-64 bg-gray-800 text-white flex-col p-6 sticky top-0 h-screen shadow-lg transition-all duration-300 ease-in-out z-10">
                    <div className="flex flex-col items-center mb-6">
                        <Link to="/dashboard/profile" className="text-2xl mb-2">
                            <i className="fa-solid fa-circle-user"></i>
                        </Link>
                        <div className="text-center overflow-hidden">
                            <h2 className="text-[clamp(1rem,2vw,1.25rem)] font-bold whitespace-normal break-words" title={name}>
                                {name} {surname}
                            </h2>
                            <p className="text-sm text-green-200">Role: {role}</p>
                        </div>
                    </div>
                    <nav className="flex flex-col justify-center items-center gap-4 flex-grow">
                        <Link
                            to="/dashboard"
                            className={`flex items-center gap-3 p-3 rounded-lg w-full ${isActive("/dashboard") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200`}
                        >
                            <i className="fa-solid fa-house" style={{ width: "20px", textAlign: "center" }}></i> Home
                        </Link>
                        {role === "admin" ? (
                            <>
                                <Link
                                    to="/dashboard/create"
                                    className={`flex items-center gap-3 p-3 rounded-lg w-full ${isActive("/dashboard/create") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200`}
                                >
                                    <i className="fa-solid fa-hexagon-nodes" style={{ width: "20px", textAlign: "center" }}></i> Create Quiz
                                </Link>
                                <Link
                                    to="/dashboard/reports"
                                    className={`flex items-center gap-3 p-3 rounded-lg w-full ${isActive("/dashboard/reports") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200`}
                                >
                                    <i className="fa-solid fa-chart-simple" style={{ width: "20px", textAlign: "center" }}></i> Reports
                                </Link>
                            </>
                        ) : (
                            <Link
                                to="/dashboard/result"
                                className={`flex items-center gap-3 p-3 rounded-lg w-full ${isActive("/dashboard/result") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200`}
                            >
                                <i className="fa-solid fa-chart-simple" style={{ width: "20px", textAlign: "center" }}></i> Result
                            </Link>
                        )}
                    </nav>
                    <button
                        onClick={handleLogout}
                        className="mt-6 p-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-left transition-colors duration-200 flex items-center gap-2 w-full"
                    >
                        <i className="fa-solid fa-right-from-bracket"></i> Logout
                    </button>
                </aside>
            )}

            {/* Main Content */}
            <main className="flex-1 p-6">
                <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
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
                        <Route path="quiz/:quizId/report" element={role === "admin" ? <QuizReport /> : <Navigate to="/dashboard" />} />
                        <Route path="profile" element={<Profile />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;