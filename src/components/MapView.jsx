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
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadowUrl from "leaflet/dist/images/marker-shadow.png";
import { db } from "../firebase";
import { toast, ToastContainer } from "react-toastify";
import "leaflet/dist/leaflet.css";
import "react-toastify/dist/ReactToastify.css";
import { useMapContext } from "../context/MapContext";

L.Icon.Default.mergeOptions({
  iconUrl,
  shadowUrl: iconShadowUrl,
});

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
  const notifRef = useRef(db.ref("notifications"));
  const lastToastRef = useRef({});
  const { mapRef, focusedUser } = useMapContext(); // context

  useEffect(() => {
    const usersDbRef = db.ref("users");
    usersDbRef.once("value", (snap) => {
      usersRef.current = snap.val() || {};
    });
  }, []);

  useEffect(() => {
    const ref = zonesRef.current;
    ref.on("value", (snap) => {
      setZones(snap.val() || {});
    });
    return () => ref.off();
  }, []);

  useEffect(() => {
    const posRef = db.ref("positions");
    const gpsRef = db.ref("GPS");

    // Helper: Common zone check for any user
    const handleZoneCheck = (uid, lat, lng) => {
      const profile = usersRef.current[uid] || {};
      if (profile.role === "admin" || !profile.email) return;
      if (Object.keys(zones).length === 0) return;

      const isInside = Object.values(zones).some((zone) => {
        const dist = L.latLng(lat, lng).distanceTo(
          L.latLng(zone.center.lat, zone.center.lng)
        );
        return dist <= zone.radius;
      });

      if (!isInside) {
        const now = Date.now();
        const last = lastToastRef.current[uid] || 0;
        if (now - last > 30000) {
          toast.warning(
            `🚨 ${
              profile.email === "gps.device@tracker.local" ? "GPS" : profile.email.split('@')[0]
            } is outside all zones`
          );
          lastToastRef.current[uid] = now;
          notifRef.current.push({ userId: uid, ts: now });
        }
      }
    };

    // Firebase: Handle user positions
    const handlePos = (snap) => {
      const { lat, lng } = snap.val() || {};
      const uid = snap.key;
      if (lat == null || lng == null) return;

      setPositions((prev) => ({ ...prev, [uid]: { lat, lng } }));
      handleZoneCheck(uid, lat, lng);
    };

    const handleRemove = (snap) => {
      setPositions((prev) => {
        const next = { ...prev };
        delete next[snap.key];
        return next;
      });
    };

    // Firebase: Handle GPS device like a user
    const handleGPS = (snap) => {
      const data = snap.val();
      if (!data?.Latitude || !data?.Longitude) return;

      const lat = parseFloat(data.Latitude);
      const lng = parseFloat(data.Longitude);
      const uid = "gps_device";

      setPositions((prev) => ({
        ...prev,
        [uid]: { lat, lng },
      }));

      if (!usersRef.current[uid]) {
        usersRef.current[uid] = {
          email: "gps.device@tracker.local",
          role: "user",
        };
      }

      handleZoneCheck(uid, lat, lng);
    };

    // Listeners
    posRef.on("child_added", handlePos);
    posRef.on("child_changed", handlePos);
    posRef.on("child_removed", handleRemove);
    gpsRef.on("value", handleGPS);

    // Cleanup
    return () => {
      posRef.off("child_added", handlePos);
      posRef.off("child_changed", handlePos);
      posRef.off("child_removed", handleRemove);
      gpsRef.off("value", handleGPS);
    };
  }, [zones]);

  useEffect(() => {
    const gpsRef = db.ref("GPS");

    const handleGPS = (snap) => {
      const data = snap.val();
      if (data?.Latitude && data?.Longitude) {
        const lat = parseFloat(data.Latitude);
        const lng = parseFloat(data.Longitude);
        setPositions((prev) => ({
          ...prev,
          gps_user: { lat, lng },
        }));
      }
    };

    gpsRef.on("value", handleGPS);
    return () => gpsRef.off("value", handleGPS);
  }, []);

  // Center on focused user
  useEffect(() => {
    if (focusedUser && mapRef.current && focusedUser.lat && focusedUser.lng) {
      mapRef.current.setView([focusedUser.lat, focusedUser.lng], 16, {
        animate: true,
      });
    }
  }, [focusedUser]);

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
            return uid === "gps_user" || (prof.email && prof.role !== "admin");
          })
          .map(([uid, { lat, lng }]) => (
            <Marker key={uid} position={[lat, lng]}>
              <Popup>
                <strong>{usersRef.current[uid]?.email.split('@')[0] || "GPS"}</strong>
                <br />
                Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </>
  );
}
