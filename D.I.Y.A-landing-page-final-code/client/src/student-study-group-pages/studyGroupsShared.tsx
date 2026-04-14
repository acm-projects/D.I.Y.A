import {
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
} from "react";

export const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
} as const;

export const officeHoursInputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(39,1,21,0.15)",
  fontSize: 14,
  fontWeight: 500,
  outline: "none",
  boxSizing: "border-box",
  backgroundColor: "#fff",
  color: "#111",
  fontFamily: "inherit",
};

export const officeHoursLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: palette.deepBurgundy,
  marginBottom: 6,
  display: "block",
};

export const CURRENT_USER_EMAIL = "student@university.edu";

export type InvitationStatus = "pending" | "accepted" | "denied" | "canceled";

export type ProposedMeeting = {
  date: string;
  startTime: string;
  duration: string;
  location: string;
};

export type MeetingAlternate = {
  date: string;
  startTime: string;
  duration: string;
  location: string;
};

export type StudyMember = {
  email: string;
  displayName: string;
  status: InvitationStatus;
  alternate?: Partial<MeetingAlternate>;
};

export type StudyGroup = {
  id: string;
  name: string;
  role: "admin" | "member";
  organizerRsvp?: "accepted" | "canceled";
  proposedMeeting: ProposedMeeting;
  members: StudyMember[];
  forumPostsCount: number;
};

export type StudyGroupChatMsg = {
  id: string;
  author: string;
  role: "student";
  text: string;
  image?: string;
  timestamp: Date;
};

export function emailToDisplayName(email: string): string {
  const local = email.split("@")[0]?.trim() || email;
  return local ? local.charAt(0).toUpperCase() + local.slice(1).toLowerCase() : email;
}

export function isViewerEmail(email: string): boolean {
  return email.toLowerCase() === CURRENT_USER_EMAIL;
}

export function displayMemberName(m: StudyMember): string {
  return isViewerEmail(m.email) ? "You" : m.displayName;
}

export const initialStudyGroups: StudyGroup[] = [
  {
    id: "sg-b",
    name: "Lab help",
    role: "member",
    proposedMeeting: {
      date: "2026-06-03",
      startTime: "10:00",
      duration: "45 min",
      location: "Room 101",
    },
    members: [
      { email: CURRENT_USER_EMAIL, displayName: "You", status: "pending" },
      { email: "owner@test.edu", displayName: "Owner", status: "accepted" },
    ],
    forumPostsCount: 0,
  },
];

export function memberCount(g: StudyGroup): number {
  return g.role === "admin" ? 1 + g.members.length : g.members.length;
}

export function formatMeetingDate(isoDate: string): string {
  if (!isoDate) return "—";
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export function formatMeetingTime(isoTime: string): string {
  if (!isoTime) return "—";
  const [h, m] = isoTime.split(":").map(Number);
  if (Number.isNaN(h)) return isoTime;
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function summarizeMeetingSlots(pm: ProposedMeeting): string {
  return [formatMeetingDate(pm.date), formatMeetingTime(pm.startTime), pm.duration, pm.location].filter(Boolean).join(" · ");
}

export function summarizeAlternate(alt: Partial<MeetingAlternate>): string {
  return [
    alt.date && formatMeetingDate(alt.date),
    alt.startTime && formatMeetingTime(alt.startTime),
    alt.duration,
    alt.location,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function buildPollOptions(g: StudyGroup): { id: string; label: string; sub: string }[] {
  const rows: { id: string; label: string; sub: string }[] = [
    {
      id: "organizer",
      label: "Organizer’s proposed meeting",
      sub: summarizeMeetingSlots(g.proposedMeeting),
    },
  ];
  for (const m of g.members) {
    if (m.status === "denied" && m.alternate && Object.values(m.alternate).some(Boolean)) {
      rows.push({
        id: `alt:${m.email.toLowerCase()}`,
        label: `${displayMemberName(m)}’s alternate`,
        sub: summarizeAlternate(m.alternate),
      });
    }
  }
  return rows;
}

export function viewerPollChoice(votes: Record<string, string[]> | undefined): string | null {
  if (!votes) return null;
  const e = CURRENT_USER_EMAIL.toLowerCase();
  for (const [optId, list] of Object.entries(votes)) {
    if (list.some((x) => x.toLowerCase() === e)) return optId;
  }
  return null;
}

export function UsersIcon({ color }: { color: string }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke={color} strokeWidth="2" />
      <path d="M4 20.5c1.6-3.2 4.5-5 8-5s6.4 1.8 8 5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ForumIcon({ color }: { color: string }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 7.5A4.5 4.5 0 0 1 10.5 3h3A4.5 4.5 0 0 1 18 7.5v3A4.5 4.5 0 0 1 13.5 15H11l-4.5 3V15A4.5 4.5 0 0 1 6 10.5v-3Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const inputRowStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "16px 18px",
  border: "1.5px solid rgba(214,214,214,0.5)",
  borderRadius: 16,
  fontSize: 17,
  fontFamily: "inherit",
  outline: "none",
  color: palette.darkest,
  boxSizing: "border-box",
};

export const primarySageButtonStyle: CSSProperties = {
  flexShrink: 0,
  padding: "0 28px",
  minHeight: 54,
  background: `linear-gradient(135deg, ${palette.sage}, #5f8a5c)`,
  color: "white",
  border: "none",
  borderRadius: 16,
  fontSize: 17,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 2px 12px rgba(122,155,118,0.3)",
};

export type ModalMode = null | { type: "new-group"; name: string } | { type: "add-members"; groupId: string };

export const emptyMeeting: ProposedMeeting = {
  date: "",
  startTime: "",
  duration: "",
  location: "",
};

export const emptyAlternate: MeetingAlternate = {
  date: "",
  startTime: "",
  duration: "",
  location: "",
};

export function GroupChatPanel({
  messages,
  onSend,
}: {
  messages: StudyGroupChatMsg[];
  onSend: (text: string, image?: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    const text = draft.trim();
    if (!text && !imagePreview) return;
    onSend(text || "(image)", imagePreview);
    setDraft("");
    setImagePreview(undefined);
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid rgba(214,214,214,0.5)",
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#fafafa",
        minHeight: 280,
        maxHeight: 340,
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "rgba(92,30,38,0.4)",
              textAlign: "center",
              padding: "20px 8px",
            }}
          >
            No messages yet — say hi to the group.
          </div>
        )}
        {messages.map((r) => {
          const isSelf = r.author === "You";
          return (
            <div
              key={r.id}
              style={{
                display: "flex",
                justifyContent: isSelf ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  padding: "10px 14px",
                  borderRadius: 16,
                  borderBottomRightRadius: isSelf ? 4 : 16,
                  borderBottomLeftRadius: isSelf ? 16 : 4,
                  backgroundColor: isSelf ? "rgba(162,34,55,0.08)" : "#fff",
                  border: isSelf ? `1px solid rgba(162,34,55,0.2)` : "1px solid #ddd",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    marginBottom: 4,
                    color: palette.deepBurgundy,
                  }}
                >
                  {r.author}
                </div>
                {r.image && (
                  <img src={r.image} alt="attachment" style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 6 }} />
                )}
                <div style={{ fontSize: 14, lineHeight: 1.5, color: "#111" }}>{r.text}</div>
                <div style={{ fontSize: 10, marginTop: 6, opacity: 0.5, textAlign: "right" }}>
                  {r.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {imagePreview && (
        <div style={{ padding: "6px 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
          <img src={imagePreview} alt="preview" style={{ height: 44, borderRadius: 6 }} />
          <button
            type="button"
            onClick={() => setImagePreview(undefined)}
            style={{
              background: "none",
              border: "none",
              color: palette.crimson,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Remove
          </button>
        </div>
      )}

      <div
        style={{
          borderTop: "1px solid rgba(214,214,214,0.4)",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
          backgroundColor: "#fff",
        }}
      >
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload image"
          style={{
            background: "none",
            border: `1px solid rgba(39,1,21,0.2)`,
            borderRadius: 8,
            padding: "8px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={palette.deepBurgundy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </button>

        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          type="text"
          placeholder="Message the group…"
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            border: `1px solid rgba(39,1,21,0.2)`,
            fontSize: 14,
            outline: "none",
          }}
        />

        <button
          type="button"
          onClick={handleSend}
          aria-label="Send message"
          style={{
            background: palette.crimson,
            border: "none",
            borderRadius: 8,
            padding: "8px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/** Passed from `StudentStudyGroupsLayout` via `<Outlet context={...} />` */
export type StudentStudyGroupsOutletContext = {
  studyGroups: StudyGroup[];
  groupPollVotes: Record<string, Record<string, string[]>>;
  groupChats: Record<string, StudyGroupChatMsg[]>;
  groupNameDraft: string;
  setGroupNameDraft: Dispatch<SetStateAction<string>>;
  openNewGroupModal: () => void;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  setViewerResponse: (groupId: string, status: InvitationStatus, alternate?: Partial<MeetingAlternate>) => void;
  cancelOrganizerMeeting: (groupId: string) => void;
  togglePollUpvote: (groupId: string, optionId: string) => void;
  sendGroupChat: (groupId: string, text: string, image?: string) => void;
  openAddMembersModal: (g: StudyGroup) => void;
};
