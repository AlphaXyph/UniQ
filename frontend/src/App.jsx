import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import AdminRegister from "./pages/adminRegister";
import Dashboard from "./pages/dashboard";
import ForgotPassword from "./pages/forgotPassword";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  console.log("ProtectedRoute: Token check:", token);
  if (!token) {
    console.log("ProtectedRoute: No token, redirecting to login");
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  console.log("App: Router initialized");
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin-register/:randomString" element={<AdminRegister />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;