// src/components/SessionTracker.jsx
import { useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function SessionTracker() {
  const intervalRef = useRef(null);
  const uidRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      // SIGNED IN → start polling every 5s
      if (user) {
        uidRef.current = user.uid;
        const ref = db.ref(`positions/${user.uid}`);

        const tick = () =>
          navigator.geolocation.getCurrentPosition(
            ({ coords }) =>
              ref.set({
                lat: coords.latitude,
                lng: coords.longitude,
                ts: Date.now(),
              }),
            console.error,
            { enableHighAccuracy: true }
          );

        tick();
        intervalRef.current = setInterval(tick, 5000);

        // SIGNED OUT → cleanup & remove your position
      } else {
        clearInterval(intervalRef.current);
        if (uidRef.current) {
          db.ref(`positions/${uidRef.current}`).remove();
          uidRef.current = null;
        }
      }
    });

    return () => {
      unsub();
      clearInterval(intervalRef.current);
    };
  }, []);

  return null;
}
