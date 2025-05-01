import React from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import MapView from "../components/MapView";
import SessionTracker from "../components/SessionTracker";
export default function AdminDashboard() {
  const nav = useNavigate();
  return (
    <>
      <SessionTracker />
      <div className="d-flex flex-column vh-100">
        <nav className="navbar navbar-dark bg-dark">
          <span className="navbar-text text-white">
            Admin: <strong>{auth.currentUser?.email}</strong>
          </span>
          <button
            className="btn btn-outline-light"
            onClick={() => {
              auth.signOut();
              nav("/login");
            }}
          >
            Logout
          </button>
        </nav>
        <div className="flex-grow-1 d-flex">
          <Sidebar />
          <MapView />
        </div>
      </div>
    </>
  );
}
