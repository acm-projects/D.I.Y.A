import { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

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
          throw new Error("Failed to load groups.");
        }

        if (!usersResponse.ok) {
          throw new Error("Failed to load users.");
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
            setEmptyStateMessage("No group is available to edit yet.");
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
            email: matchedUser?.email || "No email provided",
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
          setError(err instanceof Error ? err.message : "Failed to load group data.");
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
          throw new Error(`Failed to sync membership for ${liveUser.email || liveUser.id}.`);
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

  const handleAddStudent = () => {
    const trimmedEmail = newStudentEmail.trim().toLowerCase();
    const trimmedName = newStudentName.trim();

    if (!trimmedEmail) return;

    const matchedUser = allUsers.find((liveUser) => liveUser.email?.toLowerCase() === trimmedEmail);

    if (!matchedUser) {
      setError("Student must log in at least once before being added to this group.");
      return;
    }

    if (students.some((student) => student.id === matchedUser.id)) {
      setError("That student is already in this group.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setStudents([
      ...students,
      {
        id: matchedUser.id,
        name: matchedUser.name || trimmedName || matchedUser.email || "Student",
        email: matchedUser.email || trimmedEmail,
        status: "active",
      },
    ]);
    setNewStudentName("");
    setNewStudentEmail("");
    setShowAddStudent(false);
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
      setError("Your professor account is not ready yet. Please refresh and try again.");
      return;
    }

    if (!createGroupTitle.trim()) {
      setError("Please enter a group title.");
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
        throw new Error("Failed to create group.");
      }

      closeCreateGroupModal();
      setSuccessMessage("Group created successfully.");
      setReloadKey((currentValue) => currentValue + 1);
    } catch (_error) {
      setError("Something went wrong while creating the group. Please try again.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleRemoveStudent = (id: string) => {
    if (confirm("Are you sure you want to remove this student?")) {
      setError(null);
      setSuccessMessage(null);
      setStudents(students.filter((s) => s.id !== id));
    }
  };

  const handleSaveChanges = async () => {
    if (!groupId) {
      setError("No group is currently selected.");
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
        throw new Error("Failed to save group settings.");
      }

      await syncUserMemberships(nextMemberIds);
      setPersistedMemberIds(nextMemberIds);
      setSuccessMessage("Group settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save group settings.");
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
        throw new Error("Failed to archive group.");
      }

      await syncUserMemberships([]);
      setShowArchiveModal(false);
      navigate("/professor/forum");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive group.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: palette.cream, fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif", display: "flex" }}>
      <aside style={{ width: 180, background: `linear-gradient(180deg, #3d1542 0%, ${palette.darkest} 100%)`, padding: 12, boxSizing: "border-box", position: "sticky", top: 0, height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "Italiana, serif", fontSize: 30, letterSpacing: 1.5, color: "#fff", padding: "6px 4px 10px 4px" }}>
          <img src="/logo.png" alt="logo" style={{ height: 48, objectFit: "contain", marginBottom: 4 }} />
          <span style={{ lineHeight: 1 }}>D.I.Y.A</span>
        </div>
        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.25)", margin: "0 0 10px 0" }} />
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button type="button" onClick={() => navigate("/professor/forum")} style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 10, border: "none", backgroundColor: "transparent", color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>← Back to Forum</button>
          {[
            { id: "calendar", label: "Calendar", path: "/professor/calendar" },
            { id: "analysis", label: "Analysis", path: "/professor/analysis" },
            { id: "requests", label: "Requests", path: "/professor/requests" },
            { id: "editgroup", label: "Edit Group", path: "/professor/edit-group" },
          ].map((item) => {
            const isActive = item.id === "editgroup";
            return <button key={item.id} type="button" onClick={() => navigate(item.path)} style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 10, border: "none", backgroundColor: isActive ? "rgba(255,255,255,0.88)" : "transparent", color: isActive ? palette.darkest : "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: isActive ? 800 : 600, cursor: "pointer" }}>{item.label}</button>;
          })}
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.2)", margin: "10px 0 8px 0" }} />
        <button type="button" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Sign out</button>
      </aside>

      <main style={{ flex: 1, padding: "32px 36px 56px 24px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 1200 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ color: palette.crimson, fontSize: 44, fontWeight: 850, letterSpacing: -1, lineHeight: 1.1 }}>Edit Group Settings</div>
            <div style={{ marginTop: 8, color: palette.deepBurgundy, fontSize: 16, fontWeight: 600 }}>Manage students, settings, and group information</div>
          </div>

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
              Loading group roster...
            </div>
          )}

          {!isLoading && !groupId && emptyStateMessage && (
            <div style={{ backgroundColor: "#fff", border: "1px solid rgba(220,53,69,0.18)", borderRadius: 16, padding: "28px 32px", boxShadow: "0 4px 18px rgba(0,0,0,0.08)", maxWidth: 720 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: palette.crimson, marginBottom: 10 }}>{emptyStateMessage}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(92,30,38,0.6)", lineHeight: 1.6, marginBottom: 20 }}>
                Create your first course group to start organizing students, posts, and office-hour analytics.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" onClick={() => setShowCreateGroupModal(true)} disabled={!currentProfessorUser || isCreatingGroup} style={{ padding: "10px 18px", backgroundColor: !currentProfessorUser || isCreatingGroup ? "rgba(122,155,118,0.35)" : palette.sage, color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: !currentProfessorUser || isCreatingGroup ? "not-allowed" : "pointer" }}>Create New Group</button>
                <button type="button" onClick={() => navigate("/professor/forum")} style={{ padding: "10px 18px", backgroundColor: "transparent", color: palette.deepBurgundy, border: "1px solid rgba(92,30,38,0.24)", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Back to Forum</button>
              </div>
            </div>
          )}

          {!isLoading && groupId && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
                <button
                  onClick={() => setShowAddStudent(true)}
                  disabled={isLoading}
                  style={{ padding: "18px 20px", backgroundColor: palette.sage, color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", transition: "transform 120ms ease" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  ➕ Add Students
                </button>
                <button
                  onClick={() => setShowArchiveModal(true)}
                  disabled={isSaving}
                  style={{ padding: "18px 20px", backgroundColor: "transparent", color: "#DC3545", border: "2px solid #DC3545", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 120ms ease" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#DC3545";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#DC3545";
                  }}
                >
                  🗄️ Archive Group
                </button>
              </div>

              <div style={{ backgroundColor: "#fff", border: "1px solid rgba(214,214,214,0.4)", borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: "0 4px 18px rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: palette.crimson, marginBottom: 20 }}>Group Information</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: palette.deepBurgundy, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Group Name</label>
                    <input type="text" value={groupNameEdit} onChange={(e) => setGroupNameEdit(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(214,214,214,0.5)", borderRadius: 8, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: palette.deepBurgundy, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Description</label>
                    <textarea value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} style={{ width: "100%", minHeight: 80, padding: "10px 14px", border: "1px solid rgba(214,214,214,0.5)", borderRadius: 8, fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                  </div>
                  <button onClick={() => void handleSaveChanges()} disabled={isSaving} style={{ alignSelf: "flex-start", padding: "10px 20px", background: isSaving ? "rgba(122,155,118,0.35)" : palette.sage, color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: isSaving ? "not-allowed" : "pointer" }}>{isSaving ? "Saving..." : "Save Changes"}</button>
                </div>
              </div>

              <div style={{ backgroundColor: "#fff", border: "1px solid rgba(214,214,214,0.4)", borderRadius: 14, padding: 24, boxShadow: "0 4px 18px rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: palette.crimson, marginBottom: 16 }}>Student List ({students.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {!isLoading && students.length === 0 && (
                    <div style={{ padding: "14px 16px", backgroundColor: "rgba(214,214,214,0.15)", borderRadius: 10, color: "rgba(92,30,38,0.55)", fontSize: 13, fontWeight: 700 }}>
                      No students are assigned to this group yet.
                    </div>
                  )}

                  {students.map((student) => (
                    <div key={student.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", backgroundColor: student.status === "active" ? "rgba(122,155,118,0.08)" : "rgba(214,214,214,0.2)", borderRadius: 10, border: "1px solid rgba(214,214,214,0.3)" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: palette.deepBurgundy, marginBottom: 2 }}>{student.name}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(92,30,38,0.6)" }}>{student.email}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ padding: "4px 10px", backgroundColor: student.status === "active" ? palette.sage : palette.lightGray, color: "white", fontSize: 11, fontWeight: 700, borderRadius: 6, textTransform: "uppercase" }}>{student.status}</span>
                        <button onClick={() => handleRemoveStudent(student.id)} style={{ padding: "6px 12px", background: "transparent", color: "#DC3545", border: "1px solid #DC3545", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {showAddStudent && groupId && (
        <div onClick={closeAddStudentModal} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(39,1,21,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, backgroundColor: "#fff", borderRadius: 18, padding: "28px 28px 24px", boxShadow: "0 18px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: palette.crimson, marginBottom: 8 }}>Add Student</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(92,30,38,0.55)", lineHeight: 1.5, marginBottom: 20 }}>
              Enter the student email to add them to this group. The student must have logged in at least once so their account exists in the database.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="text" placeholder="Student Name (optional)" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} style={{ padding: "12px 14px", border: "1px solid rgba(214,214,214,0.5)", borderRadius: 10, fontSize: 14, fontFamily: "inherit" }} />
              <input type="email" placeholder="student@school.edu" value={newStudentEmail} onChange={(e) => setNewStudentEmail(e.target.value)} style={{ padding: "12px 14px", border: "1px solid rgba(214,214,214,0.5)", borderRadius: 10, fontSize: 14, fontFamily: "inherit" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={closeAddStudentModal} style={{ padding: "10px 16px", background: "transparent", color: palette.deepBurgundy, border: "1px solid rgba(92,30,38,0.24)", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button type="button" onClick={handleAddStudent} style={{ padding: "10px 18px", background: palette.sage, color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add Student</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateGroupModal && !groupId && (
        <div onClick={closeCreateGroupModal} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(39,1,21,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, backgroundColor: "#fff", borderRadius: 18, padding: "28px 28px 24px", boxShadow: "0 18px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: palette.crimson, marginBottom: 8 }}>Create New Group</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(92,30,38,0.55)", lineHeight: 1.5, marginBottom: 20 }}>
              Create a new course group for your professor account. You can add students after the group is created.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="text" placeholder="Group title" value={createGroupTitle} onChange={(e) => setCreateGroupTitle(e.target.value)} style={{ padding: "12px 14px", border: "1px solid rgba(214,214,214,0.5)", borderRadius: 10, fontSize: 14, fontFamily: "inherit" }} />
              <textarea placeholder="Group description" value={createGroupDescription} onChange={(e) => setCreateGroupDescription(e.target.value)} style={{ minHeight: 100, padding: "12px 14px", border: "1px solid rgba(214,214,214,0.5)", borderRadius: 10, fontSize: 14, fontFamily: "inherit", resize: "vertical" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={closeCreateGroupModal} disabled={isCreatingGroup} style={{ padding: "10px 16px", background: "transparent", color: palette.deepBurgundy, border: "1px solid rgba(92,30,38,0.24)", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: isCreatingGroup ? "not-allowed" : "pointer" }}>Cancel</button>
                <button type="button" onClick={() => void handleCreateGroup()} disabled={isCreatingGroup} style={{ padding: "10px 18px", background: isCreatingGroup ? "rgba(122,155,118,0.35)" : palette.sage, color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: isCreatingGroup ? "not-allowed" : "pointer" }}>{isCreatingGroup ? "Creating..." : "Create Group"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showArchiveModal && groupId && (
        <div onClick={() => setShowArchiveModal(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(39,1,21,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 500, backgroundColor: "#fff", borderRadius: 18, padding: "28px 28px 24px", boxShadow: "0 18px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: palette.crimson, marginBottom: 10 }}>Archive this group?</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(92,30,38,0.58)", lineHeight: 1.6, marginBottom: 22 }}>
              This will delete the group and remove the group assignment from its current members.
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={() => setShowArchiveModal(false)} style={{ padding: "10px 16px", background: "transparent", color: palette.deepBurgundy, border: "1px solid rgba(92,30,38,0.24)", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={() => void handleArchiveGroup()} disabled={isSaving} style={{ padding: "10px 18px", background: isSaving ? "rgba(220,53,69,0.45)" : "#DC3545", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: isSaving ? "not-allowed" : "pointer" }}>{isSaving ? "Archiving..." : "Archive Group"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
