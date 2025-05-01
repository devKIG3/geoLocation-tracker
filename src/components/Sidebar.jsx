// src/components/Sidebar.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";

const ACTIVE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export default function Sidebar() {
  const [users, setUsers] = useState({});
  const [positions, setPositions] = useState({});

  useEffect(() => {
    // 1) Fetch all user profiles once
    const usersRef = db.ref("users");
    usersRef.once("value", (snap) => {
      setUsers(snap.val() || {});
    });

    // 2) Subscribe to position child events
    const posRef = db.ref("positions");

    const handleAddOrChange = (snap) => {
      const { lat, lng, ts } = snap.val() || {};
      setPositions((prev) => ({
        ...prev,
        [snap.key]: { lat, lng, ts },
      }));
    };

    const handleRemove = (snap) => {
      setPositions((prev) => {
        const next = { ...prev };
        delete next[snap.key];
        return next;
      });
    };

    posRef.on("child_added", handleAddOrChange);
    posRef.on("child_changed", handleAddOrChange);
    posRef.on("child_removed", handleRemove);

    return () => {
      posRef.off("child_added", handleAddOrChange);
      posRef.off("child_changed", handleAddOrChange);
      posRef.off("child_removed", handleRemove);
    };
  }, []);
  console.log(positions);
  // 3) Build and filter entries
  const entries = Object.entries(positions)
    .map(([uid, pos]) => {
      const profile = users[uid] || {};
      return {
        uid,
        email: profile.email,
        role: profile.role,
        ...pos,
      };
    })
    // 4) Keep admins always, others only if recent
    .filter(({ role, ts }) =>
      role === "admin" ? true : Date.now() - ts <= ACTIVE_WINDOW_MS
    )
    // 5) Sort newest first (admins will be interleaved by ts)
    .sort((a, b) => b.ts - a.ts);

  return (
    <div className="border-end" style={{ width: 250 }}>
      <div className="p-3 bg-light">
        <h5 className="mb-0">Active Tracked Users</h5>
      </div>
      <ul
        className="list-group list-group-flush overflow-auto"
        style={{ maxHeight: "calc(100vh - 56px)" }}
      >
        {entries.map(({ uid, email, lat, lng, ts, role }) => (
          <li key={uid} className="list-group-item">
            <strong>
              {email || uid}{" "}
              {role === "admin" && (
                <span className="badge bg-secondary">admin</span>
              )}
            </strong>
            <br />
            Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
            <br />
            <small>{new Date(ts).toLocaleTimeString()}</small>
          </li>
        ))}

        {entries.length === 0 && (
          <li className="list-group-item text-muted">
            No active users in the last 5 minutes.
          </li>
        )}
      </ul>
    </div>
  );
}