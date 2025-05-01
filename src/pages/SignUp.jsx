// src/pages/SignUp.jsx
import React, { useState } from "react";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [role,  setRole]  = useState("user");
  const [msg,   setMsg]   = useState("");
  const nav = useNavigate();

  const handleSignUp = async () => {
    if (!email || !pass) {
      return setMsg("❌ Email and password are required");
    }
    setMsg("🔄 Creating account…");
    try {
      // 1) Create Auth user
      const { user } = await auth.createUserWithEmailAndPassword(email, pass);
      // 2) Write their role into Realtime-DB
      await db.ref(`users/${user.uid}`).set({
        email,
        role
      });
      setMsg("✅ Account created! Redirecting to login…");
      setTimeout(() => nav("/login"), 800);
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    }
  };

  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div className="card p-4 shadow-sm" style={{ maxWidth: 400, width: "100%" }}>
        <h3 className="card-title text-center mb-3">Sign Up</h3>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={pass}
            onChange={e => setPass(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Role</label>
          <select
            className="form-select"
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          className="btn btn-primary w-100"
          onClick={handleSignUp}
        >
          Sign Up
        </button>

        {msg && (
          <div className={`mt-3 text-center ${msg.startsWith("❌") ? "text-danger" : "text-success"}`}>
            {msg}
          </div>
        )}

        <div className="mt-3 text-center">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
