// src/pages/UserDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import SessionTracker from "../components/sessionTracker";
import "leaflet/dist/leaflet.css";

// Ensure default marker icon loads in production
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadowUrl from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl: iconShadowUrl,
});

export default function UserDashboard() {
  const [pos, setPos] = useState({ lat: 36.75, lng: 3.04, ts: Date.now() });
  const mapRef = useRef();
  const nav = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return nav("/login");

    const ref = db.ref(`positions/${user.uid}`);
    // Listen for own position
    ref.on("value", (snap) => {
      if (snap.exists()) setPos(snap.val());
    });

    // Start geolocation watch
    const watcher = navigator.geolocation.watchPosition(
      (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        const ts = Date.now();
        ref.set({ lat, lng, ts });
      },
      console.error,
      { enableHighAccuracy: true }
    );

    return () => {
      // Cleanup watch and DB listener
      navigator.geolocation.clearWatch(watcher);
      ref.off();
    };
  }, [nav]);

  // Logout: remove position then sign out
  const onLogout = () => {
    const user = auth.currentUser;
    if (user) {
      db.ref(`positions/${user.uid}`)
        .remove()
        .catch((err) => console.error("Error removing position:", err))
        .finally(() => {
          auth
            .signOut()
            .then(() => nav("/login"))
            .catch((err) => console.error("Sign-out error:", err));
        });
    } else {
      auth
        .signOut()
        .then(() => nav("/login"))
        .catch((err) => console.error("Sign-out error:", err));
    }
  };

  return (
    <>
      <SessionTracker />
      <div className="d-flex flex-column vh-100">
        <nav className="navbar navbar-dark bg-dark">
          <span className="navbar-text text-white">
            User: <strong>{auth.currentUser?.email}</strong>
          </span>
          <button className="btn btn-outline-light" onClick={onLogout}>
            Logout
          </button>
        </nav>

        <MapContainer
          center={[pos.lat, pos.lng]}
          zoom={13}
          whenCreated={(map) => (mapRef.current = map)}
          className="flex-grow-1"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[pos.lat, pos.lng]}>
            <Popup>
              <strong>Your Position</strong>
              <br />
              {new Date(pos.ts).toLocaleString()}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </>
  );
}
