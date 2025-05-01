import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import Login           from "./pages/login";
import SignUp          from "./pages/SignUp";          // ← import it
import UserDashboard   from "./pages/UserDashboard";
import AdminDashboard  from "./pages/adminDashboard";

export default function App() {
  return (
    <Routes>
+     <Route path="/signup" element={<SignUp />} />
      <Route path="/login"  element={<Login />} />
      <Route
        path="/user"
        element={
          <PrivateRoute role="user">
            <UserDashboard/>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute role="admin">
            <AdminDashboard/>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
