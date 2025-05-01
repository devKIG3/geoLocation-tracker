// Firebase compat for simplicity
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";

const config = {
  apiKey: "AIzaSyAKqkQ8ly2Zua2DLfom68bk-WWbAKASmjw",
  authDomain: "geolocation-6475b.firebaseapp.com",
  databaseURL:
    "https://geolocation-6475b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "geolocation-6475b",
  storageBucket: "geolocation-6475b.appspot.com",
  messagingSenderId: "431737859613",
  appId: "1:431737859613:web:2aacedb6b9c0a64b9960f4",
};

firebase.initializeApp(config);
firebase
  .auth()
  .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((err) => console.error("Auth Persistence error:", err));
export const auth = firebase.auth();
export const db = firebase.database();
