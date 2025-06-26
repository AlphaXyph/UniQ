import React, { useState } from "react";
import { Link, Routes, Route, useNavigate } from "react-router-dom";
import Home from "./dashboard/Home";
import Reports from "./dashboard/Reports";
import Result from "./dashboard/Result";
import CreateQuiz from "./dashboard/createQuiz";
import AttemptQuiz from "./dashboard/AttemptQuiz";

function Dashboard() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role || "user";

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Mobile Nav Toggle Button */}
            <div className="sm:hidden p-4 bg-blue-700 text-white flex justify-between items-center shadow-md">
                <h2 className="text-xl font-bold">UniQ</h2>
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="text-white text-2xl focus:outline-none"
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                >
                    {menuOpen ? "✕" : "☰"}
                </button>
            </div>

            {/* Sidebar */}
            <aside
                className={`${menuOpen ? "block" : "hidden"
                    } sm:block w-full sm:w-64 bg-blue-700 text-white flex flex-col p-6 fixed sm:sticky top-0 h-screen sm:h-auto shadow-lg transition-all duration-300 ease-in-out z-10`}
            >
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-yellow-300">UniQ</h2>
                    <p className="text-sm text-yellow-200 mt-1">Role: {role}</p>
                </div>
                <div className="flex flex-col flex-1 justify-between">
                    <nav className="flex flex-col gap-2 text-lg">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-600 hover:text-yellow-300 transition-colors duration-200"
                            onClick={() => setMenuOpen(false)}
                        >
                            🏠 Home
                        </Link>
                        <Link
                            to="/dashboard/create"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-600 hover:text-yellow-300 transition-colors duration-200"
                            onClick={() => setMenuOpen(false)}
                        >
                            ➕ Create Quiz
                        </Link>
                        <Link
                            to="/dashboard/result"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-600 hover:text-yellow-300 transition-colors duration-200"
                            onClick={() => setMenuOpen(false)}
                        >
                            📋 Result
                        </Link>
                        <Link
                            to="/dashboard/reports"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-600 hover:text-yellow-300 transition-colors duration-200"
                            onClick={() => setMenuOpen(false)}
                        >
                            📊 Reports
                        </Link>
                    </nav>
                    <button
                        onClick={handleLogout}
                        className="mt-4 p-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-left transition-colors duration-200"
                    >
                        🚪 Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="create" element={
                            role === "admin" ? <CreateQuiz /> : <Navigate to="/dashboard" />
                        } />
                        <Route path="result" element={<Result />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="attempt/:quizId" element={<AttemptQuiz />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;