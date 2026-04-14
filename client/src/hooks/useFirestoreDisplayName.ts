import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Reads the user's display name from their Firestore user document.
 * Returns the saved name or null if not set / still loading.
 */
export function useFirestoreDisplayName(userDocId: string | undefined) {
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!userDocId) return;

    let cancelled = false;

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "users", userDocId));
        if (!cancelled && snap.exists()) {
          const data = snap.data() as Record<string, unknown>;
          const name = typeof data.displayName === "string" && data.displayName.trim()
            ? data.displayName.trim()
            : typeof data.name === "string" && data.name.trim()
              ? data.name.trim()
              : null;
          setDisplayName(name);
        }
      } catch {
        // silently fall back to null
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [userDocId]);

  return displayName;
}
