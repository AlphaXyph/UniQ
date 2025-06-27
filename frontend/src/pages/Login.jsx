import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import Popup from "../components/popup";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
        <div className="relative flex items-center justify-center h-screen bg-gray-100">
            <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-96 space-y-4">
                <h2 className="text-2xl font-bold text-center">UniQ Login</h2>
                <input
                    type="email"
                    placeholder="Email"
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