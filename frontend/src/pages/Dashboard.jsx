import React, { useState } from "react";
import { Link, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Home from "./dashboard/Home";
import Reports from "./dashboard/Reports";
import Result from "./dashboard/Result";
import CreateQuiz from "./dashboard/CreateQuiz";
import Profile from "./dashboard/Profile";
import AttemptQuiz from "./dashboard/AttemptQuiz";
import EditQuiz from "./dashboard/EditQuiz";
import QuizReport from "./dashboard/QuizReport";
import UserManagement from "./dashboard/UserManagement";
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
                <header className="sm:hidden bg-gray-800 text-white px-4 py-2 flex justify-between items-center shadow-md">
                    <div className="flex items-center gap-2">
                        <Link to="/dashboard/profile" className="relative text-xl text-green-400">
                            <i className="fa-solid fa-circle-user"></i>
                            <div className="absolute inset-[-4px] rounded-full border-2 border-green-400"></div>
                        </Link>
                        <div className="flex-1 overflow-hidden">
                            <h2 className="text-[clamp(0.875rem,2.5vw,1rem)] font-semibold whitespace-normal break-words" title={name}>
                                {name} {surname}
                            </h2>
                            <span className="text-xs text-green-200">Role: {role}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="text-white text-xl focus:outline-none"
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                    >
                        {menuOpen ? "✕" : "☰"}
                    </button>
                </header>
            )}

            {/* Mobile Dropdown Menu */}
            {!isQuizActive && (
                <nav
                    className={`${menuOpen ? "flex" : "hidden"} sm:hidden bg-gray-800 text-white p-3 flex-col gap-2 shadow-md z-10`}
                >
                    <Link
                        to="/dashboard"
                        className={`px-3 py-2 rounded-lg ${isActive("/dashboard") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 flex items-center gap-2 text-sm`}
                        onClick={() => setMenuOpen(false)}
                    >
                        <i className="fa-solid fa-house w-5 text-center"></i> Home
                    </Link>
                    {role === "admin" ? (
                        <>
                            <Link
                                to="/dashboard/create"
                                className={`px-3 py-2 rounded-lg ${isActive("/dashboard/create") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 flex items-center gap-2 text-sm`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <i className="fa-solid fa-plus-square w-5 text-center"></i> Create Quiz
                            </Link>
                            <Link
                                to="/dashboard/reports"
                                className={`px-3 py-2 rounded-lg ${isActive("/dashboard/reports") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 flex items-center gap-2 text-sm`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <i className="fa-solid fa-chart-simple w-5 text-center"></i> Reports
                            </Link>
                            <Link
                                to="/dashboard/users"
                                className={`px-3 py-2 rounded-lg ${isActive("/dashboard/users") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 flex items-center gap-2 text-sm`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <i className="fa-solid fa-users-cog w-5 text-center"></i> User Management
                            </Link>
                        </>
                    ) : (
                        <Link
                            to="/dashboard/result"
                            className={`px-3 py-2 rounded-lg ${isActive("/dashboard/result") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 flex items-center gap-2 text-sm`}
                            onClick={() => setMenuOpen(false)}
                        >
                            <i className="fa-solid fa-chart-simple w-5 text-center"></i> Result
                        </Link>
                    )}
                    <button
                        onClick={handleLogout}
                        className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors duration-200 flex items-center gap-2"
                    >
                        <i className="fa-solid fa-right-from-bracket w-5 text-center"></i> Logout
                    </button>
                </nav>
            )}

            {/* Desktop Sidebar */}
            {!isQuizActive && (
                <aside className="hidden sm:flex w-56 bg-gray-800 text-white flex-col p-4 sticky top-0 h-screen shadow-lg">
                    <div className="flex flex-col items-center mb-4">
                        <Link to="/dashboard/profile" className="relative text-2xl text-green-400 mb-2">
                            <i className="fa-solid fa-circle-user"></i>
                            <div className="absolute inset-[-4px] rounded-full border-2 border-green-400"></div>
                        </Link>
                        <div className="text-center overflow-hidden">
                            <h2 className="text-[clamp(1rem,2vw,1.125rem)] font-semibold whitespace-normal break-words" title={name}>
                                {name} {surname}
                            </h2>
                            <p className="text-xs text-green-200">Role: {role}</p>
                        </div>
                    </div>
                    <nav className="flex flex-col justify-center items-center gap-2 flex-grow">
                        <Link
                            to="/dashboard"
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg w-full ${isActive("/dashboard") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 text-sm`}
                        >
                            <i className="fa-solid fa-house w-5 text-center"></i> Home
                        </Link>
                        {role === "admin" ? (
                            <>
                                <Link
                                    to="/dashboard/create"
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg w-full ${isActive("/dashboard/create") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 text-sm`}
                                >
                                    <i className="fa-solid fa-hexagon-nodes w-5 text-center"></i> Create Quiz
                                </Link>
                                <Link
                                    to="/dashboard/reports"
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg w-full ${isActive("/dashboard/reports") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 text-sm`}
                                >
                                    <i className="fa-solid fa-chart-simple w-5 text-center"></i> Reports
                                </Link>
                                <Link
                                    to="/dashboard/users"
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg w-full ${isActive("/dashboard/users") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 text-sm`}
                                >
                                    <i className="fa-solid fa-users-cog w-5 text-center"></i> User Management
                                </Link>
                            </>
                        ) : (
                            <Link
                                to="/dashboard/result"
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg w-full ${isActive("/dashboard/result") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 text-sm`}
                            >
                                <i className="fa-solid fa-chart-simple w-5 text-center"></i> Result
                            </Link>
                        )}
                    </nav>
                    <button
                        onClick={handleLogout}
                        className="mt-4 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors duration-200 flex items-center gap-2"
                    >
                        <i className="fa-solid fa-right-from-bracket w-5 text-center"></i> Logout
                    </button>
                </aside>
            )}

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6">
                <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm p-4 sm:p-6">
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
                        <Route
                            path="users"
                            element={role === "admin" ? <UserManagement /> : <Navigate to="/dashboard" />}
                        />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;