// src/components/Sidebar.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import L from "leaflet";

export default function Sidebar() {
  const [users, setUsers] = useState({});
  const [positions, setPositions] = useState({});
  const [zones, setZones] = useState({});

  // Fetch profiles and zones
  useEffect(() => {
    const usersRef = db.ref("users");
    usersRef.once("value", (snap) => setUsers(snap.val() || {}));

    const zonesRef = db.ref("zones");
    zonesRef.on("value", (snap) => setZones(snap.val() || {}));
    return () => zonesRef.off();
  }, []);

  // Subscribe to positions
  useEffect(() => {
    const posRef = db.ref("positions");

    const handleAddOrChange = (snap) => {
      const { lat, lng, ts } = snap.val() || {};
      setPositions((prev) => ({ ...prev, [snap.key]: { lat, lng, ts } }));
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

  // Build entries with outside flag
  const entries = Object.entries(positions)
    .map(([uid, pos]) => {
      const profile = users[uid] || {};
      // must have email and not be admin
      if (profile.role === "admin") return null;
      // check if inside any zone
      const inside = Object.values(zones).some((zone) => {
        const dist = L.latLng(pos.lat, pos.lng).distanceTo(
          L.latLng(zone.center.lat, zone.center.lng)
        );
        return dist <= zone.radius;
      });

      return {
        uid,
        email: profile.email,
        lat: pos.lat,
        lng: pos.lng,
        ts: pos.ts,
        outside: !inside,
      };
    })
    .filter(Boolean)
    // sort by timestamp desc
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
        {entries.map(({ uid, email, lat, lng, ts, outside }) => (
          <li
            key={uid}
            className={`list-group-item d-flex flex-column ${
              outside ? "bg-danger text-white" : ""
            }`}
          >
            <strong>{email}</strong>
            <small>
              Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
            </small>
            <small>{new Date(ts).toLocaleTimeString()}</small>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="list-group-item text-muted">No active users.</li>
        )}
      </ul>
    </div>
  );
}
