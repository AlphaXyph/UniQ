import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";

function Login() {
    // State to store form input
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("user"); // admin or user
    const navigate = useNavigate(); // Define navigate

    // Handle form submit
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post("/auth/login", { email, password });
            const { token, user } = res.data;
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            navigate("/dashboard");
        } catch (err) {
            alert(err.response?.data?.msg || "Login failed");
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-96 space-y-4">
                <h2 className="text-2xl font-bold text-center">UniQ Login</h2>

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

                <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
                    Login
                </button>
                <div className="text-center">
                    <p>Don't have an account?</p>
                    <button
                        type="button"
                        onClick={() => navigate("/register")}
                        className="text-blue-600 underline mt-2"
                    >
                        Register Here
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Login;
