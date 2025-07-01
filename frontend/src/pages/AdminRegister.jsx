import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api";
import Popup from "../components/Popup";

function AdminRegister() {
    const { token } = useParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const navigate = useNavigate();

    const formatName = (value) => {
        if (!value) return value;
        const trimmed = value.trim();
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    };

    const validateEmail = (email) => {
        const lowerCaseEmail = email.toLowerCase().trim();
        if (!lowerCaseEmail) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(lowerCaseEmail)) return "Invalid email format";
        if (!lowerCaseEmail.endsWith("@ves.ac.in")) return "Email must end with @ves.ac.in";
        return "";
    };

    const validatePassword = (password) => {
        const trimmedPassword = password.trim();
        if (!trimmedPassword) return "Password is required";
        if (trimmedPassword.length < 8) return "Password must be at least 8 characters long";
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(trimmedPassword)) {
            return "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character";
        }
        return "";
    };

    const validateConfirmPassword = (confirmPassword) => {
        const trimmedConfirmPassword = confirmPassword.trim();
        if (!trimmedConfirmPassword) return "Confirm Password is required";
        if (trimmedConfirmPassword !== password) return "Passwords do not match";
        return "";
    };

    const validateName = (name) => {
        const trimmedName = name.trim();
        if (!trimmedName) return "Name is required";
        if (trimmedName.length > 20) return "Name must be 20 characters or less";
        return "";
    };

    const validateSurname = (surname) => {
        const trimmedSurname = surname.trim();
        if (!trimmedSurname) return "Surname is required";
        if (trimmedSurname.length > 20) return "Surname must be 20 characters or less";
        return "";
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);
        const confirmPasswordError = validateConfirmPassword(confirmPassword);
        const nameError = validateName(name);
        const surnameError = validateSurname(surname);

        const errors = [emailError, passwordError, confirmPasswordError, nameError, surnameError].filter(Boolean);
        if (errors.length) {
            setPopup({ message: errors.join("<br />"), type: "error" });
            return;
        }

        const formattedData = {
            email: email.toLowerCase().trim(),
            password: password.trim(),
            name: formatName(name),
            surname: formatName(surname),
            token,
        };

        try {
            await API.post("/auth/admin-register", formattedData);
            setPopup({ message: "Admin registered! Please login.", type: "success" });
            setTimeout(() => navigate("/"), 2000);
        } catch (err) {
            console.error("Admin register error:", err.response?.data || err.message);
            setPopup({ message: err.response?.data?.msg || "Register failed", type: "error" });
        }
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            <div className="w-full max-w-4xl bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-center mb-6">Register as Teacher</h2>
                    <form onSubmit={handleRegister} className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                        <input
                            type="email"
                            placeholder="Email (must end with @ves.ac.in)"
                            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-full"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password (8+ chars, mixed case, number, special char)"
                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={toggleShowPassword}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Name (max 20 chars)"
                            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Surname (max 20 chars)"
                            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={surname}
                            onChange={(e) => setSurname(e.target.value)}
                        />
                        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 col-span-full">
                            Register
                        </button>
                        <div className="text-center col-span-full">
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
            </div>
        </div>
    );
}

export default AdminRegister;