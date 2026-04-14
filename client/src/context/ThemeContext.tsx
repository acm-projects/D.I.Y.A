import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth0();
  const [theme, setThemeState] = useState<Theme>("light");

  // Load theme from Firestore on auth
  useEffect(() => {
    const uid = user?.sub?.trim();
    if (!uid) return;
    let cancelled = false;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!cancelled && snap.exists()) {
          const data = snap.data() as Record<string, unknown>;
          if (data.theme === "dark") setThemeState("dark");
        }
      } catch {
        // ignore
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [user?.sub]);

  // Apply data-theme attribute to <html> for global CSS
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
