// public/firebase-messaging-sw.js

// 1) Load the compat scripts (must be v9 compat builds):
importScripts(
  "https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js"
);

// 2) Initialize Firebase with your config (copy/paste from firebase.js):
firebase.initializeApp({
  apiKey: "AIzaSyBGUd_cVA_rTiwMOKu4I4OC0_gN6zYqTYc",
  authDomain: "geolocation-197f3.firebaseapp.com",
  databaseURL:
    "https://geolocation-197f3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "geolocation-197f3",
  storageBucket: "geolocation-197f3.firebasestorage.app",
  messagingSenderId: "821542586449",
  appId: "1:821542586449:web:a89850544e736d82081070",
  measurementId: "G-BM2VJGVT8C",
});

// 3) Retrieve an instance of Firebase Messaging so it can handle background messages:
const messaging = firebase.messaging();

// 4) Optional: customize how background notifications are shown
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title, {
    body,
    // icon: '/icons/icon-192x192.png'
  });
});
