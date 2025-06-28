import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import Popup from "../components/Popup";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const navigate = useNavigate();

    // Email validation: non-empty, valid format, and ends with @ves.ac.in
    const validateEmail = (email) => {
        if (!email) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return "Invalid email format";
        if (!email.endsWith("@ves.ac.in")) return "Email must end with @ves.ac.in";
        return "";
    };

    // Password validation: non-empty
    const validatePassword = (password) => {
        if (!password) return "Password is required";
        return "";
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);

        if (emailError || passwordError) {
            setPopup({
                message: [emailError, passwordError].filter(Boolean).join("<br />"),
                type: "error",
            });
            return;
        }

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
        <div className="relative flex items-center justify-center h-screen bg-gray-100">
            <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-96 space-y-4">
                <h2 className="text-2xl font-bold text-center">UniQ Login</h2>
                <input
                    type="email"
                    placeholder="Email (must end with @ves.ac.in)"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                    Login
                </button>
                <div className="text-center">
                    <p>Don't have an account?</p>
                    <button
                        type="button"
                        onClick={() => navigate("/register")}
                        className="text-blue-600 underline mt-2"
                    >
                        Register Here
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Login;