import React, { useState, useEffect, useCallback } from "react";
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
import api from "../../api";

function Dashboard() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [isQuizActive, setIsQuizActive] = useState(false);
    const [adminUrlData, setAdminUrlData] = useState({ url: "", expiresAt: null, isActive: true });
    const [timeLeft, setTimeLeft] = useState("");
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const role = user?.role || "user";
    const name = user?.name || "User";
    const surname = user?.surname || "";
    const location = useLocation();

    // Memoize fetchAdminUrl to ensure stability
    const fetchAdminUrl = useCallback(async () => {
        try {
            console.log("Dashboard: Fetching admin URL...");
            const response = await api.get("/admin-register-url");
            console.log("Dashboard: Admin URL response:", response.data);
            setAdminUrlData(response.data);
        } catch (err) {
            console.error("Dashboard: Error fetching admin URL:", err.response?.data || err.message);
            if (err.response?.status === 401) {
                setPopup({ message: "Session expired, please log in again", type: "error" });
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setTimeout(() => navigate("/"), 2000);
            } else {
                setPopup({ message: err.response?.data?.msg || "Failed to fetch admin URL", type: "error" });
            }
        }
    }, [navigate]);

    // Check token and fetch admin URL on mount (for admins only)
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
    }, [role, navigate, fetchAdminUrl]); // Added fetchAdminUrl to dependencies

    // Update countdown timer every second
    useEffect(() => {
        if (adminUrlData.expiresAt) {
            const timer = setInterval(() => {
                const now = new Date();
                const expires = new Date(adminUrlData.expiresAt);
                const diff = expires - now;
                if (diff <= 0) {
                    setTimeLeft("Expired");
                    if (role === "admin") {
                        fetchAdminUrl();
                    }
                } else {
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
                }
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [adminUrlData.expiresAt, role, fetchAdminUrl]); // Added fetchAdminUrl to dependencies

    const regenerateUrl = async () => {
        try {
            console.log("Dashboard: Regenerating admin URL...");
            const response = await api.post("/admin-register-url/regenerate");
            console.log("Dashboard: Regenerate URL response:", response.data);
            setAdminUrlData(response.data);
            setPopup({ message: "Admin URL regenerated successfully", type: "success" });
        } catch (err) {
            console.error("Dashboard: Error regenerating admin URL:", err.response?.data || err.message);
            if (err.response?.status === 401) {
                setPopup({ message: "Session expired, please log in again", type: "error" });
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setTimeout(() => navigate("/"), 2000);
            } else {
                setPopup({ message: err.response?.data?.msg || "Failed to regenerate admin URL", type: "error" });
            }
        }
    };

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
                    className={`${menuOpen ? "block" : "hidden"} md:hidden bg-gray-800 text-white px-4 pt-[4rem] pb-4 flex flex-col gap-3 shadow-md fixed top-0 left-0 right-0 z-10 overflow-y-auto h-[calc(100vh-4rem)]`}
                >
                    <Link
                        to="/dashboard"
                        className={`px-4 py-3 rounded-lg text-base min-h-[44px] ${isActive("/dashboard") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 flex items-center gap-3 w-full`}
                        onClick={() => setMenuOpen(false)}
                    >
                        <i className="fa-solid fa-house w-5 text-center"></i> Home
                    </Link>
                    {role === "admin" ? (
                        <>
                            <Link
                                to="/dashboard/create"
                                className={`px-4 py-3 rounded-lg text-base min-h-[44px] ${isActive("/dashboard/create") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 flex items-center gap-3 w-full`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <i className="fa-solid fa-plus-square w-5 text-center"></i> Create Quiz
                            </Link>
                            <Link
                                to="/dashboard/allreports"
                                className={`px-4 py-3 rounded-lg text-base min-h-[44px] ${isActive("/dashboard/allreports") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 flex items-center gap-3 w-full`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <i className="fa-solid fa-chart-simple w-5 text-center"></i> Reports
                            </Link>
                            <Link
                                to="/dashboard/users"
                                className={`px-4 py-3 rounded-lg text-base min-h-[44px] ${isActive("/dashboard/users") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 flex items-center gap-3 w-full`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <i className="fa-solid fa-users-cog w-5 text-center"></i> User Management
                            </Link>
                            {/* Admin Registration URL Controls */}
                            <div className="px-4 py-3 bg-gray-900 rounded-lg w-full">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-green-200 truncate">
                                        Admin URL: {adminUrlData.url || "Not set"}
                                    </p>
                                    {adminUrlData.url && (
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`http://localhost:5173${adminUrlData.url}`);
                                                setPopup({ message: "Admin URL copied to clipboard", type: "success" });
                                            }}
                                            className="text-white hover:text-green-400"
                                            title="Copy URL"
                                        >
                                            <i className="fa-solid fa-copy"></i>
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-green-200">
                                    Expires in: {timeLeft || "N/A"}
                                </p>
                                <div className="flex flex-col gap-2 mt-2">
                                    <button
                                        onClick={fetchAdminUrl}
                                        className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm transition-colors duration-200 flex items-center gap-3 w-full min-h-[44px]"
                                    >
                                        <i className="fa-solid fa-link w-5 text-center"></i> Get Admin URL
                                    </button>
                                    <button
                                        onClick={regenerateUrl}
                                        className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-sm transition-colors duration-200 flex items-center gap-3 w-full min-h-[44px]"
                                    >
                                        <i className="fa-solid fa-sync-alt w-5 text-center"></i> Regenerate URL
                                    </button>
                                    <button
                                        onClick={toggleActive}
                                        className={`px-4 py-2 rounded-lg ${adminUrlData.isActive ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"} text-white text-sm transition-colors duration-200 flex items-center gap-3 w-full min-h-[44px]`}
                                    >
                                        <i className="fa-solid fa-pause w-5 text-center"></i> {adminUrlData.isActive ? "Pause" : "Resume"} Registration
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <Link
                            to="/dashboard/result"
                            className={`px-4 py-3 rounded-lg text-base min-h-[44px] ${isActive("/dashboard/result") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200 flex items-center gap-3 w-full`}
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
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg w-full text-sm min-h-[44px] ${isActive("/dashboard") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200`}
                        >
                            <i className="fa-solid fa-house w-5 text-center"></i> Home
                        </Link>
                        {role === "admin" ? (
                            <>
                                <Link
                                    to="/dashboard/create"
                                    className={`flex items-center gap-3 px-4 py-2 rounded-lg w-full text-sm min-h-[44px] ${isActive("/dashboard/create") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200`}
                                >
                                    <i className="fa-solid fa-plus-square w-5 text-center"></i> Create Quiz
                                </Link>
                                <Link
                                    to="/dashboard/allreports"
                                    className={`flex items-center gap-3 px-4 py-2 rounded-lg w-full text-sm min-h-[44px] ${isActive("/dashboard/allreports") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200`}
                                >
                                    <i className="fa-solid fa-chart-simple w-5 text-center"></i> Reports
                                </Link>
                                <Link
                                    to="/dashboard/users"
                                    className={`flex items-center gap-3 px-4 py-2 rounded-lg w-full text-sm min-h-[44px] ${isActive("/dashboard/users") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200`}
                                >
                                    <i className="fa-solid fa-users-cog w-5 text-center"></i> User Management
                                </Link>
                                {/* Admin Registration URL Controls */}
                                <div className="px-4 py-2 bg-gray-900 rounded-lg w-full">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-green-200 truncate">
                                            Admin URL: {adminUrlData.url || "Not set"}
                                        </p>
                                        {adminUrlData.url && (
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`http://localhost:5173${adminUrlData.url}`);
                                                    setPopup({ message: "Admin URL copied to clipboard", type: "success" });
                                                }}
                                                className="text-white hover:text-green-400"
                                                title="Copy URL"
                                            >
                                                <i className="fa-solid fa-copy"></i>
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-green-200">
                                        Expires in: {timeLeft || "N/A"}
                                    </p>
                                    <div className="flex flex-col gap-2 mt-2">
                                        <button
                                            onClick={fetchAdminUrl}
                                            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm transition-colors duration-200 flex items-center gap-3 w-full min-h-[44px]"
                                        >
                                            <i className="fa-solid fa-link w-5 text-center"></i> Get Admin URL
                                        </button>
                                        <button
                                            onClick={regenerateUrl}
                                            className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-sm transition-colors duration-200 flex items-center gap-3 w-full min-h-[44px]"
                                        >
                                            <i className="fa-solid fa-sync-alt w-5 text-center"></i> Regenerate URL
                                        </button>
                                        <button
                                            onClick={toggleActive}
                                            className={`px-4 py-2 rounded-lg ${adminUrlData.isActive ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"} text-white text-sm transition-colors duration-200 flex items-center gap-3 w-full min-h-[44px]`}
                                        >
                                            <i className="fa-solid fa-pause w-5 text-center"></i> {adminUrlData.isActive ? "Pause" : "Resume"} Registration
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <Link
                                to="/dashboard/result"
                                className={`flex items-center gap-3 px-4 py-2 rounded-lg w-full text-sm min-h-[44px] ${isActive("/dashboard/result") ? "bg-gray-900 text-green-400" : "hover:bg-gray-600 hover:text-white"} transition-colors duration-200`}
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
                className={`flex-1 p-4 w-full ${isQuizActive ? "pt-0" : "pt-[4rem] md:pt-4 md:pl-[13rem] lg:pl-[17rem] xl:pl-[19rem]"}`}
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