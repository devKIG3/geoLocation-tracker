import React, { createContext, useContext, useRef, useState } from "react";

const MapContext = createContext();

export function MapProvider({ children }) {
  const mapRef = useRef(null);
  const [focusedUser, setFocusedUser] = useState(null);

  return (
    <MapContext.Provider value={{ mapRef, focusedUser, setFocusedUser }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  return useContext(MapContext);
}
