import React, { useState } from "react";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    setMsg("Signing in…");
    auth
      .signInWithEmailAndPassword(email, pass)
      .then(({ user }) => db.ref(`users/${user.uid}/role`).once("value"))
      .then((snap) => {
        const role = snap.val();
        navigate(role === "admin" ? "/admin" : "/user");
      })
      .catch((e) => setMsg(`❌ ${e.message}`));
  };

  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div
        className="card p-4 shadow-sm"
        style={{ width: "100%", maxWidth: 400 }}
      >
        <h3 className="card-title text-center mb-3">Sign In</h3>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        </div>

        <button className="btn btn-primary w-100" onClick={handleLogin}>
          Login
        </button>

        {msg && <div className="mt-3 text-center text-danger">{msg}</div>}
      </div>
    </div>
  );
}
