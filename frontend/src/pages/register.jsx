import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import Popup from "../components/popup";

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [branch, setBranch] = useState("");
    const [division, setDivision] = useState("");
    const [rollNo, setRollNo] = useState("");
    const [year, setYear] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showWakeUpMessage, setShowWakeUpMessage] = useState(false);
    const navigate = useNavigate();

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

    const formatName = (value) => {
        if (!value) return value;
        const trimmed = value.trim();
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    };

    const formatBranch = (value) => {
        if (!value) return value;
        return value.trim().toUpperCase();
    };

    const validateEmail = (email) => {
        const lowerCaseEmail = email.toLowerCase().trim();
        if (!lowerCaseEmail) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(lowerCaseEmail)) return "Invalid email format";
        if (!lowerCaseEmail.endsWith("@ves.ac.in")) return "Email must end with @ves.ac.in";
        return "";
    };

    // In register.jsx
    const validatePassword = (password) => {
        const trimmedPassword = password.trim();
        if (!trimmedPassword) return "Password is required";
        if (trimmedPassword.length < 8) return "Password must be at least 8 characters long";
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%_*?&])[A-Za-z\d@$!%_*?&]{8,}$/;
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

    const validateBranch = (branch) => {
        const trimmedBranch = branch.trim();
        if (!trimmedBranch) return "Branch is required";
        if (trimmedBranch.length > 4) return "Branch must be 4 characters or less";
        return "";
    };

    const validateDivision = (division) => {
        if (!division) return "Division is required";
        if (!["A", "B", "C", "D"].includes(division)) return "Division must be A, B, C, or D";
        return "";
    };

    const validateRollNo = (rollNo) => {
        const trimmedRollNo = rollNo.toString().trim();
        if (!trimmedRollNo) return "Roll No is required";
        if (!/^\d{1,3}$/.test(trimmedRollNo) || parseInt(trimmedRollNo) > 999) return "Roll No must be a 3-digit number or less";
        return "";
    };

    const validateYear = (year) => {
        if (!year) return "Year is required";
        if (!["FY", "SY", "TY", "FOURTH"].includes(year)) return "Invalid year";
        return "";
    };

    const validateForm = () => {
        const newErrors = {
            email: validateEmail(email),
            password: validatePassword(password),
            confirmPassword: validateConfirmPassword(confirmPassword),
            name: validateName(name),
            surname: validateSurname(surname),
            branch: validateBranch(branch),
            division: validateDivision(division),
            rollNo: validateRollNo(rollNo),
            year: validateYear(year),
        };
        setErrors(newErrors);
        return Object.values(newErrors).every((error) => !error);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            setPopup({ message: "Please fix the errors in the form", type: "error" });
            return;
        }

        setIsLoading(true);
        const formattedData = {
            email: email.toLowerCase().trim(),
            password: password.trim(),
            role: "user",
            name: formatName(name),
            surname: formatName(surname),
            branch: formatBranch(branch),
            division,
            rollNo: rollNo.trim(),
            year,
        };

        try {
            await API.post("/auth/register", formattedData);
            setPopup({ message: "Registered! Please login.", type: "success" });
            setTimeout(() => navigate("/"), 2000);
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Register failed", type: "error" });
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
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                {showWakeUpMessage && (
                    <Popup
                        message="Waking up the backend, this may take a moment..."
                        type="info"
                        onClose={() => setShowWakeUpMessage(false)}
                    />
                )}
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 text-center flex items-center gap-2">
                    <i className="fas fa-user-plus"></i> Register
                </h2>
                <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="col-span-full">
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
                    {/* Password Field */}
                    <div className="mb-4">
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">
                            Password
                        </label>

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password (8+ chars, mixed case, number, special char)"
                                className={`w-full p-2 sm:p-3 pr-10 border ${errors.password ? "border-red-500" : "border-gray-300"
                                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm`}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={() =>
                                    setErrors({ ...errors, password: validatePassword(password) })
                                }
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                                disabled={isLoading}
                            >
                                <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                            </button>
                        </div>

                        {errors.password && (
                            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                        )}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="mb-4">
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">
                            Confirm Password
                        </label>

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                className={`w-full p-2 sm:p-3 pr-10 border ${errors.confirmPassword ? "border-red-500" : "border-gray-300"
                                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm`}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onBlur={() =>
                                    setErrors({
                                        ...errors,
                                        confirmPassword: validateConfirmPassword(confirmPassword),
                                    })
                                }
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                                disabled={isLoading}
                            >
                                <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                            </button>
                        </div>

                        {errors.confirmPassword && (
                            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                        )}
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Name</label>
                        <input
                            type="text"
                            placeholder="Name (max 20 chars)"
                            className={`w-full p-2 sm:p-3 border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm`}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={() => setErrors({ ...errors, name: validateName(name) })}
                            disabled={isLoading}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Surname</label>
                        <input
                            type="text"
                            placeholder="Surname (max 20 chars)"
                            className={`w-full p-2 sm:p-3 border ${errors.surname ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm`}
                            value={surname}
                            onChange={(e) => setSurname(e.target.value)}
                            onBlur={() => setErrors({ ...errors, surname: validateSurname(surname) })}
                            disabled={isLoading}
                        />
                        {errors.surname && <p className="text-red-500 text-xs mt-1">{errors.surname}</p>}
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Branch</label>
                        <input
                            type="text"
                            placeholder="Branch (max 4 chars)"
                            className={`w-full p-2 sm:p-3 border ${errors.branch ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm`}
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            onBlur={() => setErrors({ ...errors, branch: validateBranch(branch) })}
                            disabled={isLoading}
                        />
                        {errors.branch && <p className="text-red-500 text-xs mt-1">{errors.branch}</p>}
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Division</label>
                        <select
                            value={division}
                            onChange={(e) => setDivision(e.target.value)}
                            onBlur={() => setErrors({ ...errors, division: validateDivision(division) })}
                            className={`w-full p-2 sm:p-3 border ${errors.division ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm`}
                            disabled={isLoading}
                        >
                            <option value="">Select Division</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                        </select>
                        {errors.division && <p className="text-red-500 text-xs mt-1">{errors.division}</p>}
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Roll Number</label>
                        <input
                            type="number"
                            placeholder="Roll No (max 3 digits)"
                            className={`w-full p-2 sm:p-3 border ${errors.rollNo ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm`}
                            value={rollNo}
                            onChange={(e) => setRollNo(e.target.value)}
                            onBlur={() => setErrors({ ...errors, rollNo: validateRollNo(rollNo) })}
                            disabled={isLoading}
                        />
                        {errors.rollNo && <p className="text-red-500 text-xs mt-1">{errors.rollNo}</p>}
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Year</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            onBlur={() => setErrors({ ...errors, year: validateYear(year) })}
                            className={`w-full p-2 sm:p-3 border ${errors.year ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm`}
                            disabled={isLoading}
                        >
                            <option value="">Select Year</option>
                            <option value="FY">FY</option>
                            <option value="SY">SY</option>
                            <option value="TY">TY</option>
                            <option value="FOURTH">FOURTH</option>
                        </select>
                        {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
                    </div>
                    <div className="col-span-full flex justify-center">
                        <button
                            type="submit"
                            className="px-6 py-2 w-1/3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm relative"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                    <span className="ml-2">Registering...</span>
                                </div>
                            ) : (
                                "Register"
                            )}
                        </button>
                    </div>
                    <div className="col-span-full flex flex-col items-center justify-center">
                        <p className="text-black text-sm mr-1">Already have an account?</p>
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="text-blue-500 text-sm my-2 hover:underline"
                            disabled={isLoading}
                        >
                            Login Here
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Register;