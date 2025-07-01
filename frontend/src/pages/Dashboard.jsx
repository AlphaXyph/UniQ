import React, { useState } from "react";
import { Link, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Home from "./dashboard/Home";
import AllReports from "./dashboard/AllReports";
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
    const surname = user?.surname || "";
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
        <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
            <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            {/* Mobile Top Bar */}
            {!isQuizActive && (
                <header className="md:hidden bg-gray-800 text-white px-4 py-4 flex justify-between items-center shadow-md fixed top-0 left-0 right-0 z-20">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link
                            to="/dashboard/profile"
                            className="relative text-green-400 text-xl w-10 h-10 flex items-center justify-center flex-shrink-0"
                        >
                            <i className="fa-solid fa-circle-user"></i>
                            <div className="absolute inset-0.5 rounded-full border-2 border-green-400 pointer-events-none"></div>
                        </Link>
                        <div className="flex-1 min-w-0">
                            <h2
                                className="text-base font-semibold truncate"
                                title={`${name} ${surname}`}
                            >
                                {name} {surname}
                            </h2>
                            <span className="text-sm text-green-200">Role: {role}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="text-white text-xl focus:outline-none flex-shrink-0 min-h-[44px]"
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                    >
                        {menuOpen ? "✕" : "☰"}
                    </button>
                </header>
            )}

            {/* Mobile Dropdown Menu */}
            {!isQuizActive && (
                <nav
                    className={`${menuOpen ? "block" : "hidden"
                        } md:hidden bg-gray-800 text-white px-4 pt-[4rem] pb-4 flex flex-col gap-3 shadow-md fixed top-0 left-0 right-0 z-10 overflow-y-auto h-[calc(100vh-4rem)]`}
                >
                    <Link
                        to="/dashboard"
                        className={`px-4 py-3 rounded-lg text-base min-h-[44px] ${isActive("/dashboard") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"
                            } transition-colors duration-200 flex items-center gap-3 w-full`}
                        onClick={() => setMenuOpen(false)}
                    >
                        <i className="fa-solid fa-house w-5 text-center"></i> Home
                    </Link>
                    {role === "admin" ? (
                        <>
                            <Link
                                to="/dashboard/create"
                                className={`px-4 py-3 rounded-lg text-base min-h-[44px] ${isActive("/dashboard/create")
                                        ? "bg-gray-900 text-green-400"
                                        : "hover:bg-gray-600 hover:text-white"
                                    } transition-colors duration-200 flex items-center gap-3 w-full`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <i className="fa-solid fa-plus-square w-5 text-center"></i> Create Quiz
                            </Link>
                            <Link
                                to="/dashboard/allreports"
                                className={`px-4 py-3 rounded-lg text-base min-h-[44px] ${isActive("/dashboard/allreports")
                                        ? "bg-gray-900 text-green-400"
                                        : "hover:bg-gray-600 hover:text-white"
                                    } transition-colors duration-200 flex items-center gap-3 w-full`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <i className="fa-solid fa-chart-simple w-5 text-center"></i> Reports
                            </Link>
                            <Link
                                to="/dashboard/users"
                                className={`px-4 py-3 rounded-lg text-base min-h-[44px] ${isActive("/dashboard/users")
                                        ? "bg-gray-900 text-green-400"
                                        : "hover:bg-gray-600 hover:text-white"
                                    } transition-colors duration-200 flex items-center gap-3 w-full`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <i className="fa-solid fa-users-cog w-5 text-center"></i> User Management
                            </Link>
                        </>
                    ) : (
                        <Link
                            to="/dashboard/result"
                            className={`px-4 py-3 rounded-lg text-base min-h-[44px] ${isActive("/dashboard/result")
                                    ? "bg-gray-900 text-green-400"
                                    : "hover:bg-gray-600 hover:text-white"
                                } transition-colors duration-200 flex items-center gap-3 w-full`}
                            onClick={() => setMenuOpen(false)}
                        >
                            <i className="fa-solid fa-chart-simple w-5 text-center"></i> Result
                        </Link>
                    )}
                    <button
                        onClick={handleLogout}
                        className="px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white text-base font-semibold transition-colors duration-200 flex items-center gap-3 w-full min-h-[44px]"
                    >
                        <i className="fa-solid fa-right-from-bracket w-5 text-center"></i> Logout
                    </button>
                </nav>
            )}

            {/* Desktop Sidebar */}
            {!isQuizActive && (
                <aside className="hidden md:flex w-[12rem] lg:w-[16rem] xl:w-[18rem] bg-gray-800 text-white flex-col p-4 fixed top-0 left-0 h-screen shadow-lg z-10">
                    <div className="flex flex-col items-center mb-6">
                        <Link
                            to="/dashboard/profile"
                            className="relative w-12 h-12 text-2xl text-white mb-3 flex items-center justify-center"
                        >
                            <i className="fa-solid fa-circle-user"></i>
                            <div className="absolute inset-1 rounded-full border-2 border-green-300 pointer-events-none"></div>
                        </Link>
                        <div className="text-center w-full">
                            <h2
                                className="text-base font-semibold truncate"
                                title={`${name} ${surname}`}
                            >
                                {name} {surname}
                            </h2>
                            <p className="text-sm text-green-200">Role: {role}</p>
                        </div>
                    </div>
                    <nav className="flex flex-col justify-center items-center gap-3 flex-grow w-full">
                        <Link
                            to="/dashboard"
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg w-full text-sm min-h-[44px] ${isActive("/dashboard") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"
                                } transition-colors duration-200`}
                        >
                            <i className="fa-solid fa-house w-5 text-center"></i> Home
                        </Link>
                        {role === "admin" ? (
                            <>
                                <Link
                                    to="/dashboard/create"
                                    className={`flex items-center gap-3 px-4 py-2 rounded-lg w-full text-sm min-h-[44px] ${isActive("/dashboard/create")
                                            ? "bg-gray-900 text-green-400"
                                            : "hover:bg-gray-600 hover:text-white"
                                        } transition-colors duration-200`}
                                >
                                    <i className="fa-solid fa-hexagon-nodes w-5 text-center"></i> Create Quiz
                                </Link>
                                <Link
                                    to="/dashboard/allreports"
                                    className={`flex items-center gap-3 px-4 py-2 rounded-lg w-full text-sm min-h-[44px] ${isActive("/dashboard/allreports")
                                            ? "bg-gray-900 text-green-400"
                                            : "hover:bg-gray-600 hover:text-white"
                                        } transition-colors duration-200`}
                                >
                                    <i className="fa-solid fa-chart-simple w-5 text-center"></i> Reports
                                </Link>
                                <Link
                                    to="/dashboard/users"
                                    className={`flex items-center gap-3 px-4 py-2 rounded-lg w-full text-sm min-h-[44px] ${isActive("/dashboard/users")
                                            ? "bg-gray-900 text-green-400"
                                            : "hover:bg-gray-600 hover:text-white"
                                        } transition-colors duration-200`}
                                >
                                    <i className="fa-solid fa-users-cog w-5 text-center"></i> User Management
                                </Link>
                            </>
                        ) : (
                            <Link
                                to="/dashboard/result"
                                className={`flex items-center gap-3 px-4 py-2 rounded-lg w-full text-sm min-h-[44px] ${isActive("/dashboard/result")
                                        ? "bg-gray-900 text-green-400"
                                        : "hover:bg-gray-600 hover:text-white"
                                    } transition-colors duration-200`}
                            >
                                <i className="fa-solid fa-chart-simple w-5 text-center"></i> Result
                            </Link>
                        )}
                    </nav>
                    <button
                        onClick={handleLogout}
                        className="mt-6 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors duration-200 flex items-center gap-3 w-full min-h-[44px]"
                    >
                        <i className="fa-solid fa-right-from-bracket w-5 text-center"></i> Logout
                    </button>
                </aside>
            )}

            {/* Main Content */}
            <main
                className={`flex-1 p-4 w-full ${isQuizActive
                        ? "pt-0"
                        : "pt-[4rem] md:pt-4 md:pl-[13rem] lg:pl-[17rem] xl:pl-[19rem]"
                    }`}
            >
                <div className="w-full max-w-full sm:max-w-5xl mx-auto bg-white rounded-lg shadow-sm p-4 md:p-6">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route
                            path="create"
                            element={role === "admin" ? <CreateQuiz /> : <Navigate to="/dashboard" />}
                        />
                        <Route
                            path="allreports"
                            element={role === "admin" ? <AllReports /> : <Navigate to="/dashboard" />}
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
                        <Route
                            path="quiz/:quizId/report"
                            element={role === "admin" ? <QuizReport /> : <Navigate to="/dashboard" />}
                        />
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