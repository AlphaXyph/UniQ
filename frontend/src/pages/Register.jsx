import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import Popup from "../components/Popup";

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("user");
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

    // Password validation: non-empty, 8+ chars, uppercase, lowercase, number, special char
    const validatePassword = (password) => {
        if (!password) return "Password is required";
        if (password.length < 8) return "Password must be at least 8 characters long";
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character";
        }
        return "";
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);
        const roleError = !["user", "admin"].includes(role) ? "Role must be Student or Teacher" : "";

        if (emailError || passwordError || roleError) {
            setPopup({
                message: [emailError, passwordError, roleError].filter(Boolean).join("<br />"),
                type: "error",
            });
            return;
        }

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
                    placeholder="Email (must end with @ves.ac.in)"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password (8+ chars, mixed case, number, special char)"
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