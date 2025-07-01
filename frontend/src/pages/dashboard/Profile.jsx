import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api";
import Popup from "../../components/Popup";

function Profile() {
    const [user, setUser] = useState(null);
    const [editedUser, setEditedUser] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [popup, setPopup] = useState({ message: "", type: "success" });
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
            } catch (err) {
                setPopup({ message: err.response?.data?.msg || "Failed to load profile", type: "error" });
                setTimeout(() => navigate("/dashboard"), 2000);
            }
        };
        fetchProfile();
    }, [navigate]);

    const formatName = (value) => {
        if (!value) return value;
        const trimmed = value.trim();
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    };

    const formatBranch = (value) => {
        if (!value) return value;
        return value.trim().toUpperCase();
    };

    const formatDivision = (value) => {
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
        const trimmedDivision = division.trim();
        if (!trimmedDivision) return "Division is required";
        if (trimmedDivision.length > 2) return "Division must be 2 characters or less";
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedUser((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleSave = async () => {
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
            setPopup({ message: filteredErrors.join("<br />"), type: "error" });
            return;
        }

        const formattedData = {
            ...editedUser,
            name: formatName(editedUser.name),
            surname: formatName(editedUser.surname),
            ...(user.role === "user" && {
                branch: formatBranch(editedUser.branch),
                division: formatDivision(editedUser.division),
                rollNo: editedUser.rollNo?.toString().trim(),
                year: editedUser.year,
            }),
        };

        try {
            const token = localStorage.getItem("token");
            await API.put("/auth/profile", formattedData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(formattedData);
            setEditedUser(formattedData);
            setPopup({ message: "Profile updated successfully!", type: "success" });
            localStorage.setItem("user", JSON.stringify(formattedData));
            setIsEditing(false);
        } catch (err) {
            console.error("Profile update error:", err.response?.data || err.message);
            setPopup({ message: err.response?.data?.msg || "Update failed", type: "error" });
        }
    };

    const handlePasswordChange = async () => {
        if (!currentPassword) {
            setPopup({ message: "Please enter your current password", type: "error" });
            return;
        }
        const trimmedNewPassword = newPassword.trim();
        if (!trimmedNewPassword) {
            setPopup({ message: "New Password is required", type: "error" });
            return;
        }
        if (trimmedNewPassword.length < 8) {
            setPopup({ message: "New Password must be at least 8 characters long", type: "error" });
            return;
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(trimmedNewPassword)) {
            setPopup({ message: "New Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character", type: "error" });
            return;
        }
        const trimmedConfirmPassword = confirmNewPassword.trim();
        if (!trimmedConfirmPassword) {
            setPopup({ message: "Confirm New Password is required", type: "error" });
            return;
        }
        if (trimmedConfirmPassword !== trimmedNewPassword) {
            setPopup({ message: "New passwords do not match", type: "error" });
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await API.post("/auth/change-password", { currentPassword, newPassword: trimmedNewPassword }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPopup({ message: "Password changed successfully!", type: "success" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Password change failed", type: "error" });
        }
    };

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
    };

    if (!user) return <div className="min-h-screen bg-gray-100 p-4 sm:p-6"><p className="text-center text-gray-600 text-xs sm:text-sm">Loading...</p></div>;

    const fullName = `${user.name || ""} ${user.surname || ""}`.trim();

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6">
                <Popup message={popup.message} type={popup.type} onClose={closePopup} />
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                    <i className="fas fa-user"></i> Profile
                </h2>
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
                                <input
                                    type="text"
                                    name="division"
                                    value={editedUser.division || ""}
                                    onChange={handleChange}
                                    maxLength={2}
                                    readOnly={!isEditing}
                                    className={`w-full p-2 sm:p-3 border border-gray-300 rounded-lg text-xs sm:text-sm ${!isEditing ? "bg-gray-100" : "focus:outline-none focus:ring-2 focus:ring-blue-500"}`}
                                />
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
                            className="w-full sm:w-auto p-2 sm:p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs sm:text-sm"
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
                                placeholder="New Password"
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