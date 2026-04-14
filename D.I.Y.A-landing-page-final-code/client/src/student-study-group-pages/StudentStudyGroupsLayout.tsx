import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "../Sidebar";
import {
  CURRENT_USER_EMAIL,
  displayMemberName,
  emailToDisplayName,
  emptyMeeting,
  initialStudyGroups,
  officeHoursInputStyle,
  officeHoursLabelStyle,
  inputRowStyle,
  palette,
  primarySageButtonStyle,
  type InvitationStatus,
  type MeetingAlternate,
  type ModalMode,
  type ProposedMeeting,
  type StudyGroup,
  type StudyGroupChatMsg,
  type StudyMember,
  type StudentStudyGroupsOutletContext,
} from "./studyGroupsShared";

export function StudentStudyGroupsLayout() {
  const navigate = useNavigate();
  const [groupNameDraft, setGroupNameDraft] = useState("");
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>(initialStudyGroups);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalMode>(null);
  const [memberEmailInput, setMemberEmailInput] = useState("");
  const [modalMembers, setModalMembers] = useState<StudyMember[]>([]);
  const [newGroupMeeting, setNewGroupMeeting] = useState<ProposedMeeting>(emptyMeeting);

  const [groupPollVotes, setGroupPollVotes] = useState<Record<string, Record<string, string[]>>>({});
  const [groupChats, setGroupChats] = useState<Record<string, StudyGroupChatMsg[]>>({});

  const openNewGroupModal = () => {
    const name = groupNameDraft.trim();
    if (!name) return;
    setModal({ type: "new-group", name });
    setMemberEmailInput("");
    setModalMembers([]);
    setNewGroupMeeting(emptyMeeting);
  };

  const closeModal = () => {
    setModal(null);
    setMemberEmailInput("");
    setModalMembers([]);
  };

  const addMemberToModal = () => {
    const e = memberEmailInput.trim().toLowerCase();
    if (!e) return;
    if (modalMembers.some((m) => m.email === e)) {
      setMemberEmailInput("");
      return;
    }
    setModalMembers((prev) => [...prev, { email: e, displayName: emailToDisplayName(e), status: "pending" }]);
    setMemberEmailInput("");
  };

  const newGroupMeetingValid =
    Boolean(newGroupMeeting.date?.trim()) &&
    Boolean(newGroupMeeting.startTime?.trim()) &&
    Boolean(newGroupMeeting.duration?.trim()) &&
    Boolean(newGroupMeeting.location?.trim());

  const finalizeNewGroup = () => {
    if (modal?.type !== "new-group" || !newGroupMeetingValid) return;
    const id = `sg-${Date.now()}`;
    const next: StudyGroup = {
      id,
      name: modal.name,
      role: "admin",
      proposedMeeting: { ...newGroupMeeting },
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
            merged.push({ ...m, status: "pending" });
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
    navigate("/study-groups");
    setModal({ type: "add-members", groupId: g.id });
    setMemberEmailInput("");
    setModalMembers([]);
  };

  const setViewerResponse = (groupId: string, status: InvitationStatus, alternate?: Partial<MeetingAlternate>) => {
    setStudyGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          members: g.members.map((m) =>
            m.email.toLowerCase() === CURRENT_USER_EMAIL.toLowerCase()
              ? {
                  ...m,
                  status,
                  alternate:
                    status === "denied" && alternate && Object.values(alternate).some(Boolean) ? alternate : undefined,
                }
              : m,
          ),
        };
      }),
    );
  };

  const cancelOrganizerMeeting = (groupId: string) => {
    setStudyGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, organizerRsvp: "canceled" as const } : g)));
  };

  const togglePollUpvote = (groupId: string, optionId: string) => {
    setGroupPollVotes((prev) => {
      const prior = prev[groupId] ?? {};
      const emailLower = CURRENT_USER_EMAIL.toLowerCase();
      const onThisOption = (prior[optionId] ?? []).some((x) => x.toLowerCase() === emailLower);
      const next: Record<string, string[]> = {};
      for (const [k, arr] of Object.entries(prior)) {
        next[k] = arr.filter((x) => x.toLowerCase() !== emailLower);
      }
      if (!onThisOption) {
        next[optionId] = [...(next[optionId] ?? []), CURRENT_USER_EMAIL];
      }
      return { ...prev, [groupId]: next };
    });
  };

  const sendGroupChat = (groupId: string, text: string, image?: string) => {
    setGroupChats((prev) => ({
      ...prev,
      [groupId]: [
        ...(prev[groupId] ?? []),
        {
          id: crypto.randomUUID(),
          author: "You",
          role: "student" as const,
          text,
          image,
          timestamp: new Date(),
        },
      ],
    }));
  };

  const modalGroup = modal?.type === "add-members" ? studyGroups.find((g) => g.id === modal.groupId) : undefined;
  const modalTitle =
    modal?.type === "new-group"
      ? `Add members — ${modal.name}`
      : modal?.type === "add-members"
        ? `Add members — ${modalGroup?.name ?? "Group"}`
        : "";
  const modalPrimaryLabel = modal?.type === "new-group" ? "Create" : "Save members";
  const modalPrimaryAction = modal?.type === "new-group" ? finalizeNewGroup : finalizeAddMembers;
  const canFinalizeNew = modal?.type === "new-group" && newGroupMeetingValid;

  const outletContext: StudentStudyGroupsOutletContext = {
    studyGroups,
    groupPollVotes,
    groupChats,
    groupNameDraft,
    setGroupNameDraft,
    openNewGroupModal,
    hoveredId,
    setHoveredId,
    setViewerResponse,
    cancelOrganizerMeeting,
    togglePollUpvote,
    sendGroupChat,
    openAddMembersModal,
  };

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
        <Outlet context={outletContext} />
      </main>

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
            padding: 28,
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
              width: "min(600px, 100%)",
              maxHeight: "min(90vh, 820px)",
              overflow: "auto",
              backgroundColor: "#fff",
              borderRadius: 22,
              padding: "34px 38px 38px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
              border: "1px solid rgba(214,214,214,0.5)",
              boxSizing: "border-box",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ height: 6, backgroundColor: palette.sage, borderRadius: 4, margin: "-34px -38px 22px" }} />
            <div
              id="study-group-modal-title"
              style={{ fontSize: 24, fontWeight: 800, color: palette.darkest, letterSpacing: -0.4, marginBottom: 10 }}
            >
              {modalTitle}
            </div>

            {modal.type === "new-group" && (
              <>
                <div style={{ fontSize: 16, fontWeight: 500, color: "rgba(92,30,38,0.55)", marginBottom: 20, lineHeight: 1.5 }}>
                  Propose when and where the group will meet. Invited members will see this and can accept, decline, or suggest
                  an alternate.
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={officeHoursLabelStyle}>Proposed Date *</label>
                  <input
                    type="date"
                    value={newGroupMeeting.date}
                    onChange={(e) => setNewGroupMeeting((m) => ({ ...m, date: e.target.value }))}
                    style={{ ...officeHoursInputStyle, cursor: "pointer" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
                  <div style={{ flex: 1 }}>
                    <label style={officeHoursLabelStyle}>Start Time *</label>
                    <input
                      type="time"
                      value={newGroupMeeting.startTime}
                      onChange={(e) => setNewGroupMeeting((m) => ({ ...m, startTime: e.target.value }))}
                      style={{ ...officeHoursInputStyle, cursor: "pointer" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={officeHoursLabelStyle}>End Time *</label>
                    <select
                      value={newGroupMeeting.duration}
                      onChange={(e) => setNewGroupMeeting((m) => ({ ...m, duration: e.target.value }))}
                      style={{ ...officeHoursInputStyle, cursor: "pointer" }}
                    >
                      <option value="">Select duration</option>
                      <option value="15 min">15 min</option>
                      <option value="30 min">30 min</option>
                      <option value="45 min">45 min</option>
                      <option value="60 min">60 min</option>
                      <option value="60+ min">60+ min</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={officeHoursLabelStyle}>Location *</label>
                  <input
                    type="text"
                    value={newGroupMeeting.location}
                    onChange={(e) => setNewGroupMeeting((m) => ({ ...m, location: e.target.value }))}
                    placeholder="Room, building, or online link"
                    style={officeHoursInputStyle}
                  />
                </div>
                <div style={{ fontSize: 16, fontWeight: 500, color: "rgba(92,30,38,0.55)", marginBottom: 18, lineHeight: 1.5 }}>
                  Add people to invite (optional — you can create with zero invites).
                </div>
              </>
            )}

            {modal.type === "add-members" && (
              <div style={{ fontSize: 16, fontWeight: 500, color: "rgba(92,30,38,0.55)", marginBottom: 24, lineHeight: 1.5 }}>
                Enter a name or email and click Add. Names appear below; then finish with {modalPrimaryLabel}.
              </div>
            )}

            {modal.type === "add-members" && modalGroup && modalGroup.members.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "rgba(92,30,38,0.45)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 10,
                  }}
                >
                  Current members
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, color: palette.deepBurgundy, fontSize: 15, fontWeight: 600 }}>
                  <li style={{ marginBottom: 6 }}>You (admin)</li>
                  {modalGroup.members.map((m) => (
                    <li key={m.email} style={{ marginBottom: 6 }}>
                      {displayMemberName(m)}{" "}
                      <span style={{ fontWeight: 500, color: "rgba(92,30,38,0.45)" }}>({m.email})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: "flex", gap: 14, alignItems: "stretch", marginBottom: 18 }}>
              <input
                type="text"
                value={memberEmailInput}
                onChange={(e) => setMemberEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMemberToModal()}
                placeholder="Name or member@university.edu"
                aria-label="Member name or email"
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
                    fontSize: 12,
                    fontWeight: 700,
                    color: "rgba(92,30,38,0.45)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 10,
                  }}
                >
                  {modal.type === "new-group" ? "Members to invite" : "Adding"}
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, color: palette.darkest, fontSize: 16, fontWeight: 600 }}>
                  {modalMembers.map((m) => (
                    <li key={m.email} style={{ marginBottom: 8 }}>
                      {displayMemberName(m)}{" "}
                      <span style={{ fontWeight: 500, color: "rgba(92,30,38,0.45)", fontSize: 14 }}>({m.email})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  padding: "14px 22px",
                  borderRadius: 14,
                  border: `1px solid rgba(39,1,21,0.2)`,
                  backgroundColor: "transparent",
                  color: palette.deepBurgundy,
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={modalPrimaryAction}
                disabled={modal.type === "new-group" ? !canFinalizeNew : false}
                style={{
                  padding: "14px 26px",
                  borderRadius: 14,
                  border: "none",
                  background:
                    modal.type === "new-group" && !canFinalizeNew
                      ? "rgba(122,155,118,0.35)"
                      : `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: modal.type === "new-group" && !canFinalizeNew ? "not-allowed" : "pointer",
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
