// src/components/MapView.jsx
import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { db } from "../firebase";
import "leaflet/dist/leaflet.css";

export default function MapView() {
  const [zones, setZones] = useState({});
  const [positions, setPositions] = useState({});
  const zonesRefContainer = useRef({});
  const mapRef = useRef(null);

  // Subscribe to zones
  useEffect(() => {
    const zonesRef = db.ref("zones");
    zonesRef.on("value", (snap) => {
      const z = snap.val() || {};
      setZones(z);
      zonesRefContainer.current = z;
    });
    return () => zonesRef.off();
  }, []);

  // Subscribe to position child events (add/change/remove)
  useEffect(() => {
    const posRef = db.ref("positions");
    const notifRef = db.ref("notifications");

    const handlePos = (snap) => {
      const { lat, lng, ts } = snap.val() || {};
      // Update or add marker
      setPositions((prev) => ({ ...prev, [snap.key]: { lat, lng, ts } }));

      // Check zone exit
      Object.entries(zonesRefContainer.current).forEach(([zoneId, zone]) => {
        const dist = L.latLng(lat, lng).distanceTo(
          L.latLng(zone.center.lat, zone.center.lng)
        );
        if (dist > zone.radius) {
          notifRef.push({ userId: snap.key, zoneId, ts: Date.now() });
        }
      });
    };

    const handleRemove = (snap) => {
      // Remove marker
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

  // Listen for notifications
  useEffect(() => {
    const notifRef = db.ref("notifications");
    const handleNotif = (snap) => {
      const { userId, zoneId, ts } = snap.val();
      alert(
        `🚨 User ${userId} left zone ${zoneId} at ${new Date(
          ts
        ).toLocaleTimeString()}`
      );
    };
    notifRef.on("child_added", handleNotif);
    return () => notifRef.off("child_added", handleNotif);
  }, []);

  // Optional: log connection status
  useEffect(() => {
    const connRef = db.ref(".info/connected");
    connRef.on("value", (snap) => {
      console.log("Firebase connected:", snap.val());
    });
    return () => connRef.off();
  }, []);

  return (
    <MapContainer
      center={[36.75, 3.04]}
      zoom={13}
      whenCreated={(map) => (mapRef.current = map)}
      className="flex-grow-1"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Draw each zone as a red circle */}
      {Object.values(zones).map((zone, idx) => (
        <Circle
          key={idx}
          center={[zone.center.lat, zone.center.lng]}
          radius={zone.radius}
          pathOptions={{ color: "red", fillOpacity: 0.2 }}
        />
      ))}

      {/* Draw each user's marker */}
      {Object.entries(positions).map(([uid, { lat, lng, ts }]) => (
        <Marker key={uid} position={[lat, lng]}>
          <Popup>
            <strong>{uid}</strong>
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
