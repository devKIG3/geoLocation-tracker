// src/components/MapView.jsx
import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { db } from "../firebase";
import "leaflet/dist/leaflet.css";

const ADMIN_EMAIL = "admin@example.com"; // ← set to your admin’s email

export default function MapView() {
  const [zones, setZones] = useState({});
  const [positions, setPositions] = useState({});
  const zonesRefContainer = useRef({});
  const mapRef = useRef(null);

  // … zones subscription stays the same …

  // Subscribe to positions
  useEffect(() => {
    const posRef = db.ref("positions");
    const notifRef = db.ref("notifications");

    const handlePos = (snap) => {
      const { lat, lng, ts, email } = snap.val() || {};
      if (!email || email === ADMIN_EMAIL) return; // ← skip admin

      // store full payload, including email
      setPositions((prev) => ({
        ...prev,
        [snap.key]: { lat, lng, ts, email },
      }));

      // … your zone-exit logic …
    };

    const handleRemove = (snap) => {
      setPositions((prev) => {
        const next = { ...prev };
        delete next[snap.key];
        return next;
      });
    };

    posRef.on("child_added", handlePos);
    posRef.on("child_changed", handlePos);
    posRef.on("child_removed", handleRemove);
    return () => {
      posRef.off("child_added", handlePos);
      posRef.off("child_changed", handlePos);
      posRef.off("child_removed", handleRemove);
    };
  }, []);

  // … notifications & connection effects stay the same …

  return (
    <MapContainer
      center={[36.75, 3.04]}
      zoom={13}
      whenCreated={(map) => (mapRef.current = map)}
      className="flex-grow-1"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {Object.values(zones).map((zone, i) => (
        <Circle
          key={i}
          center={[zone.center.lat, zone.center.lng]}
          radius={zone.radius}
          pathOptions={{ color: "red", fillOpacity: 0.2 }}
        />
      ))}

      {Object.entries(positions)
        // if you didn’t filter in handlePos, you could filter here instead:
        // .filter(([_, pos]) => pos.email !== ADMIN_EMAIL)
        .map(([uid, { lat, lng, ts, email }]) => (
          <Marker key={uid} position={[lat, lng]}>
            <Popup>
              <strong>{email}</strong>
              <br />
              Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
              <br />
              <small>{new Date(ts).toLocaleTimeString()}</small>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
