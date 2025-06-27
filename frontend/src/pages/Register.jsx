import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import Popup from "../components/popup";

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("user");
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await API.post("/auth/register", { email, password, role });
            setPopup({ message: "Registered! Please login.", type: "success" });
            setTimeout(() => navigate("/"), 2000);
        } catch (err) {
            console.error("Register error:", err.response?.data || err.message);
            setPopup({ message: err.response?.data?.msg || "Register failed", type: "error" });
        }
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
    };

    return (
        <div className="relative flex items-center justify-center h-screen bg-gray-100">
            <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            <form onSubmit={handleRegister} className="bg-white p-8 rounded shadow-md w-96 space-y-4">
                <h2 className="text-2xl font-bold text-center">Register</h2>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="user">Student</option>
                    <option value="admin">Teacher</option>
                </select>
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
                <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
                    Register
                </button>
                <div className="text-center">
                    <p>Already have an account?</p>
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="text-blue-600 underline mt-2"
                    >
                        Login Here
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Register;