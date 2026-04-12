import { useMemo, useState, type CSSProperties } from "react";
import { Sidebar } from "./Sidebar";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

/** Peer members (not counting the signed-in student). */
type StudyMember = {
  email: string;
  displayName: string;
};

type StudyGroup = {
  id: string;
  name: string;
  role: "admin" | "member";
  members: StudyMember[];
  forumPostsCount: number;
};

function emailToDisplayName(email: string): string {
  const local = email.split("@")[0]?.trim() ?? email;
  const parts = local.replace(/[._+-]+/g, " ").split(/\s+/).filter(Boolean);
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
}

const initialStudyGroups: StudyGroup[] = [
  {
    id: "sg-calc",
    name: "Calc II — Exam Prep",
    role: "admin",
    members: [
      { email: "jordan.k@university.edu", displayName: "Jordan K" },
      { email: "sam.t@university.edu", displayName: "Sam T" },
      { email: "riley.m@university.edu", displayName: "Riley M" },
      { email: "casey.p@university.edu", displayName: "Casey P" },
      { email: "alex.b@university.edu", displayName: "Alex B" },
    ],
    forumPostsCount: 14,
  },
  {
    id: "sg-physics",
    name: "Physics Lab — Data review",
    role: "member",
    members: [
      { email: "taylor.r@university.edu", displayName: "Taylor R" },
      { email: "morgan.d@university.edu", displayName: "Morgan D" },
    ],
    forumPostsCount: 8,
  },
  {
    id: "sg-cs",
    name: "CS Projects — Sprint group",
    role: "admin",
    members: [
      { email: "jamie.l@university.edu", displayName: "Jamie L" },
      { email: "drew.h@university.edu", displayName: "Drew H" },
      { email: "quinn.v@university.edu", displayName: "Quinn V" },
      { email: "reese.n@university.edu", displayName: "Reese N" },
    ],
    forumPostsCount: 22,
  },
];

function memberCount(g: StudyGroup): number {
  return 1 + g.members.length;
}

function UsersIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke={color} strokeWidth="2" />
      <path d="M4 20.5c1.6-3.2 4.5-5 8-5s6.4 1.8 8 5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ForumIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 7.5A4.5 4.5 0 0 1 10.5 3h3A4.5 4.5 0 0 1 18 7.5v3A4.5 4.5 0 0 1 13.5 15H11l-4.5 3V15A4.5 4.5 0 0 1 6 10.5v-3Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const inputRowStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "14px 16px",
  border: "1.5px solid rgba(214,214,214,0.5)",
  borderRadius: 14,
  fontSize: 15,
  fontFamily: "inherit",
  outline: "none",
  color: palette.darkest,
  boxSizing: "border-box",
};

const primarySageButtonStyle: CSSProperties = {
  flexShrink: 0,
  padding: "0 24px",
  background: `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`,
  color: "white",
  border: "none",
  borderRadius: 14,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 2px 12px rgba(122,155,118,0.3)",
};

type ModalMode = null | { type: "new-group"; name: string } | { type: "add-members"; groupId: string };

export function StudentStudyGroups() {
  const [groupNameDraft, setGroupNameDraft] = useState("");
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>(initialStudyGroups);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalMode>(null);
  const [memberEmailInput, setMemberEmailInput] = useState("");
  const [modalMembers, setModalMembers] = useState<StudyMember[]>([]);

  
  const adminCount = useMemo(() => studyGroups.filter((g) => g.role === "admin").length, [studyGroups]);

  const openNewGroupModal = () => {
    const name = groupNameDraft.trim();
    if (!name) return;
    setModal({ type: "new-group", name });
    setMemberEmailInput("");
    setModalMembers([]);
  };

  const closeModal = () => {
    setModal(null);
    setMemberEmailInput("");
    setModalMembers([]);
  };

  const addMemberToModal = () => {
    const e = memberEmailInput.trim().toLowerCase();
    if (!e || !e.includes("@")) return;
    if (modalMembers.some((m) => m.email === e)) {
      setMemberEmailInput("");
      return;
    }
    setModalMembers((prev) => [...prev, { email: e, displayName: emailToDisplayName(e) }]);
    setMemberEmailInput("");
  };

  const finalizeNewGroup = () => {
    if (modal?.type !== "new-group") return;
    const id = `sg-${Date.now()}`;
    const next: StudyGroup = {
      id,
      name: modal.name,
      role: "admin",
      members: modalMembers,
      forumPostsCount: 0,
    };
    setStudyGroups((prev) => [next, ...prev]);
    setGroupNameDraft("");
    closeModal();
  };

  const finalizeAddMembers = () => {
    if (modal?.type !== "add-members" || modalMembers.length === 0) {
      if (modal?.type === "add-members") closeModal();
      return;
    }
    setStudyGroups((prev) =>
      prev.map((g) => {
        if (g.id !== modal.groupId) return g;
        const existing = new Set(g.members.map((m) => m.email.toLowerCase()));
        const merged = [...g.members];
        for (const m of modalMembers) {
          if (!existing.has(m.email.toLowerCase())) {
            merged.push(m);
            existing.add(m.email.toLowerCase());
          }
        }
        return { ...g, members: merged };
      }),
    );
    closeModal();
  };

  const openAddMembersModal = (g: StudyGroup) => {
    if (g.role !== "admin") return;
    setModal({ type: "add-members", groupId: g.id });
    setMemberEmailInput("");
    setModalMembers([]);
  };

  const modalGroup =
    modal?.type === "add-members" ? studyGroups.find((g) => g.id === modal.groupId) : undefined;

  const modalTitle =
    modal?.type === "new-group"
      ? `Add members — ${modal.name}`
      : modal?.type === "add-members"
        ? `Add members — ${modalGroup?.name ?? "Group"}`
        : "";

  const modalPrimaryLabel = modal?.type === "new-group" ? "Create" : "Save members";
  const modalPrimaryAction = modal?.type === "new-group" ? finalizeNewGroup : finalizeAddMembers;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        fontFamily: "Inter, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        display: "flex",
      }}
    >
      <Sidebar activeId="study-groups" />

      <main style={{ flex: 1, overflow: "auto" }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`,
            padding: "56px 64px 52px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.55)",
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 16,
            }}
          >
            Student Portal
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: -2.5,
              lineHeight: 1,
              marginBottom: 12,
            }}
          >
            Your Study Groups
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 400,
              color: "rgba(255,255,255,0.7)",
              marginBottom: 52,
            }}
          >
            Create groups, invite classmates, and collaborate outside your courses.
          </div>

          <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
            {[
              { label: "Study groups", value: studyGroups.length, color: "#fff" },
              { label: "Groups you run", value: adminCount, color: "rgba(255,255,255,0.9)" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  paddingRight: i < 2 ? 40 : 0,
                  marginRight: i < 2 ? 40 : 0,
                  borderRight: i < 2 ? "1px solid rgba(255,255,255,0.2)" : "none",
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 900,
                    color: stat.color,
                    letterSpacing: -1.5,
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.55)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "48px 64px 56px" }}>
          <div
            style={{
              width: "min(640px, 100%)",
              margin: "0 auto 40px",
              backgroundColor: "#fff",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ height: 5, backgroundColor: palette.sage }} />
            <div style={{ padding: "28px 32px 32px" }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: palette.darkest,
                  letterSpacing: -0.5,
                  marginBottom: 20,
                }}
              >
                Create a study group
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
                <input
                  type="text"
                  value={groupNameDraft}
                  onChange={(e) => setGroupNameDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && openNewGroupModal()}
                  placeholder="Enter a group name…"
                  aria-label="New study group name"
                  style={inputRowStyle}
                />
                <button type="button" onClick={openNewGroupModal} style={primarySageButtonStyle}>
                  Create
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(92,30,38,0.55)",
              marginBottom: 24,
            }}
          >
            {studyGroups.length === 0
              ? "You have not created a study group yet."
              : `${studyGroups.length} study group${studyGroups.length === 1 ? "" : "s"} — click a group you admin to add members.`}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 20,
              alignItems: "stretch",
            }}
          >
            {studyGroups.map((g) => {
              const isHovered = hoveredId === g.id;
              const isAdmin = g.role === "admin";
              const cardShellStyle: CSSProperties = {
                textAlign: "left",
                backgroundColor: "#fff",
                border: isHovered ? `1px solid ${palette.crimson}` : "1px solid rgba(214,214,214,0.4)",
                borderRadius: 20,
                padding: "22px 24px",
                cursor: isAdmin ? "pointer" : "default",
                boxShadow: isHovered
                  ? "0 12px 36px rgba(0,0,0,0.16)"
                  : "0 2px 24px rgba(0,0,0,0.06)",
                transform: isHovered && isAdmin ? "translateY(-2px)" : "translateY(0px)",
                transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
                overflow: "hidden",
                position: "relative",
                width: "100%",
                boxSizing: "border-box",
              };

              const cardInner = (
                <>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      backgroundColor: palette.crimson,
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        letterSpacing: -0.2,
                        color: palette.darkest,
                        lineHeight: 1.3,
                        flex: 1,
                      }}
                    >
                      {g.name}
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                        padding: "4px 8px",
                        borderRadius: 6,
                        backgroundColor: isAdmin ? "rgba(122,155,118,0.2)" : "rgba(92,30,38,0.1)",
                        color: isAdmin ? palette.sage : palette.deepBurgundy,
                      }}
                    >
                      {isAdmin ? "Admin" : "Member"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      color: palette.deepBurgundy,
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 8,
                        backgroundColor: "rgba(122,155,118,0.12)",
                      }}
                    >
                      <UsersIcon color={palette.sage} />
                      <span>{memberCount(g)} members</span>
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 8,
                        backgroundColor: "rgba(92,30,38,0.08)",
                      }}
                    >
                      <ForumIcon color={palette.deepBurgundy} />
                      <span>{g.forumPostsCount} posts</span>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 700, color: palette.crimson }}>
                    {isAdmin ? "Click to add members" : "View only — you joined this group"}
                  </div>
                </>
              );

              return isAdmin ? (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => openAddMembersModal(g)}
                  onMouseEnter={() => setHoveredId(g.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  title="Add members"
                  style={{
                    ...cardShellStyle,
                    font: "inherit",
                    fontFamily: "inherit",
                  }}
                >
                  {cardInner}
                </button>
              ) : (
                <div
                  key={g.id}
                  role="group"
                  aria-label={g.name}
                  onMouseEnter={() => setHoveredId(g.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={cardShellStyle}
                >
                  {cardInner}
                </div>
              );
            })}

            {studyGroups.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  backgroundColor: "#fff",
                  borderRadius: 20,
                  padding: "40px 32px",
                  textAlign: "center",
                  boxShadow: "0 2px 24px rgba(0,0,0,0.06)",
                  color: "rgba(92,30,38,0.5)",
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                Enter a name above and click Create to start your first study group.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal pattern aligned with StudentProfilePage photo editor */}
      {modal && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            backgroundColor: "rgba(39, 1, 21, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            boxSizing: "border-box",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="study-group-modal-title"
            style={{
              width: "min(480px, 100%)",
              maxHeight: "min(90vh, 640px)",
              overflow: "auto",
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: "28px 32px 32px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
              border: "1px solid rgba(214,214,214,0.5)",
              boxSizing: "border-box",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ height: 5, backgroundColor: palette.sage, borderRadius: 4, margin: "-28px -32px 20px" }} />

            <div
              id="study-group-modal-title"
              style={{ fontSize: 20, fontWeight: 800, color: palette.darkest, letterSpacing: -0.4, marginBottom: 8 }}
            >
              {modalTitle}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(92,30,38,0.55)", marginBottom: 22 }}>
              Enter member emails and click Add. Names appear below; then finish with {modalPrimaryLabel}.
            </div>

            {modal.type === "add-members" && modalGroup && modalGroup.members.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(92,30,38,0.45)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  Current members
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, color: palette.deepBurgundy, fontSize: 13, fontWeight: 600 }}>
                  <li style={{ marginBottom: 4 }}>You (admin)</li>
                  {modalGroup.members.map((m) => (
                    <li key={m.email} style={{ marginBottom: 4 }}>
                      {m.displayName}{" "}
                      <span style={{ fontWeight: 500, color: "rgba(92,30,38,0.45)" }}>({m.email})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, alignItems: "stretch", marginBottom: 16 }}>
              <input
                type="email"
                value={memberEmailInput}
                onChange={(e) => setMemberEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMemberToModal()}
                placeholder="member@university.edu"
                aria-label="Member email"
                style={inputRowStyle}
              />
              <button type="button" onClick={addMemberToModal} style={primarySageButtonStyle}>
                Add
              </button>
            </div>

            {modalMembers.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(92,30,38,0.45)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  {modal.type === "new-group" ? "Members to invite" : "Adding"}
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, color: palette.darkest, fontSize: 14, fontWeight: 600 }}>
                  {modalMembers.map((m) => (
                    <li key={m.email} style={{ marginBottom: 6 }}>
                      {m.displayName}{" "}
                      <span style={{ fontWeight: 500, color: "rgba(92,30,38,0.45)", fontSize: 13 }}>({m.email})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  padding: "12px 20px",
                  borderRadius: 12,
                  border: `1px solid rgba(39,1,21,0.2)`,
                  backgroundColor: "transparent",
                  color: palette.deepBurgundy,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={modalPrimaryAction}
                style={{
                  padding: "12px 22px",
                  borderRadius: 12,
                  border: "none",
                  background: `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 2px 12px rgba(122,155,118,0.3)",
                }}
              >
                {modalPrimaryLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
