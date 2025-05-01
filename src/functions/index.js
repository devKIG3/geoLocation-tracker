const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.onPositionChange = functions.database
  .ref("/positions/{uid}")
  .onWrite(async (change, ctx) => {
    const pos = change.after.val();
    if (!pos) return null;
    const zonesSnap = await admin.database().ref("zones").once("value");
    const zones = zonesSnap.val() || {};
    const notRef = admin.database().ref("notifications");
    const { distanceMeters } = require("./geofence"); // or inline haversine

    const tasks = Object.entries(zones).flatMap(([zoneId, z]) => {
      if (distanceMeters(z.center, pos) > z.radius) {
        return [
          notRef.push({ userId: ctx.params.uid, zoneId, ts: Date.now() }),
        ];
      }
      return [];
    });
    return Promise.all(tasks);
  });
