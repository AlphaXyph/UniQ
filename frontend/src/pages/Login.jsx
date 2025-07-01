import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import Popup from "../components/Popup";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post("/auth/login", { email, password });
            const { token, user } = res.data;
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            setPopup({ message: "Login successful!", type: "success" });
            setTimeout(() => navigate("/dashboard"), 2000);
        } catch (err) {
            console.error("Login error:", err.response?.data || err.message);
            setPopup({ message: err.response?.data?.msg || "Login failed", type: "error" });
        }
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 bg-gray-100 flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 text-center flex items-center gap-2">
                    <i className="fas fa-sign-in-alt"></i> UniQ Login
                </h2>
                <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
                    <div>
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Email</label>
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs sm:text-sm"
                        >
                            <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                        </button>
                    </div>
                    <button
                        type="submit"
                        className="w-full p-2 sm:p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs sm:text-sm"
                    >
                        Login
                    </button>
                    <div className="text-center text-xs sm:text-sm">
                        <p>Don't have an account?</p>
                        <button
                            type="button"
                            onClick={() => navigate("/register")}
                            className="text-blue-500 hover:underline mt-2"
                        >
                            Register Here
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;