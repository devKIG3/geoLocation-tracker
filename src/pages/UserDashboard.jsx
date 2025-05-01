// src/pages/UserDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import SessionTracker from "../components/sessionTracker";
export default function UserDashboard() {
  const [pos, setPos] = useState({ lat: 36.75, lng: 3.04, ts: Date.now() });
  const mapRef = useRef();
  const nav = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) return nav("/login"); // not signed in
    // Read your own position
    const ref = db.ref(`positions/${user.uid}`);
    ref.on("value", (snap) => {
      if (snap.exists()) setPos(snap.val());
    });

    // Start writing your geolocation
    console.log(user.email);
    const watcher = navigator.geolocation.watchPosition(
      (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        const ts = Date.now();
        const email = user.email;
        ref.set({ lat, lng, ts, email });
      },
      (e) => console.error("Geo error", e),
      { enableHighAccuracy: true }
    );

    return () => {
      ref.off();
      navigator.geolocation.clearWatch(watcher);
    };
  }, [nav]);

  // Logout handler
  const onLogout = () => {
    auth.signOut().then(() => nav("/login"));
  };

  return (
    <>
      <SessionTracker />{" "}
      <div className="d-flex flex-column vh-100">
        {/* Navbar */}
        <nav className="navbar navbar-dark bg-dark">
          <span className="navbar-text text-white">
            User: <strong>{auth.currentUser?.email}</strong>
          </span>
          <button className="btn btn-outline-light" onClick={onLogout}>
            Logout
          </button>
        </nav>

        {/* Map */}
        <MapContainer
          center={[pos.lat, pos.lng]}
          zoom={13}
          whenCreated={(map) => (mapRef.current = map)}
          className="flex-grow-1"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[pos.lat, pos.lng]}>
            <Popup>
              <div>
                <strong>Your Position</strong>
              </div>
              <div>{new Date(pos.ts).toLocaleString()}</div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </>
  );
}
