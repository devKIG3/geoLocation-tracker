// main.jsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { auth } from "./firebase";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
// in src/index.js or App.js (wherever your app bootstraps)
import "leaflet/dist/leaflet.css";

import "./index.css";

function Root() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for Firebase to restore the user (or not)
    const unsub = auth.onAuthStateChanged(() => setReady(true));
    return unsub;
  }, []);

  // Show a loader until Firebase has finished initializing
  if (!ready) {
    return <div className="text-center mt-5">Initializing…</div>;
  }

  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
