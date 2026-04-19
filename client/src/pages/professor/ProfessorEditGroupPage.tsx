import { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

const courseTitle = "CS 1337 — Computer Science I";

interface Student {
  id: string;
  name: string;
  email: string;
  status: "active" | "pending";
}

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
  name?: string;
  email?: string;
  groups?: string[];
};

const GROUPS_API_BASE_URL = "/api/groups";
const USERS_API_BASE_URL = "/api/users";

export function ProfessorEditGroupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth0();
  const [students, setStudents] = useState<Student[]>([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [createGroupTitle, setCreateGroupTitle] = useState("");
  const [createGroupDescription, setCreateGroupDescription] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [groupNameEdit, setGroupNameEdit] = useState(courseTitle);
  const [groupDescription, setGroupDescription] = useState("Introduction to Computer Science - Fall 2026");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupProfessor, setGroupProfessor] = useState("");
  const [persistedMemberIds, setPersistedMemberIds] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<BackendUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const currentProfessorUser = useMemo(() => {
    const authIdentifiers = [user?.sub, user?.email, user?.name].filter((value): value is string => Boolean(value));

    return allUsers.find((liveUser) => {
      const candidateValues = [liveUser.id, liveUser.authId, liveUser.email, liveUser.name].filter(
        (value): value is string => Boolean(value),
      );

      return candidateValues.some((value) => authIdentifiers.includes(value));
    }) ?? null;
  }, [allUsers, user?.email, user?.name, user?.sub]);

  const activeCount = useMemo(
    () => students.filter((student) => student.status === "active").length,
    [students],
  );

  const pendingCount = useMemo(
    () => students.filter((student) => student.status === "pending").length,
    [students],
  );

  useEffect(() => {
    let isMounted = true;

    const loadGroupData = async () => {
      if (!user?.sub) {
        if (isMounted) {
          setGroupId(null);
          setGroupProfessor("");
          setPersistedMemberIds([]);
          setAllUsers([]);
          setStudents([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);
      setEmptyStateMessage(null);

      try {
        const [groupsResponse, usersResponse] = await Promise.all([
          fetch(GROUPS_API_BASE_URL),
          fetch(USERS_API_BASE_URL),
        ]);

        if (!groupsResponse.ok) {
          throw new Error(t("edit.errors.loadGroups"));
        }

        if (!usersResponse.ok) {
          throw new Error(t("edit.errors.loadUsers"));
        }

        const groups = (await groupsResponse.json()) as BackendGroup[];
        const users = (await usersResponse.json()) as BackendUser[];

        const currentProfessor = users.find((liveUser) => {
          const candidateValues = [liveUser.id, liveUser.authId, liveUser.email, liveUser.name].filter(
            (value): value is string => Boolean(value),
          );

          return candidateValues.some((value) => [user.sub, user.email, user.name].filter((item): item is string => Boolean(item)).includes(value));
        }) ?? null;

        const professorIdentifiers = [user.sub, user.email, user.name, currentProfessor?.id, currentProfessor?.authId].filter(
          (value): value is string => Boolean(value),
        );

        const selectedGroup =
          groups.find((group) => professorIdentifiers.includes(group.professor ?? "")) ?? null;

        if (!selectedGroup) {
          if (isMounted) {
            setGroupId(null);
            setGroupProfessor("");
            setStudents([]);
            setPersistedMemberIds([]);
            setAllUsers(users);
            setEmptyStateMessage(t("edit.errors.empty"));
          }
          return;
        }

        const userByKey = new Map<string, BackendUser>();
        users.forEach((liveUser) => {
          userByKey.set(liveUser.id, liveUser);
          if (liveUser.authId) {
            userByKey.set(liveUser.authId, liveUser);
          }
        });

        const mappedStudents = (selectedGroup.members ?? []).map((memberId) => {
          const matchedUser = userByKey.get(memberId);
          return {
            id: matchedUser?.id ?? memberId,
            name: matchedUser?.name || matchedUser?.email || memberId,
            email: matchedUser?.email || t("edit.fallbacks.noEmail"),
            status: matchedUser ? "active" as const : "pending" as const,
          };
        });

        if (isMounted) {
          setGroupId(selectedGroup.id);
          setGroupProfessor(selectedGroup.professor ?? user.sub);
          setGroupNameEdit(selectedGroup.title ?? courseTitle);
          setGroupDescription(selectedGroup.description ?? "");
          setStudents(mappedStudents);
          setPersistedMemberIds(mappedStudents.map((student) => student.id));
          setAllUsers(users);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : t("edit.errors.loadGroupData"));
          setGroupId(null);
          setPersistedMemberIds([]);
          setStudents([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadGroupData();

    return () => {
      isMounted = false;
    };
  }, [reloadKey, user?.email, user?.name, user?.sub]);

  const getUpdatedGroupsForUser = (liveUser: BackendUser, nextMemberIds: string[]) => {
    const currentGroups = Array.isArray(liveUser.groups) ? liveUser.groups : [];

    if (!groupId) {
      return currentGroups;
    }

    const isMember = nextMemberIds.includes(liveUser.id) || (liveUser.authId ? nextMemberIds.includes(liveUser.authId) : false);

    return isMember
      ? Array.from(new Set([...currentGroups, groupId]))
      : currentGroups.filter((existingGroupId) => existingGroupId !== groupId);
  };

  const syncUserMemberships = async (nextMemberIds: string[]) => {
    if (!groupId) {
      return;
    }

    const previousMemberIds = new Set(persistedMemberIds);
    const nextMembers = new Set(nextMemberIds);
    const affectedUsers = allUsers.filter((liveUser) => {
      const keys = [liveUser.id, liveUser.authId].filter((value): value is string => Boolean(value));
      return keys.some((key) => previousMemberIds.has(key) || nextMembers.has(key));
    });

    await Promise.all(
      affectedUsers.map(async (liveUser) => {
        const nextGroups = getUpdatedGroupsForUser(liveUser, nextMemberIds);
        const currentGroups = Array.isArray(liveUser.groups) ? liveUser.groups : [];

        if (JSON.stringify(nextGroups) === JSON.stringify(currentGroups)) {
          return;
        }

        const response = await fetch(`${USERS_API_BASE_URL}/${liveUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ groups: nextGroups }),
        });

        if (!response.ok) {
          throw new Error(t("edit.errors.syncMembershipFailed", { identifier: liveUser.email || liveUser.id }));
        }
      }),
    );

    setAllUsers((currentUsers) =>
      currentUsers.map((liveUser) => ({
        ...liveUser,
        groups: getUpdatedGroupsForUser(liveUser, nextMemberIds),
      })),
    );
  };

  const handleAddStudent = async () => {
    const trimmedEmail = newStudentEmail.trim().toLowerCase();
    const trimmedName = newStudentName.trim();

    if (!trimmedEmail) return;

    const matchedUser = allUsers.find((liveUser) => liveUser.email?.toLowerCase() === trimmedEmail);

    if (!matchedUser) {
      setError(t("edit.errors.studentNotFound"));
      return;
    }

    if (students.some((student) => student.id === matchedUser.id)) {
      setError(t("edit.errors.studentAlreadyInGroup"));
      return;
    }

    const newStudent: Student = {
      id: matchedUser.id,
      name: matchedUser.name || trimmedName || matchedUser.email || t("edit.fallbacks.studentName"),
      email: matchedUser.email || trimmedEmail,
      status: "active",
    };

    const nextStudents = [...students, newStudent];
    const nextMemberIds = nextStudents.map((s) => s.id);

    setError(null);
    setSuccessMessage(null);
    setStudents(nextStudents);
    setNewStudentName("");
    setNewStudentEmail("");
    setShowAddStudent(false);

    // Persist immediately
    if (groupId) {
      try {
        setIsSaving(true);
        const response = await fetch(`${GROUPS_API_BASE_URL}/${groupId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: groupNameEdit.trim() || courseTitle,
            description: groupDescription.trim(),
            professor: groupProfessor,
            members: nextMemberIds,
          }),
        });
        if (!response.ok) throw new Error(t("edit.errors.addStudentFailed"));
        await syncUserMemberships(nextMemberIds);
        setPersistedMemberIds(nextMemberIds);
        setSuccessMessage(t("edit.success.studentAdded"));
      } catch (err) {
        setError(err instanceof Error ? err.message : t("edit.errors.addStudentFailed"));
      } finally {
        setIsSaving(false);
      }
    }
  };

  const closeAddStudentModal = () => {
    setShowAddStudent(false);
    setNewStudentName("");
    setNewStudentEmail("");
  };

  const closeCreateGroupModal = () => {
    setShowCreateGroupModal(false);
    setCreateGroupTitle("");
    setCreateGroupDescription("");
  };

  const handleCreateGroup = async () => {
    const professorId = user?.sub?.trim() || currentProfessorUser?.authId?.trim() || currentProfessorUser?.id?.trim() || "";

    if (!professorId) {
      setError(t("edit.errors.professorNotReady"));
      return;
    }

    if (!createGroupTitle.trim()) {
      setError(t("edit.errors.groupTitleRequired"));
      return;
    }

    try {
      setIsCreatingGroup(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(GROUPS_API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: createGroupTitle.trim(),
          description: createGroupDescription.trim(),
          professorId,
        }),
      });

      if (!response.ok) {
        throw new Error(t("home.error"));
      }

      closeCreateGroupModal();
      setSuccessMessage(t("edit.success.groupCreated"));
      setReloadKey((currentValue) => currentValue + 1);
    } catch (_error) {
      setError(t("edit.errors.createFailed"));
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleRemoveStudent = async (id: string) => {
    if (!confirm(t("edit.roster.removeConfirm"))) return;

    const nextStudents = students.filter((s) => s.id !== id);
    const nextMemberIds = nextStudents.map((s) => s.id);

    setError(null);
    setSuccessMessage(null);
    setStudents(nextStudents);

    // Persist immediately
    if (groupId) {
      try {
        setIsSaving(true);
        const response = await fetch(`${GROUPS_API_BASE_URL}/${groupId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: groupNameEdit.trim() || courseTitle,
            description: groupDescription.trim(),
            professor: groupProfessor,
            members: nextMemberIds,
          }),
        });
        if (!response.ok) throw new Error(t("edit.errors.removeStudentFailed"));
        await syncUserMemberships(nextMemberIds);
        setPersistedMemberIds(nextMemberIds);
        setSuccessMessage(t("edit.success.studentRemoved"));
      } catch (err) {
        setError(err instanceof Error ? err.message : t("edit.errors.removeStudentFailed"));
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSaveChanges = async () => {
    if (!groupId) {
      setError(t("edit.errors.noGroupSelected"));
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const nextMemberIds = students.map((student) => student.id);

      const response = await fetch(`${GROUPS_API_BASE_URL}/${groupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: groupNameEdit.trim() || courseTitle,
          description: groupDescription.trim(),
          professor: groupProfessor,
          members: nextMemberIds,
        }),
      });

      if (!response.ok) {
        throw new Error(t("edit.errors.saveGroupFailed"));
      }

      await syncUserMemberships(nextMemberIds);
      setPersistedMemberIds(nextMemberIds);
      setSuccessMessage(t("edit.success.groupSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("edit.errors.saveGroupFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveGroup = async () => {
    if (!groupId) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`${GROUPS_API_BASE_URL}/${groupId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(t("edit.errors.archiveFailed"));
      }

      await syncUserMemberships([]);
      setShowArchiveModal(false);
      navigate("/professor/forum");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("edit.errors.archiveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: palette.cream, fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif", display: "flex" }}>
      <aside style={{ width: 220, background: "linear-gradient(160deg, #4a1850 0%, #2d0f38 50%, #1c0a24 100%)", padding: "0 10px 16px", boxSizing: "border-box", position: "sticky", top: 0, height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.05)", boxShadow: "4px 0 32px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 8px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #a22237 0%, #5C1E26 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 10px rgba(162,34,55,0.45)" }}>
            <img src="/logo.png" alt="logo" style={{ height: 22, objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontFamily: "Italiana, serif", fontSize: 22, letterSpacing: 2.5, color: "#fff", lineHeight: 1 }}>D.I.Y.A</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 3 }}>{t("professorSidebar.appSubtitle")}</div>
          </div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", letterSpacing: 1.5, textTransform: "uppercase", padding: "0 8px", marginBottom: 8 }}>{t("professorSidebar.navigationLabel")}</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button type="button" onClick={() => navigate("/professor/forum")} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "none", backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.88)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("forumThread.backToForum")}</button>
          {[
            { id: "calendar", label: t("professorSidebar.nav.calendar"), path: "/professor/calendar" },
            { id: "analysis", label: t("professorSidebar.nav.analysis"), path: "/professor/analysis" },
            { id: "requests", label: t("professorSidebar.nav.requests"), path: "/professor/requests" },
            { id: "editgroup", label: t("professorSidebar.nav.editGroup"), path: "/professor/edit-group" },
          ].map((item) => {
            const isActive = item.id === "editgroup";
            return <button key={item.id} type="button" onClick={() => navigate(item.path)} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "none", backgroundColor: isActive ? "rgba(255,255,255,0.1)" : "transparent", color: isActive ? "#fff" : "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: isActive ? 700 : 600, cursor: "pointer" }}>{item.label}</button>;
          })}
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", margin: "12px 0 10px 0" }} />
        <button type="button" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Sign out</button>
      </aside>

      <main style={{ flex: 1, overflow: "auto" }}>
        <div style={{ backgroundColor: "#fff", padding: "56px 64px 52px", borderBottom: "1px solid rgba(214,214,214,0.2)" }}>
          <div style={{ maxWidth: 1200 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: palette.crimson, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>{t("edit.header.eyebrow")}</div>
            <div style={{ fontSize: 64, fontWeight: 900, color: palette.darkest, letterSpacing: -2.5, lineHeight: 1, marginBottom: 12 }}>"{t("edit.header.title")}"</div>
            <div style={{ fontSize: 20, fontWeight: 400, color: "rgba(92,30,38,0.55)", marginBottom: 52 }}>{t("edit.header.subtitle")}</div>

            <div style={{ display: "flex", gap: 0, alignItems: "stretch", flexWrap: "wrap" }}>
              {[
                { label: t("edit.stats.totalStudents"), value: students.length, color: palette.crimson },
                { label: t("edit.stats.active"), value: activeCount, color: palette.sage },
                { label: t("edit.stats.pending"), value: pendingCount, color: "#FFA500" },
              ].map((stat, i) => (
                <div key={stat.label} style={{ flex: "1 1 220px", minWidth: 180, paddingRight: i < 2 ? 40 : 0, marginRight: i < 2 ? 40 : 0, borderRight: i < 2 ? "1px solid rgba(214,214,214,0.5)" : "none" }}>
                  <div style={{ fontSize: 48, fontWeight: 900, color: stat.color, letterSpacing: -1.5, lineHeight: 1, marginBottom: 8 }}>{stat.value}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "48px 64px" }}>
        <div style={{ maxWidth: 1200 }}>

          {error && (
            <div style={{ marginBottom: 20, padding: "14px 16px", backgroundColor: "#fff", borderRadius: 12, border: "1px solid rgba(220,53,69,0.2)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", color: palette.crimson, fontSize: 13, fontWeight: 700 }}>
              {error}
            </div>
          )}

          {successMessage && (
            <div style={{ marginBottom: 20, padding: "14px 16px", backgroundColor: "#fff", borderRadius: 12, border: "1px solid rgba(122,155,118,0.25)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", color: palette.sage, fontSize: 13, fontWeight: 700 }}>
              {successMessage}
            </div>
          )}

          {isLoading && (
            <div style={{ marginBottom: 20, padding: "20px 24px", backgroundColor: "#fff", borderRadius: 12, border: "1px solid rgba(214,214,214,0.3)", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", color: palette.deepBurgundy, fontSize: 14, fontWeight: 700 }}>
              {t("edit.loading")}
            </div>
          )}

          {!isLoading && !groupId && emptyStateMessage && (
            <div style={{ backgroundColor: "#fff", border: "1px solid rgba(220,53,69,0.18)", borderRadius: 16, padding: "28px 32px", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", maxWidth: 720 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: palette.crimson, marginBottom: 10 }}>{emptyStateMessage}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(92,30,38,0.6)", lineHeight: 1.6, marginBottom: 20 }}>
                {t("edit.emptyState.description")}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" onClick={() => setShowCreateGroupModal(true)} disabled={!currentProfessorUser || isCreatingGroup} style={{ padding: "10px 18px", backgroundColor: !currentProfessorUser || isCreatingGroup ? "rgba(122,155,118,0.35)" : palette.sage, color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: !currentProfessorUser || isCreatingGroup ? "not-allowed" : "pointer" }}>{t("edit.emptyState.createButton")}</button>
                <button type="button" onClick={() => navigate("/professor/forum")} style={{ padding: "10px 18px", backgroundColor: "transparent", color: palette.deepBurgundy, border: "1px solid rgba(92,30,38,0.24)", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("forumThread.backToForum")}</button>
              </div>
            </div>
          )}

          {!isLoading && groupId && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, marginBottom: 32 }}>
                <div style={{ backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 24px rgba(0,0,0,0.06)" }}>
                  <div style={{ height: 5, backgroundColor: palette.crimson }} />
                  <div style={{ padding: "28px 32px 32px" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: palette.darkest, letterSpacing: -0.5, marginBottom: 24 }}>{t("edit.groupInfo.cardTitle")}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{t("edit.groupInfo.nameLabel")}</label>
                        <input type="text" value={groupNameEdit} onChange={(e) => setGroupNameEdit(e.target.value)} style={{ width: "100%", padding: "12px 16px", border: "1.5px solid rgba(214,214,214,0.5)", borderRadius: 12, fontSize: 15, fontFamily: "inherit", boxSizing: "border-box", outline: "none", color: palette.darkest }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(92,30,38,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{t("edit.groupInfo.descriptionLabel")}</label>
                        <textarea value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} style={{ width: "100%", minHeight: 90, padding: "12px 16px", border: "1.5px solid rgba(214,214,214,0.5)", borderRadius: 12, fontSize: 15, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", outline: "none", color: palette.darkest }} />
                      </div>
                      <button onClick={() => void handleSaveChanges()} disabled={isSaving} style={{ alignSelf: "flex-start", padding: "12px 24px", background: isSaving ? "rgba(122,155,118,0.35)" : `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`, color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: isSaving ? "not-allowed" : "pointer" }}>{isSaving ? t("edit.groupInfo.savingButton") : t("edit.groupInfo.saveButton")}</button>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 24px rgba(0,0,0,0.06)" }}>
                  <div style={{ height: 5, backgroundColor: palette.sage }} />
                  <div style={{ padding: "28px 32px 32px" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: palette.darkest, letterSpacing: -0.5, marginBottom: 24 }}>{t("edit.groupActions.cardTitle")}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <button onClick={() => setShowAddStudent(true)} disabled={isLoading} style={{ padding: "16px 20px", background: `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`, color: "white", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer", textAlign: "left", boxShadow: "0 2px 12px rgba(122,155,118,0.3)" }}>➕ {t("edit.groupActions.addStudents")}</button>
                      <button onClick={() => setShowArchiveModal(true)} disabled={isSaving} style={{ padding: "16px 20px", backgroundColor: "transparent", color: "#DC3545", border: "2px solid #DC3545", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: isSaving ? "not-allowed" : "pointer", textAlign: "left" }}>🗄️ {t("edit.groupActions.archiveGroup")}</button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 24px rgba(0,0,0,0.06)" }}>
                <div style={{ height: 5, background: `linear-gradient(90deg, ${palette.crimson}, ${palette.sage})` }} />
                <div style={{ padding: "28px 32px 32px" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: palette.darkest, letterSpacing: -0.5, marginBottom: 24 }}>{t("edit.roster.cardTitle")} ({students.length})</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {!isLoading && students.length === 0 && (
                    <div style={{ padding: "14px 16px", backgroundColor: "rgba(214,214,214,0.15)", borderRadius: 10, color: "rgba(92,30,38,0.55)", fontSize: 13, fontWeight: 700 }}>
                      {t("edit.roster.empty")}
                    </div>
                  )}

                  {students.map((student) => (
                    <div key={student.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", backgroundColor: student.status === "active" ? "rgba(122,155,118,0.06)" : "rgba(255,165,0,0.05)", borderRadius: 14, border: `1px solid ${student.status === "active" ? "rgba(122,155,118,0.15)" : "rgba(255,165,0,0.2)"}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: palette.darkest, marginBottom: 3 }}>{student.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(92,30,38,0.5)" }}>{student.email}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ padding: "5px 12px", backgroundColor: student.status === "active" ? palette.sage : "#FFA500", color: "white", fontSize: 11, fontWeight: 700, borderRadius: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>{student.status}</span>
                        <button onClick={() => void handleRemoveStudent(student.id)} style={{ padding: "7px 14px", background: "transparent", color: "#DC3545", border: "1.5px solid rgba(220,53,69,0.4)", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{t("edit.roster.removeButton")}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </div>
            </>
          )}
        </div>
        </div>

        <div style={{ background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`, padding: "40px 64px" }}>
          <div style={{ maxWidth: 1200 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>{groupNameEdit || courseTitle}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>{t("edit.footer.enrolled", { count: students.length })}</div>
          </div>
        </div>
      </main>

      {showAddStudent && groupId && (
        <div onClick={closeAddStudentModal} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(39,1,21,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, backgroundColor: "#fff", borderRadius: 18, padding: "28px 28px 24px", boxShadow: "0 18px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: palette.crimson, marginBottom: 8 }}>{t("edit.addStudentModal.title")}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(92,30,38,0.55)", lineHeight: 1.5, marginBottom: 20 }}>
              {t("edit.addStudentModal.description")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="text" placeholder="Student Name (optional)" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} style={{ padding: "12px 14px", border: "1px solid rgba(214,214,214,0.5)", borderRadius: 10, fontSize: 14, fontFamily: "inherit" }} />
              <input type="email" placeholder="student@school.edu" value={newStudentEmail} onChange={(e) => setNewStudentEmail(e.target.value)} style={{ padding: "12px 14px", border: "1px solid rgba(214,214,214,0.5)", borderRadius: 10, fontSize: 14, fontFamily: "inherit" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={closeAddStudentModal} style={{ padding: "10px 16px", background: "transparent", color: palette.deepBurgundy, border: "1px solid rgba(92,30,38,0.24)", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("edit.addStudentModal.cancelButton")}</button>
                <button type="button" onClick={() => void handleAddStudent()} style={{ padding: "10px 18px", background: palette.sage, color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("edit.addStudentModal.addButton")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateGroupModal && !groupId && (
        <div onClick={closeCreateGroupModal} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(39,1,21,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, backgroundColor: "#fff", borderRadius: 18, padding: "28px 28px 24px", boxShadow: "0 18px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: palette.crimson, marginBottom: 8 }}>{t("edit.createGroupModal.title")}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(92,30,38,0.55)", lineHeight: 1.5, marginBottom: 20 }}>
              {t("edit.createGroupModal.description")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="text" placeholder="Group title" value={createGroupTitle} onChange={(e) => setCreateGroupTitle(e.target.value)} style={{ padding: "12px 14px", border: "1px solid rgba(214,214,214,0.5)", borderRadius: 10, fontSize: 14, fontFamily: "inherit" }} />
              <textarea placeholder="Group description" value={createGroupDescription} onChange={(e) => setCreateGroupDescription(e.target.value)} style={{ minHeight: 100, padding: "12px 14px", border: "1px solid rgba(214,214,214,0.5)", borderRadius: 10, fontSize: 14, fontFamily: "inherit", resize: "vertical" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={closeCreateGroupModal} disabled={isCreatingGroup} style={{ padding: "10px 16px", background: "transparent", color: palette.deepBurgundy, border: "1px solid rgba(92,30,38,0.24)", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: isCreatingGroup ? "not-allowed" : "pointer" }}>{t("edit.createGroupModal.cancelButton")}</button>
                <button type="button" onClick={() => void handleCreateGroup()} disabled={isCreatingGroup} style={{ padding: "10px 18px", background: isCreatingGroup ? "rgba(122,155,118,0.35)" : palette.sage, color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: isCreatingGroup ? "not-allowed" : "pointer" }}>{isCreatingGroup ? t("edit.createGroupModal.creatingButton") : t("edit.createGroupModal.createButton")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showArchiveModal && groupId && (
        <div onClick={() => setShowArchiveModal(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(39,1,21,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 500, backgroundColor: "#fff", borderRadius: 18, padding: "28px 28px 24px", boxShadow: "0 18px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: palette.crimson, marginBottom: 10 }}>{t("edit.archiveModal.title")}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(92,30,38,0.58)", lineHeight: 1.6, marginBottom: 22 }}>
              {t("edit.archiveModal.description")}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={() => setShowArchiveModal(false)} style={{ padding: "10px 16px", background: "transparent", color: palette.deepBurgundy, border: "1px solid rgba(92,30,38,0.24)", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("edit.archiveModal.cancelButton")}</button>
              <button type="button" onClick={() => void handleArchiveGroup()} disabled={isSaving} style={{ padding: "10px 18px", background: isSaving ? "rgba(220,53,69,0.45)" : "#DC3545", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: isSaving ? "not-allowed" : "pointer" }}>{isSaving ? t("edit.archiveModal.archivingButton") : t("edit.archiveModal.archiveButton")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
