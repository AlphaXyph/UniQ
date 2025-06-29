import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api";
import Popup from "../../components/Popup";

function Profile() {
    const [user, setUser] = useState(null);
    const [editedUser, setEditedUser] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [currentPassword, setCurrentPassword] = useState(""); // Ensure it's empty by default
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const navigate = useNavigate();

    useEffect(() => {
        setCurrentPassword(""); // Reset on mount
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedUser((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem("token");
            await API.put("/auth/profile", editedUser, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(editedUser);
            setPopup({ message: "Profile updated successfully!", type: "success" });
            localStorage.setItem("user", JSON.stringify(editedUser));
            setIsEditing(false);
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Update failed", type: "error" });
        }
    };

    const handlePasswordChange = async () => {
        if (newPassword !== confirmNewPassword) {
            setPopup({ message: "New passwords do not match", type: "error" });
            return;
        }
        if (!currentPassword) {
            setPopup({ message: "Please enter your current password", type: "error" });
            return;
        }
        try {
            const token = localStorage.getItem("token");
            await API.post("/auth/change-password", { currentPassword, newPassword }, {
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

    if (!user) return <div>Loading...</div>;

    const fullName = `${user.name || ""} ${user.surname || ""}`.trim();

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center  justify-center p-4">
            <Popup message={popup.message} type={popup.type} onClose={closePopup} />
            <div className="w-full max-w-4xl bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-6">
                    {/* Profile Section */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-center mb-6">Profile</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                            <div className="col-span-full">
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    value={user.email || ""}
                                    readOnly
                                    className="w-full p-2 border rounded focus:outline-none bg-gray-100"
                                />
                            </div>
                            <div className="col-span-full">
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                {isEditing ? (
                                    <div className="flex gap-4">
                                        <input
                                            type="text"
                                            name="name"
                                            value={editedUser.name || ""}
                                            onChange={handleChange}
                                            maxLength={20}
                                            placeholder="Name (max 20 chars)"
                                            className="w-1/2 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="text"
                                            name="surname"
                                            value={editedUser.surname || ""}
                                            onChange={handleChange}
                                            maxLength={20}
                                            placeholder="Surname (max 20 chars)"
                                            className="w-1/2 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={fullName}
                                        readOnly
                                        className="w-full p-2 border rounded focus:outline-none bg-gray-100"
                                    />
                                )}
                            </div>
                            {user.role === "user" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Branch</label>
                                        <input
                                            type="text"
                                            name="branch"
                                            value={editedUser.branch || ""}
                                            onChange={handleChange}
                                            maxLength={15}
                                            readOnly={!isEditing}
                                            className={`w-full p-2 border rounded focus:outline-none ${!isEditing ? "bg-gray-100" : "focus:ring-2 focus:ring-blue-500"}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Division</label>
                                        <input
                                            type="text"
                                            name="division"
                                            value={editedUser.division || ""}
                                            onChange={handleChange}
                                            maxLength={1}
                                            readOnly={!isEditing}
                                            className={`w-full p-2 border rounded focus:outline-none ${!isEditing ? "bg-gray-100" : "focus:ring-2 focus:ring-blue-500"}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Roll Number</label>
                                        <input
                                            type="number"
                                            name="rollNo"
                                            value={editedUser.rollNo || ""}
                                            onChange={handleChange}
                                            max={999}
                                            readOnly={!isEditing}
                                            className={`w-full p-2 border rounded focus:outline-none ${!isEditing ? "bg-gray-100" : "focus:ring-2 focus:ring-blue-500"}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Year</label>
                                        <select
                                            name="year"
                                            value={editedUser.year || ""}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className={`w-full p-2 border rounded focus:outline-none ${!isEditing ? "bg-gray-100" : "focus:ring-2 focus:ring-blue-500"}`}
                                        >
                                            <option value="FY">FY</option>
                                            <option value="SY">SY</option>
                                            <option value="TY">TY</option>
                                            <option value="FOURTH">FOURTH</option>
                                        </select>
                                    </div>
                                </>
                            )}
                            <button
                                onClick={handleEditToggle}
                                className="col-span-full p-2 text-blue-500 hover:text-blue-700"
                            >
                                <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            {isEditing && (
                                <button
                                    onClick={handleSave}
                                    className="col-span-full w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                                >
                                    Save Changes
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full max-w-4xl mt-6 bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-6">
                    {/* Change Password Section */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-center">Change Password</h3>
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative w-full max-w-sm">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    placeholder="Current Password (required)"
                                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    autoComplete="new-password"
                                    name="current-password-unique-123"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showCurrentPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                            <div className="relative w-full max-w-sm">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="New Password"
                                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                    name="new-password-unique-123"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showNewPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                            <div className="relative w-full max-w-sm">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Confirm New Password"
                                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                    name="confirm-password-unique-123"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showNewPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                            <button
                                onClick={handlePasswordChange}
                                className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition duration-300 mt-4"
                            >
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;