// public/firebase-messaging-sw.js

// 1) Load the compat scripts (must be v9 compat builds):
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// 2) Initialize Firebase with your config (copy/paste from firebase.js):
firebase.initializeApp({
  apiKey: "AIzaSyAKqkQ8ly2Zua2DLfom68bk-WWbAKASmjw",
  authDomain: "geolocation-6475b.firebaseapp.com",
  databaseURL:
    "https://geolocation-6475b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "geolocation-6475b",
  storageBucket: "geolocation-6475b.appspot.com",
  messagingSenderId: "431737859613",
  appId: "1:431737859613:web:2aacedb6b9c0a64b9960f4",
});

// 3) Retrieve an instance of Firebase Messaging so it can handle background messages:
const messaging = firebase.messaging();

// 4) Optional: customize how background notifications are shown
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title, {
    body,
    // icon: '/icons/icon-192x192.png'
  });
});
