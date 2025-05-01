import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { auth, db } from "../firebase"; // your compat import
import { useNavigate } from "react-router-dom";
import SessionTracker from "../components/sessionTracker";

export default function UserDashboard() {
  const [pos, setPos] = useState({ lat: 36.75, lng: 3.04, ts: Date.now() });
  const [authChecked, setAuthChecked] = useState(false);
  const mapRef = useRef();
  const nav = useNavigate();
  const watchRef = useRef(null);

  useEffect(() => {
    // 1) Listen for Firebase to restore the user from localStorage
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // No logged-in user → send to /login
        nav("/login");
      } else {
        // We have a user; subscribe to their position in RTDB
        const posRef = db.ref(`positions/${user.uid}`);
        posRef.on("value", (snap) => {
          if (snap.exists()) {
            setPos(snap.val());
          }
        });
        // 2) Start geolocation AFTER auth is known
        watchRef.current = navigator.geolocation.watchPosition(
          (p) => {
            const lat = p.coords.latitude;
            const lng = p.coords.longitude;
            const ts = Date.now();
            const email = user.email;
            posRef.set({ lat, lng, ts, email });
          },
          (err) => console.error("Geo error", err),
          { enableHighAccuracy: true }
        );
      }
      // In either case—user or no user—we’re done checking
      setAuthChecked(true);
    });

    return () => {
      unsubscribe();
      // Clean up geolocation watcher
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, [nav]);

  // 3) Don’t render the map until we know auth state
  if (!authChecked) {
    return <div>Loading…</div>;
  }

  return (
    <>
      <SessionTracker />
      <div className="d-flex flex-column vh-100">
        <nav className="navbar navbar-dark bg-dark">
          <span className="navbar-text text-white">
            User: <strong>{auth.currentUser?.email}</strong>
          </span>
          <button
            className="btn btn-outline-light"
            onClick={() => auth.signOut().then(() => nav("/login"))}
          >
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
