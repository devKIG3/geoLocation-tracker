import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import L from "leaflet";
import { useMapContext } from "../context/MapContext";

export default function Sidebar() {
  const [users, setUsers] = useState({});
  const [positions, setPositions] = useState({});
  const [zones, setZones] = useState({});
  const [gpsDevice, setGpsDevice] = useState(null);
  const { setFocusedUser } = useMapContext();

  // Fetch profiles and zones
  useEffect(() => {
    db.ref("users").once("value", (snap) => setUsers(snap.val() || {}));
    const zonesRef = db.ref("zones");
    zonesRef.on("value", (snap) => setZones(snap.val() || {}));
    return () => zonesRef.off();
  }, []);

  // Listen to /positions
  useEffect(() => {
    const posRef = db.ref("positions");

    const handleAddOrChange = (snap) => {
      const { lat, lng } = snap.val() || {};
      setPositions((prev) => ({ ...prev, [snap.key]: { lat, lng } }));
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

  // Listen to /GPS
  useEffect(() => {
    const gpsRef = db.ref("GPS");
    gpsRef.on("value", (snap) => {
      const data = snap.val();
      console.log(data);
      if (data?.Latitude != null && data?.Longitude != null) {
        setGpsDevice({
          lat: parseFloat(data.Latitude),
          lng: parseFloat(data.Longitude),
        });
      } else {
        setGpsDevice(null);
      }
    });
    return () => db.ref("GPS").off();
  }, []);

  // Build regular tracked entries
  const entries = Object.entries(positions)
    .map(([uid, pos]) => {
      const profile = users[uid] || {};
      if (profile.role === "admin") return null;

      const hasZones = Object.keys(zones).length > 0;
      let isOutside = false;

      if (hasZones) {
        isOutside = !Object.values(zones).some((zone) => {
          const dist = L.latLng(pos.lat, pos.lng).distanceTo(
            L.latLng(zone.center.lat, zone.center.lng)
          );
          return dist <= zone.radius;
        });
      }

      return {
        uid,
        email: profile.email || "Unknown User",
        lat: pos.lat,
        lng: pos.lng,
        outside: hasZones ? isOutside : false,
      };
    })
    .filter(Boolean);
  console.log("Tracked Users:", gpsDevice);
  return (
    <div className="border-end" style={{ width: 250 }}>
      <div className="p-3 bg-light">
        <h5 className="mb-0">Tracked Users</h5>
      </div>
      <ul
        className="list-group list-group-flush overflow-auto"
        style={{ maxHeight: "calc(100vh - 56px)" }}
      >
        {/* GPS Device Entry */}
        {gpsDevice && (
          <li
            className="list-group-item d-flex flex-column bg-info text-white"
            style={{ cursor: "pointer" }}
            onClick={() =>
              setFocusedUser({
                uid: "gps_device",
                lat: gpsDevice.lat,
                lng: gpsDevice.lng,
              })
            }
          >
            <strong>GPS Device</strong>
            <small>
              Lat: {gpsDevice.lat.toFixed(5)}, Lng: {gpsDevice.lng.toFixed(5)}
            </small>
          </li>
        )}

        {/* Dynamic users from /positions */}
        {entries.map(({ uid, email, lat, lng, outside }) => (
          <li
            key={uid}
            className={`list-group-item d-flex flex-column ${
              outside ? "bg-danger text-white" : ""
            }`}
            style={{ cursor: "pointer" }}
            onClick={() => {
              if (lat != null && lng != null) {
                setFocusedUser({ uid, lat, lng });
              }
            }}
          >
            <strong>{email}</strong>
            <small>
              Lat: {lat?.toFixed(5) ?? "N/A"}, Lng: {lng?.toFixed(5) ?? "N/A"}
            </small>
          </li>
        ))}

        {entries.length === 0 && !gpsDevice && (
          <li className="list-group-item text-muted">No tracked users.</li>
        )}
      </ul>
    </div>
  );
}
