// Firebase compat for simplicity
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";

const config = {
  apiKey: "AIzaSyBGUd_cVA_rTiwMOKu4I4OC0_gN6zYqTYc",
  authDomain: "geolocation-197f3.firebaseapp.com",
  databaseURL:
    "https://geolocation-197f3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "geolocation-197f3",
  storageBucket: "geolocation-197f3.firebasestorage.app",
  messagingSenderId: "821542586449",
  appId: "1:821542586449:web:a89850544e736d82081070",
  measurementId: "G-BM2VJGVT8C",
};

firebase.initializeApp(config);
firebase
  .auth()
  .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((err) => console.error("Auth Persistence error:", err));
export const auth = firebase.auth();
export const db = firebase.database();
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyBGUd_cVA_rTiwMOKu4I4OC0_gN6zYqTYc",
//   authDomain: "geolocation-197f3.firebaseapp.com",
//   databaseURL: "https://geolocation-197f3-default-rtdb.europe-west1.firebasedatabase.app",
//   projectId: "geolocation-197f3",
//   storageBucket: "geolocation-197f3.firebasestorage.app",
//   messagingSenderId: "821542586449",
//   appId: "1:821542586449:web:a89850544e736d82081070",
//   measurementId: "G-BM2VJGVT8C"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
