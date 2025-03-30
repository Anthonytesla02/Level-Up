import { createContext, useContext, useEffect, useState } from "react";

type Fonts = {
  loaded: boolean;
};

const FontsContext = createContext<Fonts>({ loaded: false });

export function FontsProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Check if the document is available
    if (typeof document !== "undefined") {
      // Check if the fonts are already loaded
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          setLoaded(true);
        });
      } else {
        // Fallback for browsers that don't support document.fonts
        // Wait a bit to allow fonts to load
        setTimeout(() => {
          setLoaded(true);
        }, 500);
      }
    }
  }, []);

  return (
    <FontsContext.Provider value={{ loaded }}>
      {children}
    </FontsContext.Provider>
  );
}

export function useFonts() {
  return useContext(FontsContext);
}
