import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("user");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await API.post("/auth/register", { email, password, role });
            alert("Registered! Please login.");
            navigate("/");
        } catch (err) {
            alert(err.response?.data?.msg || "Register failed");
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <form onSubmit={handleRegister} className="bg-white p-8 rounded shadow-md w-96 space-y-4">
                <h2 className="text-2xl font-bold text-center">Register</h2>

                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2 border rounded"
                >
                    <option value="user">Student</option>
                    <option value="admin">Teacher</option>
                </select>

                <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-2 border rounded"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-2 border rounded"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">
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
