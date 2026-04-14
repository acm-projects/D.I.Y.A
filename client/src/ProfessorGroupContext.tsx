import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth0 } from "@auth0/auth0-react";

type ProfessorGroup = {
  id: string;
  title: string;
  description: string;
  professor: string;
  members: string[];
};

type BackendGroup = {
  id: string;
  title?: string;
  description?: string;
  professor?: string;
  members?: string[];
};

type BackendUser = {
  id: string;
  authId?: string;
  email?: string;
  name?: string;
};

interface ProfessorGroupContextValue {
  groups: ProfessorGroup[];
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string | null) => void;
  isLoading: boolean;
  reload: () => void;
}

const ProfessorGroupContext = createContext<ProfessorGroupContextValue>({
  groups: [],
  selectedGroupId: null,
  setSelectedGroupId: () => {},
  isLoading: true,
  reload: () => {},
});

export function useProfessorGroups() {
  return useContext(ProfessorGroupContext);
}

const GROUPS_API = "/api/groups";
const USERS_API = "/api/users";

export function ProfessorGroupProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth0();
  const [groups, setGroups] = useState<ProfessorGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let isMounted = true;

    const loadGroups = async () => {
      if (!user?.sub) {
        if (isMounted) {
          setGroups([]);
          setSelectedGroupId(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      try {
        const [groupsRes, usersRes] = await Promise.all([
          fetch(GROUPS_API),
          fetch(USERS_API),
        ]);

        if (!groupsRes.ok) throw new Error("Failed to load groups.");

        const allGroups = (await groupsRes.json()) as BackendGroup[];
        const allUsers = usersRes.ok ? ((await usersRes.json()) as BackendUser[]) : [];

        const currentProfessor = allUsers.find((u) => {
          const vals = [u.id, u.authId, u.email, u.name].filter(Boolean);
          return vals.some((v) =>
            [user.sub, user.email, user.name].filter(Boolean).includes(v),
          );
        }) ?? null;

        const professorIds = [
          user.sub,
          user.email,
          user.name,
          currentProfessor?.id,
          currentProfessor?.authId,
        ].filter((v): v is string => Boolean(v));

        const myGroups: ProfessorGroup[] = allGroups
          .filter((g) => professorIds.includes(g.professor ?? ""))
          .map((g) => ({
            id: g.id,
            title: g.title ?? g.id,
            description: g.description ?? "",
            professor: g.professor ?? "",
            members: Array.isArray(g.members) ? g.members : [],
          }));

        if (isMounted) {
          setGroups(myGroups);
          setSelectedGroupId((prev) => {
            if (prev && myGroups.some((g) => g.id === prev)) return prev;
            return myGroups[0]?.id ?? null;
          });
        }
      } catch {
        if (isMounted) {
          setGroups([]);
          setSelectedGroupId(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadGroups();
    return () => { isMounted = false; };
  }, [user?.sub, user?.email, user?.name, reloadKey]);

  const value = useMemo(
    () => ({ groups, selectedGroupId, setSelectedGroupId, isLoading, reload }),
    [groups, selectedGroupId, isLoading],
  );

  return (
    <ProfessorGroupContext.Provider value={value}>
      {children}
    </ProfessorGroupContext.Provider>
  );
}
