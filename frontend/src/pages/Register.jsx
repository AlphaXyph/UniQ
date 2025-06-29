import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import Popup from "../components/Popup";

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("user");
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [branch, setBranch] = useState("");
    const [division, setDivision] = useState("");
    const [rollNo, setRollNo] = useState("");
    const [year, setYear] = useState("FY");
    const [showPassword, setShowPassword] = useState(false);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const navigate = useNavigate();

    const validateEmail = (email) => {
        const lowerCaseEmail = email.toLowerCase().trim();
        if (!lowerCaseEmail) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(lowerCaseEmail)) return "Invalid email format";
        if (!lowerCaseEmail.endsWith("@ves.ac.in")) return "Email must end with @ves.ac.in";
        setEmail(lowerCaseEmail);
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
        setPassword(trimmedPassword);
        return "";
    };

    const validateConfirmPassword = (confirmPassword) => {
        const trimmedConfirmPassword = confirmPassword.trim();
        if (!trimmedConfirmPassword) return "Confirm Password is required";
        if (trimmedConfirmPassword !== password) return "Passwords do not match";
        setConfirmPassword(trimmedConfirmPassword);
        return "";
    };

    const validateName = (name) => {
        const trimmedName = name.trim();
        if (!trimmedName) return "Name is required";
        if (trimmedName.length > 20) return "Name must be 20 characters or less";
        setName(trimmedName);
        return "";
    };

    const validateSurname = (surname) => {
        const trimmedSurname = surname.trim();
        if (!trimmedSurname) return "Surname is required";
        if (trimmedSurname.length > 20) return "Surname must be 20 characters or less";
        setSurname(trimmedSurname);
        return "";
    };

    const validateBranch = (branch) => {
        const trimmedBranch = branch.trim();
        if (role === "user" && !trimmedBranch) return "Branch is required";
        if (role === "user" && trimmedBranch.length > 15) return "Branch must be 15 characters or less";
        setBranch(trimmedBranch);
        return "";
    };

    const validateDivision = (division) => {
        const trimmedDivision = division.trim();
        if (role === "user" && !trimmedDivision) return "Division is required";
        if (role === "user" && trimmedDivision.length > 1) return "Division must be 1 character";
        setDivision(trimmedDivision);
        return "";
    };

    const validateRollNo = (rollNo) => {
        const trimmedRollNo = rollNo.trim();
        if (role === "user" && !trimmedRollNo) return "Roll No is required";
        if (role === "user" && (!/^\d{1,3}$/.test(trimmedRollNo) || parseInt(trimmedRollNo) > 999)) return "Roll No must be a 3-digit number or less";
        setRollNo(trimmedRollNo);
        return "";
    };

    const validateYear = (year) => {
        if (role === "user" && !year) return "Year is required";
        if (role === "user" && !["FY", "SY", "TY", "FOURTH"].includes(year)) return "Invalid year";
        return "";
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);
        const confirmPasswordError = validateConfirmPassword(confirmPassword);
        const nameError = validateName(name);
        const surnameError = validateSurname(surname);
        const branchError = validateBranch(branch);
        const divisionError = validateDivision(division);
        const rollNoError = validateRollNo(rollNo);
        const yearError = validateYear(year);
        const roleError = !["user", "admin"].includes(role) ? "Role must be Student or Teacher" : "";

        const errors = [emailError, passwordError, confirmPasswordError, nameError, surnameError, branchError, divisionError, rollNoError, yearError, roleError].filter(Boolean);
        if (errors.length) {
            setPopup({ message: errors.join("<br />"), type: "error" });
            return;
        }

        try {
            await API.post("/auth/register", { email, password, role, name, surname, ...(role === "user" && { branch, division, rollNo, year }) });
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

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            <div className="w-full max-w-4xl bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
                    <form onSubmit={handleRegister} className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-full"
                        >
                            <option value="user">Student</option>
                            <option value="admin">Teacher</option>
                        </select>
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
                        {role === "user" && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Branch (max 15 chars)"
                                    className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Division (1 char)"
                                    className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={division}
                                    onChange={(e) => setDivision(e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="Roll No (max 3 digits)"
                                    className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={rollNo}
                                    onChange={(e) => setRollNo(e.target.value)}
                                />
                                <select
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="FY">FY</option>
                                    <option value="SY">SY</option>
                                    <option value="TY">TY</option>
                                    <option value="FOURTH">FOURTH</option>
                                </select>
                            </>
                        )}
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

export default Register;