import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../api";
import Popup from "../components/popup";

function AdminRegister() {
    const { randomString } = useParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [isValidUrl, setIsValidUrl] = useState(null); // null = loading, true = valid, false = invalid
    const navigate = useNavigate();

    // Validate randomString on mount
    useEffect(() => {
        const validateUrl = async () => {
            try {
                console.log("AdminRegister: Validating randomString:", randomString);
                await API.post("/auth/validate-admin-url", { randomString });
                setIsValidUrl(true);
                console.log("AdminRegister: URL is valid");
            } catch (err) {
                console.error("AdminRegister: URL validation error:", err.response?.data || err.message);
                setIsValidUrl(false);
                setPopup({ message: err.response?.data?.msg || "Invalid or expired registration URL", type: "error" });
                // Redirect to login after 2 seconds
                setTimeout(() => navigate("/"), 2000);
            }
        };
        validateUrl();
    }, [randomString, navigate]);

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
            role: "admin",
            name: formatName(name),
            surname: formatName(surname),
            randomString,
        };

        try {
            await API.post("/auth/admin-register", formattedData);
            setPopup({ message: "Admin registered! Please login.", type: "success" });
            setTimeout(() => navigate("/"), 2000);
        } catch (err) {
            console.error("Admin register error:", err.response?.data || err.message);
            setPopup({ message: err.response?.data?.msg || "Admin registration failed", type: "error" });
        }
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
    };

    // Show loading state while validating
    if (isValidUrl === null) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <p className="text-gray-800 text-lg">Validating URL...</p>
            </div>
        );
    }

    // Show error state (will redirect after popup)
    if (isValidUrl === false) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            </div>
        );
    }

    // Render form for valid URL
    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 text-center flex items-center gap-2">
                    <i className="fas fa-user-plus"></i> Admin Register
                </h2>
                <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="col-span-full">
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Email</label>
                        <input
                            type="email"
                            placeholder="Email (must end with @ves.ac.in)"
                            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password (8+ chars, mixed case, number, special char)"
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
                    <div className="relative">
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Confirm Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs sm:text-sm"
                        >
                            <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                        </button>
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Name</label>
                        <input
                            type="text"
                            placeholder="Name (max 20 chars)"
                            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Surname</label>
                        <input
                            type="text"
                            placeholder="Surname (max 20 chars)"
                            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            value={surname}
                            onChange={(e) => setSurname(e.target.value)}
                        />
                    </div>
                    <div className="col-span-full flex justify-center">
                        <button
                            type="submit"
                            className="px-6 py-2 w-1/3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                        >
                            Register
                        </button>
                    </div>
                    <div className="col-span-full flex flex-col items-center justify-center">
                        <p className="text-black text-sm mr-1">Already have an account?</p>
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="text-blue-500 text-sm my-2 hover:underline"
                        >
                            Login Here
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AdminRegister;