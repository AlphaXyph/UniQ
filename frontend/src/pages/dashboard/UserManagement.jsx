import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Popup from "../../components/Popup";
import API from "../../../api";

function UserManagement() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [popup, setPopup] = useState({ message: "", type: "success" });
    const [expandedUserId, setExpandedUserId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [confirmInput, setConfirmInput] = useState("");
    const user = JSON.parse(localStorage.getItem("user")) || {};

    useEffect(() => {
        if (user.role !== "admin") {
            setPopup({ message: "Access denied. Admins only.", type: "error" });
            setTimeout(() => navigate("/dashboard"), 2000);
            return;
        }

        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await API.get("/auth/users", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUsers(response.data);
                setFilteredUsers(response.data);
            } catch (err) {
                setPopup({ message: err.response?.data?.msg || "Failed to fetch users", type: "error" });
            }
        };

        fetchUsers();
    }, [navigate, user.role]);

    useEffect(() => {
        const filtered = users.filter((u) =>
            `${u.name} ${u.surname}`.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredUsers(filtered);
    }, [searchQuery, users]);

    const closePopup = () => {
        setPopup({ message: "", type: "success" });
        setDeleteConfirm(null);
        setConfirmInput("");
    };

    const toggleDetails = (userId) => {
        setExpandedUserId(expandedUserId === userId ? null : userId);
    };

    const handleDelete = async (input) => {
        if (input !== "YES") {
            setPopup({ message: "Please type 'YES' to confirm deletion", type: "error" });
            return;
        }
        try {
            const token = localStorage.getItem("token");
            await API.delete(`/auth/users/${deleteConfirm._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(users.filter((u) => u._id !== deleteConfirm._id));
            setFilteredUsers(filteredUsers.filter((u) => u._id !== deleteConfirm._id));
            setPopup({ message: "User deleted successfully", type: "success" });
            setExpandedUserId(null);
        } catch (err) {
            setPopup({ message: err.response?.data?.msg || "Failed to delete user", type: "error" });
        }
        setDeleteConfirm(null);
        setConfirmInput("");
    };

    const admins = filteredUsers.filter((u) => u.role === "admin");
    const regularUsers = filteredUsers.filter((u) => u.role === "user");

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
            <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6">
                <Popup
                    message={
                        deleteConfirm
                            ? `Are you sure you want to delete ${deleteConfirm.name} ${deleteConfirm.surname}'s account?`
                            : popup.message
                    }
                    type={deleteConfirm ? "warning" : popup.type}
                    onClose={closePopup}
                    confirmAction={deleteConfirm ? handleDelete : null}
                    confirmInput={confirmInput}
                    setConfirmInput={setConfirmInput}
                />
                <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                    <i className="fa-solid fa-users-cog"></i> User Management
                </h2>

                {/* Search Bar */}
                <div className="mb-4 sm:mb-6">
                    <input
                        type="text"
                        placeholder="Search by name or surname..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    />
                </div>

                {/* Admins Section */}
                <div className="mb-6 sm:mb-8">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Admins</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full table-fixed border border-gray-200 rounded-lg shadow-md">
                            <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-left w-[40%] text-xs sm:text-sm">Name</th>
                                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-left w-[20%] text-xs sm:text-sm">Role</th>
                                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-left w-[40%] text-xs sm:text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {admins.map((admin) => (
                                    <React.Fragment key={admin._id}>
                                        <tr className="border-b hover:bg-gray-50">
                                            <td className="py-2 sm:py-3 px-2 sm:px-4 w-[40%] text-xs sm:text-sm truncate">{`${admin.name} ${admin.surname}`}</td>
                                            <td className="py-2 sm:py-3 px-2 sm:px-4 w-[20%] text-xs sm:text-sm">{admin.role}</td>
                                            <td className="py-2 sm:py-3 px-2 sm:px-4 w-[40%] text-xs sm:text-sm">
                                                <button
                                                    onClick={() => toggleDetails(admin._id)}
                                                    className="text-blue-500 hover:text-blue-700 font-semibold"
                                                >
                                                    {expandedUserId === admin._id ? "Hide Details" : "Details"}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedUserId === admin._id && (
                                            <tr>
                                                <td colSpan="3" className="py-2 sm:py-3 px-2 sm:px-4 bg-gray-50">
                                                    <div className="flex flex-col gap-2 text-xs sm:text-sm">
                                                        <p><strong>Email:</strong> {admin.email}</p>
                                                        <p><strong>Role:</strong> {admin.role}</p>
                                                        <button
                                                            onClick={() => setDeleteConfirm(admin)}
                                                            className="mt-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-xs sm:text-sm w-full sm:w-auto"
                                                        >
                                                            Delete Account
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Users Section */}
                <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Users</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full table-fixed border border-gray-200 rounded-lg shadow-md">
                            <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-left w-[40%] text-xs sm:text-sm">Name</th>
                                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-left w-[20%] text-xs sm:text-sm">Role</th>
                                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-left w-[40%] text-xs sm:text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {regularUsers.map((user) => (
                                    <React.Fragment key={user._id}>
                                        <tr className="border-b hover:bg-gray-50">
                                            <td className="py-2 sm:py-3 px-2 sm:px-4 w-[40%] text-xs sm:text-sm truncate">{`${user.name} ${user.surname}`}</td>
                                            <td className="py-2 sm:py-3 px-2 sm:px-4 w-[20%] text-xs sm:text-sm">{user.role}</td>
                                            <td className="py-2 sm:py-3 px-2 sm:px-4 w-[40%] text-xs sm:text-sm">
                                                <button
                                                    onClick={() => toggleDetails(user._id)}
                                                    className="text-blue-500 hover:text-blue-700 font-semibold"
                                                >
                                                    {expandedUserId === user._id ? "Hide Details" : "Details"}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedUserId === user._id && (
                                            <tr>
                                                <td colSpan="3" className="py-2 sm:py-3 px-2 sm:px-4 bg-gray-50">
                                                    <div className="flex flex-col gap-2 text-xs sm:text-sm">
                                                        <p><strong>Email:</strong> {user.email}</p>
                                                        <p><strong>Role:</strong> {user.role}</p>
                                                        <p><strong>Roll Number:</strong> {user.rollNo || "N/A"}</p>
                                                        <p><strong>Year:</strong> {user.year || "N/A"}</p>
                                                        <p><strong>Branch:</strong> {user.branch || "N/A"}</p>
                                                        <p><strong>Division:</strong> {user.division || "N/A"}</p>
                                                        <button
                                                            onClick={() => setDeleteConfirm(user)}
                                                            className="mt-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-xs sm:text-sm w-full sm:w-auto"
                                                        >
                                                            Delete Account
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserManagement;