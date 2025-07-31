import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import Popup from "../components/popup";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP and new password
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const validateEmail = (value) => {
        const lowerCaseEmail = value.toLowerCase().trim();
        if (!lowerCaseEmail) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(lowerCaseEmail)) return "Invalid email format";
        if (!lowerCaseEmail.endsWith("@ves.ac.in")) return "Email must end with @ves.ac.in";
        return "";
    };

    const validateOtp = (value) => {
        if (!value) return "OTP is required";
        if (!/^\d{6}$/.test(value)) return "OTP must be a 6-digit number";
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

    const validateConfirmPassword = (value, newPassword) => {
        if (!value.trim()) return "Confirm Password is required";
        if (value.trim() !== newPassword.trim()) return "Passwords do not match";
        return "";
    };

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        const emailError = validateEmail(email);
        if (emailError) {
            setErrors({ email: emailError });
            setPopup({ message: "Please fix the errors in the form", type: "error" });
            return;
        }

        try {
            await API.post("/auth/request-password-reset", { email: email.toLowerCase().trim() });
            setPopup({ message: "OTP sent to your email", type: "success" });
            setStep(2);
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Failed to send OTP", type: "error" });
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        const newErrors = {
            otp: validateOtp(otp),
            newPassword: validatePassword(newPassword),
            confirmPassword: validateConfirmPassword(confirmPassword, newPassword),
        };
        setErrors(newErrors);
        if (Object.values(newErrors).some((error) => error)) {
            setPopup({ message: "Please fix the errors in the form", type: "error" });
            return;
        }

        try {
            await API.post("/auth/reset-password", {
                email: email.toLowerCase().trim(),
                otp,
                newPassword: newPassword.trim(),
            });
            setPopup({ message: "Password reset successfully!", type: "success" });
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Failed to reset password", type: "error" });
        }
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
        setErrors({});
        // Only navigate to login if the password reset was successful
        if (popup.type === "success" && popup.message === "Password reset successfully!") {
            navigate("/");
        }
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 bg-gray-100 flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 text-center flex items-center gap-2">
                    <i className="fas fa-key"></i> Reset Password
                </h2>
                {step === 1 ? (
                    <form onSubmit={handleRequestOtp} className="space-y-4 sm:space-y-6">
                        <div>
                            <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Email</label>
                            <input
                                type="email"
                                placeholder="Email (must end with @ves.ac.in)"
                                className={`w-full p-2 sm:p-3 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm`}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => setErrors({ ...errors, email: validateEmail(email) })}
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>
                        <button
                            type="submit"
                            className="w-full p-2 sm:p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs sm:text-sm"
                        >
                            Send OTP
                        </button>
                        <div className="text-center text-xs sm:text-sm">
                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                className="text-blue-500 hover:underline"
                            >
                                Back to Login
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-6">
                        <div>
                            <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">OTP</label>
                            <input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                className={`w-full p-2 sm:p-3 border ${errors.otp ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm`}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                onBlur={() => setErrors({ ...errors, otp: validateOtp(otp) })}
                            />
                            {errors.otp && <p className="text-red-500 text-xs mt-1">{errors.otp}</p>}
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">New Password</label>
                            <input
                                type="password"
                                placeholder="New Password (8+ chars)"
                                className={`w-full p-2 sm:p-3 border ${errors.newPassword ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm`}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                onBlur={() => setErrors({ ...errors, newPassword: validatePassword(newPassword) })}
                            />
                            {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Confirm Password</label>
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                className={`w-full p-2 sm:p-3 border ${errors.confirmPassword ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm`}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onBlur={() =>
                                    setErrors({ ...errors, confirmPassword: validateConfirmPassword(confirmPassword, newPassword) })
                                }
                            />
                            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                        </div>
                        <button
                            type="submit"
                            className="w-full p-2 sm:p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs sm:text-sm"
                        >
                            Reset Password
                        </button>
                        <div className="text-center text-xs sm:text-sm">
                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                className="text-blue-500 hover:underline"
                            >
                                Back to Login
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;