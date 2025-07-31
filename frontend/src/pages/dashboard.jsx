import React, { useState, useEffect, useCallback } from "react";
import { Link, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Home from "./dashboard/common/home";
import AllReports from "./dashboard/admin/allReports";
import Result from "./dashboard/user/result";
import CreateQuiz from "./dashboard/admin/createQuiz";
import Profile from "./dashboard/common/profile";
import AttemptQuiz from "./dashboard/user/attemptQuiz";
import EditQuiz from "./dashboard/admin/editQuiz";
import QuizReport from "./dashboard/admin/quizReport";
import UserManagement from "./dashboard/admin/userManagement";
import ViewAnswers from "./dashboard/common/viewAnswers";
import Popup from "../components/popup";
import api from "../../api";

function Dashboard() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [isQuizActive, setIsQuizActive] = useState(false);
    const [adminUrlData, setAdminUrlData] = useState({ url: "", expiresAt: null, isActive: true });
    const [timeLeft, setTimeLeft] = useState("");
    const [isExpired, setIsExpired] = useState(false);
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const role = user?.role || "user";
    const name = user?.name || "User";
    const surname = user?.surname || "";
    const location = useLocation();

    const fetchAdminUrl = useCallback(async () => {
        try {
            console.log("Dashboard: Fetching Admin Register URL...");
            const response = await api.get("/admin-register-url");
            console.log("Dashboard: Admin Register URL response:", response.data);
            setAdminUrlData(response.data);
            setTimeLeft("");
            setIsExpired(false);
            return true;
        } catch (err) {
            console.error("Dashboard: Error fetching Admin Register URL:", err.response?.data || err.message);
            if (err.response?.status === 401) {
                setPopup({ message: "Session expired, please log in again", type: "error" });
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setTimeout(() => navigate("/"), 2000);
            } else {
                setPopup({ message: err.response?.data?.msg || "Failed to fetch Admin Register URL", type: "error" });
            }
            return false;
        }
    }, [navigate]);

    const regenerateUrl = useCallback(async () => {
        try {
            console.log("Dashboard: Regenerating Admin Register URL...");
            const response = await api.post("/admin-register-url/regenerate");
            console.log("Dashboard: Regenerate URL response:", response.data);
            setAdminUrlData(response.data);
            setIsExpired(false);
            setPopup({ message: "Admin Register URL regenerated successfully", type: "success" });
            setTimeLeft("");
            return true;
        } catch (err) {
            console.error("Dashboard: Error regenerating Admin Register URL:", err.response?.data || err.message);
            if (err.response?.status === 401) {
                setPopup({ message: "Session expired, please log in again", type: "error" });
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setTimeout(() => navigate("/"), 2000);
            } else {
                setPopup({ message: err.response?.data?.msg || "Failed to regenerate Admin Register URL", type: "error" });
            }
            return false;
        }
    }, [navigate]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        console.log("Dashboard: Token:", token);
        if (!token) {
            console.log("Dashboard: No token found, redirecting to login...");
            setPopup({ message: "Please log in again", type: "error" });
            setTimeout(() => navigate("/"), 2000);
            return;
        }
        if (role === "admin") {
            fetchAdminUrl();
        }
    }, [role, navigate, fetchAdminUrl]);

    useEffect(() => {
        if (!adminUrlData.expiresAt || isExpired) return;

        const timer = setInterval(() => {
            const now = new Date();
            const expires = new Date(adminUrlData.expiresAt);
            const diff = expires - now;

            if (diff <= 0 && !isExpired) {
                console.log("Dashboard: URL expired, regenerating...");
                setTimeLeft("Expired");
                setIsExpired(true);
                if (role === "admin") {
                    regenerateUrl().then((success) => {
                        if (success) {
                            console.log("Dashboard: URL regenerated successfully");
                            setPopup({ message: "Admin Register URL regenerated automatically", type: "success" });
                        } else {
                            console.error("Dashboard: Failed to regenerate URL on expiration");
                            setPopup({ message: "Failed to regenerate Admin Register URL", type: "error" });
                        }
                    });
                }
            } else if (diff > 0) {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => {
            console.log("Dashboard: Clearing timer");
            clearInterval(timer);
        };
    }, [adminUrlData.expiresAt, role, isExpired, regenerateUrl]);

    const toggleActive = async () => {
        try {
            console.log("Dashboard: Toggling admin registration status...");
            const response = await api.post("/admin-register-url/toggle-active");
            console.log("Dashboard: Toggle active response:", response.data);
            setAdminUrlData(response.data);
            setPopup({
                message: `Admin registration page ${response.data.isActive ? "resumed" : "paused"}`,
                type: "success",
            });
        } catch (err) {
            console.error("Dashboard: Error toggling admin registration:", err.response?.data || err.message);
            if (err.response?.status === 401) {
                setPopup({ message: "Session expired, please log in again", type: "error" });
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setTimeout(() => navigate("/"), 2000);
            } else {
                setPopup({ message: err.response?.data?.msg || "Failed to toggle admin registration", type: "error" });
            }
        }
    };

    const copyUrl = async () => {
        if (!adminUrlData.url) {
            setPopup({ message: "No URL available to copy", type: "error" });
            return;
        }
        try {
            await navigator.clipboard.writeText(`${import.meta.env.VITE_BASE_URL}${adminUrlData.url}`);
            setPopup({ message: "Admin Register URL copied to clipboard", type: "success" });
        } catch (err) {
            console.error("Dashboard: Error copying URL:", err);
            setPopup({ message: "Failed to copy URL", type: "error" });
        }
    };

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
                <header className="md:hidden bg-gray-800 text-white px-4 py-3 flex justify-between items-center shadow-md fixed top-0 left-0 right-0 z-20">
                    <div className="flex items-center gap-2 min-w-0">
                        <Link
                            to="/dashboard/profile"
                            className="relative text-green-400 text-xl w-8 h-8 flex items-center justify-center flex-shrink-0"
                        >
                            <i className="fa-solid fa-circle-user"></i>
                            <div className="absolute inset-0.5 rounded-full border-2 border-green-400 pointer-events-none"></div>
                        </Link>
                        <div className="flex-1 min-w-0">
                            <h2
                                className="text-sm font-semibold truncate"
                                title={`${name} ${surname}`}
                            >
                                {name} {surname}
                            </h2>
                            <span className="text-xs text-green-200">Role: {role}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="text-white text-lg focus:outline-none flex-shrink-0 min-h-[40px]"
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                    >
                        {menuOpen ? "✕" : "☰"}
                    </button>
                </header>
            )}

            {/* Mobile Sidebar */}
            {!isQuizActive && (
                <nav
                    className={`${menuOpen ? "translate-x-0" : "-translate-x-full"
                        } md:hidden bg-gray-800 text-white px-3 pt-[4.5rem] pb-4 flex flex-col gap-3 shadow-md fixed top-0 left-0 z-10 w-64 h-[100svh] max-h-[100svh] transition-transform duration-300 ease-in-out overflow-y-auto`}
                >
                    <div className="flex flex-col gap-2">
                        <Link
                            to="/dashboard"
                            className={`px-3 py-2 rounded-lg text-sm min-h-[40px] ${isActive("/dashboard") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"
                                } transition-colors duration-200 flex items-center gap-2 w-full`}
                            onClick={() => setMenuOpen(false)}
                        >
                            <i className="fa-solid fa-house w-5 text-center"></i> Home
                        </Link>
                        {role === "admin" ? (
                            <>
                                <Link
                                    to="/dashboard/create"
                                    className={`px-3 py-2 rounded-lg text-sm min-h-[40px] ${isActive("/dashboard/create") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"
                                        } transition-colors duration-200 flex items-center gap-2 w-full`}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <i className="fa-solid fa-hexagon-nodes w-5 text-center"></i> Create Quiz
                                </Link>
                                <Link
                                    to="/dashboard/allreports"
                                    className={`px-3 py-2 rounded-lg text-sm min-h-[40px] ${isActive("/dashboard/allreports") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"
                                        } transition-colors duration-200 flex items-center gap-2 w-full`}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <i className="fa-solid fa-chart-simple w-5 text-center"></i> Reports
                                </Link>
                                <Link
                                    to="/dashboard/users"
                                    className={`px-3 py-2 rounded-lg text-sm min-h-[40px] ${isActive("/dashboard/users") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"
                                        } transition-colors duration-200 flex items-center gap-2 w-full`}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <i className="fa-solid fa-users-cog w-5 text-center"></i> User Management
                                </Link>
                            </>
                        ) : (
                            <Link
                                to="/dashboard/result"
                                className={`px-3 py-2 rounded-lg text-sm min-h-[40px] ${isActive("/dashboard/result") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"
                                    } transition-colors duration-200 flex items-center gap-2 w-full`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <i className="fa-solid fa-chart-simple w-5 text-center"></i> Result
                            </Link>
                        )}
                    </div>
                    <div className="mt-auto flex flex-col gap-2 pt-2 border-t border-gray-700 min-h-[120px]">
                        {role === "admin" && (
                            <div className="px-3 py-2 bg-gray-900 rounded-lg w-full">
                                <p className="text-xs text-green-300 truncate max-w-[85%]">
                                    Admin Register URL:
                                </p>
                                <p className="text-xs text-white max-w-[85%]">
                                    {adminUrlData.url || "Not set"}
                                </p>
                                <p className="text-xs text-green-200 mt-1">
                                    Expires in: {timeLeft || "N/A"}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                    <button
                                        onClick={fetchAdminUrl}
                                        className="text-green-300 hover:text-green-400 text-sm transition-colors duration-200 w-5 text-center"
                                        title="Get Admin Register URL"
                                    >
                                        <i className="fa-solid fa-link"></i>
                                    </button>
                                    <button
                                        onClick={copyUrl}
                                        className={`text-green-300 hover:text-green-400 text-sm transition-colors duration-200 w-5 text-center ${!adminUrlData.url ? "opacity-50 cursor-not-allowed" : ""
                                            }`}
                                        title="Copy Admin Register URL"
                                        disabled={!adminUrlData.url}
                                    >
                                        <i className="fa-solid fa-copy"></i>
                                    </button>
                                    <button
                                        onClick={regenerateUrl}
                                        className="text-green-300 hover:text-green-400 text-sm transition-colors duration-200 w-5 text-center"
                                        title="Regenerate URL"
                                    >
                                        <i className="fa-solid fa-sync-alt"></i>
                                    </button>
                                    <button
                                        onClick={toggleActive}
                                        className="text-green-300 hover:text-green-400 text-sm transition-colors duration-200 w-5 text-center"
                                        title={adminUrlData.isActive ? "Pause Registration" : "Resume Registration"}
                                    >
                                        <i className={adminUrlData.isActive ? "fa-solid fa-pause" : "fa-solid fa-play"}></i>
                                    </button>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors duration-200 flex items-center gap-2 w-full min-h-[40px]"
                        >
                            <i className="fa-solid fa-right-from-bracket w-5 text-center"></i> Logout
                        </button>
                    </div>
                </nav>
            )}
            {/* Desktop Sidebar */}
            {!isQuizActive && (
                <aside className="hidden md:flex w-56 bg-gray-800 text-white flex-col p-4 fixed top-0 left-0 h-screen shadow-lg z-10">
                    <div className="flex flex-col items-center mb-4">
                        <Link
                            to="/dashboard/profile"
                            className="relative w-10 h-10 text-xl text-white mb-2 flex items-center justify-center"
                        >
                            <i className="fa-solid fa-circle-user"></i>
                            <div className="absolute inset-0.5 rounded-full border-2 border-green-300 pointer-events-none"></div>
                        </Link>
                        <div className="text-center w-full">
                            <h2
                                className="text-sm font-semibold truncate"
                                title={`${name} ${surname}`}
                            >
                                {name} {surname}
                            </h2>
                            <p className="text-xs text-green-200">Role: {role}</p>
                        </div>
                    </div>
                    <nav className="flex flex-col flex-grow justify-center gap-2 w-full">
                        <Link
                            to="/dashboard"
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm min-h-[40px] ${isActive("/dashboard") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"
                                } transition-colors duration-200`}
                        >
                            <i className="fa-solid fa-house w-5 text-center"></i> Home
                        </Link>
                        {role === "admin" ? (
                            <>
                                <Link
                                    to="/dashboard/create"
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm min-h-[40px] ${isActive("/dashboard/create") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"
                                        } transition-colors duration-200`}
                                >
                                    <i className="fa-solid fa-hexagon-nodes w-5 text-center"></i> Create Quiz
                                </Link>
                                <Link
                                    to="/dashboard/allreports"
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm min-h-[40px] ${isActive("/dashboard/allreports") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"
                                        } transition-colors duration-200`}
                                >
                                    <i className="fa-solid fa-chart-simple w-5 text-center"></i> Reports
                                </Link>
                                <Link
                                    to="/dashboard/users"
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm min-h-[40px] ${isActive("/dashboard/users") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"
                                        } transition-colors duration-200`}
                                >
                                    <i className="fa-solid fa-users-cog w-5 text-center"></i> User Management
                                </Link>
                            </>
                        ) : (
                            <Link
                                to="/dashboard/result"
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm min-h-[40px] ${isActive("/dashboard/result") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"
                                    } transition-colors duration-200`}
                            >
                                <i className="fa-solid fa-chart-simple w-5 text-center"></i> Result
                            </Link>
                        )}
                    </nav>
                    <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-gray-700 min-h-[120px]">
                        {role === "admin" && (
                            <div className="px-3 py-2 bg-gray-900 rounded-lg w-full">
                                <p className="text-xs text-green-300 truncate max-w-[85%]">
                                    Admin Register URL:
                                </p>
                                <p className="text-xs text-white max-w-[85%]">
                                    {adminUrlData.url || "Not set"}
                                </p>
                                <p className="text-xs text-green-200 mt-1">
                                    Expires in: {timeLeft || "N/A"}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                    <button
                                        onClick={fetchAdminUrl}
                                        className="text-green-300 hover:text-green-400 text-sm transition-colors duration-200 w-5 text-center"
                                        title="Get Admin Register URL"
                                    >
                                        <i className="fa-solid fa-link"></i>
                                    </button>
                                    <button
                                        onClick={copyUrl}
                                        className={`text-green-300 hover:text-green-400 text-sm transition-colors duration-200 w-5 text-center ${!adminUrlData.url ? "opacity-50 cursor-not-allowed" : ""
                                            }`}
                                        title="Copy Admin Register URL"
                                        disabled={!adminUrlData.url}
                                    >
                                        <i className="fa-solid fa-copy"></i>
                                    </button>
                                    <button
                                        onClick={regenerateUrl}
                                        className="text-green-300 hover:text-green-400 text-sm transition-colors duration-200 w-5 text-center"
                                        title="Regenerate URL"
                                    >
                                        <i className="fa-solid fa-sync-alt"></i>
                                    </button>
                                    <button
                                        onClick={toggleActive}
                                        className="text-green-300 hover:text-green-400 text-sm transition-colors duration-200 w-5 text-center"
                                        title={adminUrlData.isActive ? "Pause Registration" : "Resume Registration"}
                                    >
                                        <i className={adminUrlData.isActive ? "fa-solid fa-pause" : "fa-solid fa-play"}></i>
                                    </button>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors duration-200 flex items-center gap-2 w-full min-h-[40px]"
                        >
                            <i className="fa-solid fa-right-from-bracket w-5 text-center"></i> Logout
                        </button>
                    </div>
                </aside>
            )}

            {/* Main Content */}
            <main
                className={`flex-1 p-4 w-full ${isQuizActive ? "pt-0" : "pt-[3.5rem] md:pt-4 md:pl-60"}`}
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
                        <Route
                            path="attempt/:quizId"
                            element={<AttemptQuiz setIsQuizActive={setIsQuizActive} />}
                        />
                        <Route
                            path="quiz/:quizId/report"
                            element={role === "admin" ? <QuizReport /> : <Navigate to="/dashboard" />}
                        />
                        <Route path="profile" element={<Profile />} />
                        <Route
                            path="users"
                            element={role === "admin" ? <UserManagement /> : <Navigate to="/dashboard" />}
                        />
                        <Route path="view-answers/:resultId" element={<ViewAnswers />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;