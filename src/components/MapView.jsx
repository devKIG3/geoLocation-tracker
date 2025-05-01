// src/components/MapView.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { db } from "../firebase";
import "leaflet/dist/leaflet.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * ZoneEditor: Allows admin to click on the map
 * and create a geofence zone by specifying a name and radius.
 */
function ZoneEditor({ zonesRef }) {
  useMapEvents({
    click(e) {
      const name = prompt("Enter zone name:");
      if (!name) return;
      const radiusStr = prompt("Enter zone radius in meters:");
      if (!radiusStr) return;
      const radius = parseFloat(radiusStr);
      if (isNaN(radius) || radius <= 0) {
        toast.error("Invalid radius");
        return;
      }
      zonesRef.push({
        name,
        center: { lat: e.latlng.lat, lng: e.latlng.lng },
        radius,
      });
      toast.success(`Zone '${name}' created!`);
    },
  });
  return null;
}

export default function MapView() {
  const [zones, setZones] = useState({});
  const [positions, setPositions] = useState({});
  const zonesRef = useRef(db.ref("zones"));
  const usersRef = useRef({});
  const mapRef = useRef(null);
  const lastToastRef = useRef({}); // Track last toast timestamp per user

  // Fetch user profiles once
  useEffect(() => {
    const usersDbRef = db.ref("users");
    usersDbRef.once("value", (snap) => {
      usersRef.current = snap.val() || {};
    });
  }, []);

  // Subscribe to zones
  useEffect(() => {
    const ref = zonesRef.current;
    ref.on("value", (snap) => {
      setZones(snap.val() || {});
    });
    return () => ref.off();
  }, []);

  // Subscribe to positions and detect exits only when outside all zones
  useEffect(() => {
    const posRef = db.ref("positions");
    const notifRef = db.ref("notifications");

    const handlePos = (snap) => {
      const { lat, lng, ts } = snap.val() || {};
      const uid = snap.key;
      setPositions((prev) => ({ ...prev, [uid]: { lat, lng, ts } }));

      const profile = usersRef.current[uid] || {};
      if (profile.role === "admin" || !profile.email) return;

      // Check if user is inside any zone
      let insideAny = false;
      Object.values(zones).forEach((zone) => {
        const dist = L.latLng(lat, lng).distanceTo(
          L.latLng(zone.center.lat, zone.center.lng)
        );
        if (dist <= zone.radius) {
          insideAny = true;
        }
      });

      // If user is outside ALL zones, maybe toast
      if (!insideAny) {
        const now = Date.now();
        const last = lastToastRef.current[uid] || 0;
        // Only toast if last toast was over 30s ago
        if (now - last > 30_000) {
          toast.warning(
            `🚨 ${profile.email} is outside all zones as of ${new Date(
              ts
            ).toLocaleTimeString()}`
          );
          lastToastRef.current[uid] = now;
          notifRef.push({ userId: uid, ts: now });
        }
      }
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
  }, [zones]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} />
      <MapContainer
        center={[36.75, 3.04]}
        zoom={13}
        whenCreated={(map) => (mapRef.current = map)}
        className="flex-grow-1"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <ZoneEditor zonesRef={zonesRef.current} />

        {Object.entries(zones).map(([zoneId, zone]) => (
          <Circle
            key={zoneId}
            center={[zone.center.lat, zone.center.lng]}
            radius={zone.radius}
            pathOptions={{ color: "red", fillOpacity: 0.2 }}
            eventHandlers={{
              click: (e) => {
                e.originalEvent.stopPropagation();
                if (window.confirm(`Delete zone '${zone.name || zoneId}'?`)) {
                  zonesRef.current.child(zoneId).remove();
                  toast.info(`Zone '${zone.name || zoneId}' deleted`);
                }
              },
            }}
          >
            <Popup>{zone.name}</Popup>
          </Circle>
        ))}

        {Object.entries(positions)
          .filter(([uid]) => {
            const prof = usersRef.current[uid] || {};
            return prof.email && prof.role !== "admin";
          })
          .map(([uid, { lat, lng, ts }]) => (
            <Marker key={uid} position={[lat, lng]}>
              <Popup>
                <strong>{usersRef.current[uid].email}</strong>
                <br />
                Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
                <br />
                <small>{new Date(ts).toLocaleTimeString()}</small>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </>
  );
}
