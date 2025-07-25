import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../../api";
import Popup from "../../../components/popup";

function Profile() {
    const [user, setUser] = useState(null);
    const [editedUser, setEditedUser] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [popup, setPopup] = useState({ message: "", type: "success", confirmAction: null, confirmInput: "" });
    const [countdown, setCountdown] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        setCurrentPassword("");
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setPopup({ message: "No authentication token found", type: "error" });
                    setTimeout(() => navigate("/"), 2000);
                    return;
                }
                const response = await API.get("/auth/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(response.data);
                setEditedUser(response.data);
                updateCountdown(response.data.lastProfileUpdate);
            } catch (err) {
                setPopup({ message: err.response?.data?.msg || "Failed to load profile", type: "error" });
                setTimeout(() => navigate("/dashboard"), 2000);
            }
        };
        fetchProfile();
    }, [navigate]);

    useEffect(() => {
        if (popup.message && !popup.confirmAction) {
            const timer = setTimeout(() => {
                setPopup({ message: "", type: "success", confirmAction: null, confirmInput: "" });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [popup.confirmAction, popup.message]);

    const updateCountdown = (lastUpdate) => {
        if (!lastUpdate) {
            setCountdown("");
            return;
        }
        const lastUpdateDate = new Date(lastUpdate);
        const now = new Date();
        const msSinceLastUpdate = now - lastUpdateDate;
        const msIn7Days = 7 * 24 * 60 * 60 * 1000;
        if (msSinceLastUpdate >= msIn7Days) {
            setCountdown("");
            return;
        }
        const msRemaining = msIn7Days - msSinceLastUpdate;
        const days = Math.floor(msRemaining / (24 * 60 * 60 * 1000));
        const hours = Math.floor((msRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        setCountdown(`${days} day${days !== 1 ? "s" : ""} ${hours} hr${hours !== 1 ? "s" : ""} left`);
    };

    useEffect(() => {
        if (user?.lastProfileUpdate) {
            const interval = setInterval(() => {
                updateCountdown(user.lastProfileUpdate);
            }, 60 * 1000); // Update every minute
            return () => clearInterval(interval);
        }
    }, [user?.lastProfileUpdate]);

    const formatName = (value) => {
        if (!value) return value;
        const trimmed = value.trim();
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    };

    const formatBranch = (value) => {
        if (!value) return value;
        return value.trim().toUpperCase();
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

    const validatePassword = (password) => {
        const trimmedPassword = password.trim();
        if (!trimmedPassword) return "New Password is required";
        if (trimmedPassword.length < 8) return "New Password must be at least 8 characters long";
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%_*?&])[A-Za-z\d@$!%_*?&]{8,}$/;
        if (!passwordRegex.test(trimmedPassword)) {
            return "New Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character";
        }
        return "";
    };

    const validateConfirmPassword = (confirmPassword) => {
        const trimmedConfirmPassword = confirmPassword.trim();
        if (!trimmedConfirmPassword) return "Confirm New Password is required";
        if (trimmedConfirmPassword !== newPassword) return "New passwords do not match";
        return "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedUser((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (isEditing) {
            setEditedUser(user); // Reset to original user data on cancel
        }
    };

    const handleSave = () => {
        const nameError = validateName(editedUser.name);
        const surnameError = validateSurname(editedUser.surname);
        const errors = [nameError, surnameError];

        if (user.role === "user") {
            const branchError = validateBranch(editedUser.branch || "");
            const divisionError = validateDivision(editedUser.division || "");
            const rollNoError = validateRollNo(editedUser.rollNo || "");
            const yearError = validateYear(editedUser.year || "");
            errors.push(branchError, divisionError, rollNoError, yearError);
        }

        const filteredErrors = errors.filter(Boolean);
        if (filteredErrors.length) {
            setPopup({ message: filteredErrors.join("<br />"), type: "error", confirmAction: null, confirmInput: "" });
            return;
        }

        setPopup({
            message: "You will not be able to edit profile for next 7 days. Type YES to confirm.",
            type: "warning",
            confirmAction: async (input) => {
                if (input !== "YES") {
                    setPopup({ message: "Please type YES in capital letters", type: "error", confirmAction: null, confirmInput: "" });
                    return;
                }
                const formattedData = {
                    ...editedUser,
                    name: formatName(editedUser.name),
                    surname: formatName(editedUser.surname),
                    ...(user.role === "user" && {
                        branch: formatBranch(editedUser.branch),
                        division: editedUser.division,
                        rollNo: Number(editedUser.rollNo),
                        year: editedUser.year,
                    }),
                };

                try {
                    const token = localStorage.getItem("token");
                    const response = await API.put("/auth/profile", formattedData, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const updatedUser = { ...formattedData, lastProfileUpdate: response.data.lastProfileUpdate };
                    setUser(updatedUser);
                    setEditedUser(updatedUser);
                    setPopup({ message: "Profile updated successfully!", type: "success", confirmAction: null, confirmInput: "" });
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    setIsEditing(false);
                    updateCountdown(response.data.lastProfileUpdate);
                } catch (err) {
                    setPopup({
                        message: err.response?.data?.msg || "Failed to update profile",
                        type: "error",
                        confirmAction: null,
                        confirmInput: "",
                    });
                }
            },
            confirmInput: "",
        });
    };

    const handlePasswordChange = async () => {
        if (!currentPassword) {
            setPopup({ message: "Please enter your current password", type: "error", confirmAction: null, confirmInput: "" });
            return;
        }
        const passwordError = validatePassword(newPassword);
        const confirmPasswordError = validateConfirmPassword(confirmNewPassword);
        if (passwordError || confirmPasswordError) {
            setPopup({
                message: [passwordError, confirmPasswordError].filter(Boolean).join("<br />"),
                type: "error",
                confirmAction: null,
                confirmInput: "",
            });
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await API.post(
                "/auth/change-password",
                { currentPassword, newPassword: newPassword.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPopup({ message: "Password changed successfully!", type: "success", confirmAction: null, confirmInput: "" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        } catch (err) {
            setPopup({
                message: err.response?.data?.msg || "Failed to change password",
                type: "error",
                confirmAction: null,
                confirmInput: "",
            });
        }
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success", confirmAction: null, confirmInput: "" });
    };

    if (!user) return <div className="min-h-screen bg-gray-100 p-4 sm:p-6"><p className="text-center text-gray-600 text-xs sm:text-sm">Loading...</p></div>;

    const fullName = `${user.name || ""} ${user.surname || ""}`.trim();
    const canEdit = !countdown;

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6">
                <Popup
                    message={popup.message}
                    type={popup.type}
                    onClose={closePopup}
                    confirmAction={popup.confirmAction}
                    confirmInput={popup.confirmInput}
                    setConfirmInput={(value) => setPopup({ ...popup, confirmInput: value })}
                />
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                    <i className="fas fa-user"></i> Profile
                </h2>
                {countdown && (
                    <p className="text-red-500 text-xs sm:text-sm">
                        Profile editing locked. {countdown} until next edit.
                    </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="col-span-full">
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Email</label>
                        <input
                            type="email"
                            value={user.email || ""}
                            readOnly
                            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-gray-100 text-xs sm:text-sm"
                        />
                    </div>
                    <div className="col-span-full">
                        <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Full Name</label>
                        {isEditing ? (
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <input
                                    type="text"
                                    name="name"
                                    value={editedUser.name || ""}
                                    onChange={handleChange}
                                    maxLength={20}
                                    placeholder="Name (max 20 chars)"
                                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                />
                                <input
                                    type="text"
                                    name="surname"
                                    value={editedUser.surname || ""}
                                    onChange={handleChange}
                                    maxLength={20}
                                    placeholder="Surname (max 20 chars)"
                                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                />
                            </div>
                        ) : (
                            <input
                                type="text"
                                value={fullName}
                                readOnly
                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-gray-100 text-xs sm:text-sm"
                            />
                        )}
                    </div>
                    {user.role === "user" && (
                        <>
                            <div>
                                <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Branch</label>
                                <input
                                    type="text"
                                    name="branch"
                                    value={editedUser.branch || ""}
                                    onChange={handleChange}
                                    maxLength={4}
                                    readOnly={!isEditing}
                                    className={`w-full p-2 sm:p-3 border border-gray-300 rounded-lg text-xs sm:text-sm ${!isEditing ? "bg-gray-100" : "focus:outline-none focus:ring-2 focus:ring-blue-500"}`}
                                />
                            </div>
                            <div>
                                <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Division</label>
                                {isEditing ? (
                                    <select
                                        name="division"
                                        value={editedUser.division || ""}
                                        onChange={handleChange}
                                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                    >
                                        <option value="">Select Division</option>
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={editedUser.division || ""}
                                        readOnly
                                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-gray-100 text-xs sm:text-sm"
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Roll Number</label>
                                <input
                                    type="number"
                                    name="rollNo"
                                    value={editedUser.rollNo || ""}
                                    onChange={handleChange}
                                    max={999}
                                    readOnly={!isEditing}
                                    className={`w-full p-2 sm:p-3 border border-gray-300 rounded-lg text-xs sm:text-sm ${!isEditing ? "bg-gray-100" : "focus:outline-none focus:ring-2 focus:ring-blue-500"}`}
                                />
                            </div>
                            <div>
                                <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Year</label>
                                <select
                                    name="year"
                                    value={editedUser.year || ""}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full p-2 sm:p-3 border border-gray-300 rounded-lg text-xs sm:text-sm ${!isEditing ? "bg-gray-100" : "focus:outline-none focus:ring-2 focus:ring-blue-500"}`}
                                >
                                    <option value="">Select Year</option>
                                    <option value="FY">FY</option>
                                    <option value="SY">SY</option>
                                    <option value="TY">TY</option>
                                    <option value="FOURTH">FOURTH</option>
                                </select>
                            </div>
                        </>
                    )}
                    <div className="col-span-full flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <button
                            onClick={handleEditToggle}
                            disabled={!canEdit && !isEditing}
                            className={`w-full sm:w-auto p-2 sm:p-3 rounded-lg text-xs sm:text-sm ${canEdit || isEditing ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                        >
                            <i className="fas fa-pen-to-square"></i> {isEditing ? "Cancel" : "Edit Profile"}
                        </button>
                        {isEditing && (
                            <button
                                onClick={handleSave}
                                className="w-full sm:w-auto p-2 sm:p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs sm:text-sm"
                            >
                                Save Changes
                            </button>
                        )}
                    </div>
                </div>
                <div className="border-t border-gray-200 pt-4 sm:pt-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Change Password</h3>
                    <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="relative">
                            <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Current Password</label>
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                placeholder="Current Password (required)"
                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                autoComplete="new-password"
                                name="current-password-unique-123"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs sm:text-sm"
                            >
                                <i className={showCurrentPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                            </button>
                        </div>
                        <div className="relative">
                            <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">New Password</label>
                            <input
                                type={showNewPassword ? "text" : "password"}
                                placeholder="New Password (8+ chars, mixed case, number, special char)"
                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoComplete="new-password"
                                name="new-password-unique-123"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs sm:text-sm"
                            >
                                <i className={showNewPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                            </button>
                        </div>
                        <div className="relative">
                            <label className="block mb-1 font-semibold text-sm sm:text-base text-gray-700">Confirm New Password</label>
                            <input
                                type={showNewPassword ? "text" : "password"}
                                placeholder="Confirm New Password"
                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                autoComplete="new-password"
                                name="confirm-password-unique-123"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs sm:text-sm"
                            >
                                <i className={showNewPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                            </button>
                        </div>
                        <button
                            onClick={handlePasswordChange}
                            className="w-full sm:w-auto p-2 sm:p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs sm:text-sm"
                        >
                            Change Password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;