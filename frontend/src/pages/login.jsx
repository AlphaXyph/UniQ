import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import Popup from "../components/popup";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showWakeUpMessage, setShowWakeUpMessage] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    }, []);

    useEffect(() => {
        let timer;
        if (isLoading) {
            timer = setTimeout(() => {
                setShowWakeUpMessage(true);
            }, 5000);
        } else {
            setShowWakeUpMessage(false);
        }
        return () => clearTimeout(timer);
    }, [isLoading]);

    const validateEmail = (value) => {
        const lowerCaseEmail = value.toLowerCase().trim();
        if (!lowerCaseEmail) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(lowerCaseEmail)) return "Invalid email format";
        if (!lowerCaseEmail.endsWith("@ves.ac.in")) return "Email must end with @ves.ac.in";
        return "";
    };

    const validatePassword = (value) => {
        const trimmedPassword = value.trim();
        if (!trimmedPassword) return "Password is required";
        if (trimmedPassword.length < 8) return "Password must be at least 8 characters long";
        return "";
    };

    const validateForm = () => {
        const newErrors = {
            email: validateEmail(email),
            password: validatePassword(password),
        };
        setErrors(newErrors);
        return Object.values(newErrors).every((error) => !error);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            setPopup({ message: "Please fix the errors in the form", type: "error" });
            return;
        }

        setIsLoading(true);
        const formattedData = {
            email: email.toLowerCase().trim(),
            password: password.trim(),
        };

        try {
            const res = await API.post("/auth/login", formattedData);
            const { token, user } = res.data;
            if (!token) {
                throw new Error("No token received from server");
            }
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            setPopup({ message: "Login successful!", type: "success" });
            setTimeout(() => {
                navigate("/dashboard", { replace: true });
            }, 1000);
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Login failed", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
        setErrors({});
        setShowWakeUpMessage(false);
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 bg-gray-100 flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                {showWakeUpMessage && (
                    <Popup
                        message="Waking up the backend, this may take a moment..."
                        type="success"
                        onClose={() => setShowWakeUpMessage(false)}
                    />
                )}
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 text-center flex items-center gap-2">
                    <i className="fas fa-sign-in-alt"></i> UniQ Login
                </h2>
                <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
                    <div>
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Email</label>
                        <input
                            type="email"
                            placeholder="Email (must end with @ves.ac.in)"
                            className={`w-full p-2 sm:p-3 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm`}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => setErrors({ ...errors, email: validateEmail(email) })}
                            disabled={isLoading}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password (8+ chars)"
                                className={`w-full p-2 sm:p-3 border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm`}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={() => setErrors({ ...errors, password: validatePassword(password) })}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs sm:text-sm"
                                disabled={isLoading}
                            >
                                <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                            </button>
                        </div>
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        <div className="text-xs text-blue-500 hover:underline text-right cursor-pointer mt-1" onClick={() => navigate("/forgot-password")}>
                            Forgot Password?
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full p-2 sm:p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs sm:text-sm relative"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                <span className="ml-2">Logging in...</span>
                            </div>
                        ) : (
                            "Login"
                        )}
                    </button>
                    <div className="text-center text-xs sm:text-sm">
                        <p>Don't have an account?</p>
                        <button
                            type="button"
                            onClick={() => navigate("/register")}
                            className="text-blue-500 hover:underline mt-2"
                            disabled={isLoading}
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