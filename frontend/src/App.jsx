import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import AdminRegister from "./pages/adminRegister";
import Dashboard from "./pages/dashboard";

function App() {
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin-register/:randomString" element={<AdminRegister />} />
      <Route path="/dashboard/*" element={isLoggedIn ? <Dashboard /> : <Navigate to="/" />} />
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;