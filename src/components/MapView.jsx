// src/components/MapView.jsx
import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { db } from "../firebase";
import "leaflet/dist/leaflet.css";
import myPinUrl from "../assets/icon.png"; // adjust the path to your icon
const ADMIN_EMAIL = "admin@example.com"; // ← set to your admin’s email
const customIcon = new L.Icon({
  iconUrl: myPinUrl,
  iconSize: [50, 50], // adjust to your image’s dimensions
  iconAnchor: [25, 50], // point of the icon which corresponds to marker’s lat/lng
  popupAnchor: [0, -50], // where popups will open relative to the icon
});
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
        .map(([uid, { lat, lng, ts, email }]) => (
          <Marker key={uid} position={[lat, lng]} icon={customIcon}>
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
