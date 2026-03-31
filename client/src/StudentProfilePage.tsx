import { useEffect, useRef, useState, useCallback, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

function PencilEditIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AvatarCircle({
  size,
  imageUrl,
  emptyLabel,
}: {
  size: number;
  imageUrl: string | null;
  emptyLabel?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        backgroundColor: "rgba(120, 120, 120, 0.28)",
        border: "1px solid rgba(39, 1, 21, 0.15)",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span
          style={{
            fontSize: Math.max(11, size / 10),
            fontWeight: 600,
            color: palette.deepBurgundy,
            opacity: 0.65,
            padding: 8,
            textAlign: "center",
          }}
        >
          {emptyLabel ?? "Photo"}
        </span>
      )}
    </div>
  );
}

export function StudentProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [studentName, setStudentName] = useState("Student Name");
  const [draftStudentName, setDraftStudentName] = useState("Student Name");
  const [email] = useState("student.name@gmail.com");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState<string | null>(null);
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const draftUrlRef = useRef<string | null>(null);
  const avatarUrlRef = useRef<string | null>(null);
  draftUrlRef.current = draftUrl;
  avatarUrlRef.current = avatarUrl;

  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  const openEditor = () => {
    setDraftUrl(avatarUrl);
    setDraftFile(avatarFile);
    setEditorOpen(true);
  };

  const revokeIfOrphanDraft = (url: string | null, baseUrl: string | null) => {
    if (url && url.startsWith("blob:") && url !== baseUrl) {
      URL.revokeObjectURL(url);
    }
  };

  const closeEditorDiscard = useCallback(() => {
    const d = draftUrlRef.current;
    const a = avatarUrlRef.current;
    revokeIfOrphanDraft(d, a);
    setEditorOpen(false);
    setDraftUrl(null);
    setDraftFile(null);
  }, []);

  const handleModalFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setDraftFile(file);
    setDraftUrl((prev) => {
      revokeIfOrphanDraft(prev, avatarUrlRef.current);
      return URL.createObjectURL(file);
    });
    event.target.value = "";
  };

  const handleEditorSave = () => {
    if (!draftFile) {
      setEditorOpen(false);
      return;
    }
    if (avatarUrl && avatarUrl !== draftUrl) {
      URL.revokeObjectURL(avatarUrl);
    }
    setAvatarUrl(draftUrl);
    setAvatarFile(draftFile);
    setEditorOpen(false);
    setDraftUrl(null);
    setDraftFile(null);
    alert(`Saved: ${draftFile.name} (${Math.round(draftFile.size / 1024)} KB)`);
  };

  useEffect(() => {
    if (!editorOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEditorDiscard();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editorOpen, closeEditorDiscard]);

  const MAIN_AVATAR = 152;
  const MODAL_AVATAR = 168;
  const PAGE_AVATAR = 170;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        textAlign: "left",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        color: "#111",
        display: "flex",
      }}
    >
      {/* sidebar — (30%) color*/}
      <aside
        style={{
          width: 180,
          background: `linear-gradient(180deg, #3d1542 0%, ${palette.darkest} 100%)`,
          padding: 12,
          boxSizing: "border-box",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontFamily: "Italiana, serif",
            fontSize: 30,
            letterSpacing: 1.5,
            color: "#fff",
            padding: "6px 4px 10px 4px",
          }}
        >
          <img src="/logo.png" alt="logo" style={{ height: 48, objectFit: "contain", marginBottom: 4 }} />
          <span style={{ lineHeight: 1 }}>D.I.Y.A</span>
        </div>

        {/* divider line */}
        <div
          style={{
            height: 1,
            backgroundColor: "rgba(255,255,255,0.25)",
            margin: "0 0 10px 0",
          }}
        />

        {/* Sidebar navigation buttons */}
        <nav aria-label="Sidebar navigation" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {(
            [
              { id: "profile", label: "Profile" },
              { id: "groups", label: "Groups" },
              { id: "request", label: "Request Office Hours" },
              { id: "selfcheck", label: "Self-Check" },
            ] as const
          ).map((item) => {
            const isActive = item.id === "profile";
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === "profile") {
                    navigate("/profile");
                    return;
                  }
                  if (item.id === "groups") {
                    navigate("/groups");
                    return;
                  }
                  if (item.id === "request") {
                    navigate("/office-hours");
                    return;
                  }
                  if (item.id === "selfcheck") {
                    navigate("/self-check");
                    return;
                  }
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: isActive ? "rgba(255,255,255,0.88)" : "transparent",
                  color: isActive ? palette.darkest : "rgba(255,255,255,0.85)",
                  fontSize: 13,
                  fontWeight: isActive ? 800 : 600,
                  cursor: "pointer",
                  transition: "background-color 120ms ease",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} /> {/* spacer to push sign out button to bottom */}

        {/* bottom divider */}
        <div
          style={{
            height: 1,
            backgroundColor: "rgba(255,255,255,0.2)",
            margin: "10px 0 8px 0",
          }}
        />

        {/* sign out button */}
        <button
          type="button"
          onClick={() => alert("Signed out (auth not wired yet)")}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.2)",
            backgroundColor: "rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.9)",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </aside>

      <main style={{ flex: 1, padding: "32px 36px 56px 24px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 1400, minHeight: "calc(100vh - 32px - 56px)", display: "flex", flexDirection: "column" }}>
          {/* Page title — same typography as Groups page hero, centered */}
          <div
            style={{
              color: palette.crimson,
              fontSize: 44,
              fontWeight: 850,
              letterSpacing: -1,
              lineHeight: 1.1,
              textAlign: "center",
            }}
          >
            Profile
          </div>

          <div
            style={{
              height: 1,
              backgroundColor: "rgba(39,1,21,0.12)",
              marginTop: 14,
              marginBottom: 18,
            }}
          />

          <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <div
              style={{
                position: "relative",
                width: PAGE_AVATAR,
                height: PAGE_AVATAR,
              }}
            >
              <AvatarCircle size={PAGE_AVATAR} imageUrl={avatarUrl} emptyLabel="Add photo" />
              <button
                type="button"
                aria-label="Edit profile photo"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditor();
                }}
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: `1px solid rgba(39,1,21,0.2)`,
                  backgroundColor: "rgba(255,255,255,0.92)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <PencilEditIcon color={palette.deepBurgundy} />
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              textAlign: "center",
              color: palette.deepBurgundy,
              fontSize: 40,
              fontFamily: "Italiana, serif",
              letterSpacing: 0.5,
            }}
          >
            {studentName}
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "min(920px, 100%)" }}>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: palette.deepBurgundy,
                  marginBottom: 10,
                  textAlign: "center",
                }}
              >
                Basic Information
              </div>

              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.65)",
                  border: "1px solid rgba(39,1,21,0.14)",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.07)",
                }}
              >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "220px 1fr",
                  borderBottom: "1px solid rgba(39,1,21,0.08)",
                }}
              >
                <div style={{ padding: "14px 16px", fontWeight: 700, color: palette.deepBurgundy }}>Student Name</div>
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {isEditingName ? (
                    <>
                      <input
                        value={draftStudentName}
                        onChange={(e) => setDraftStudentName(e.target.value)}
                        style={{
                          minWidth: 260,
                          maxWidth: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1px solid rgba(39,1,21,0.2)",
                          outline: "none",
                          fontSize: 14,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = draftStudentName.trim();
                          if (!trimmed) return;
                          setStudentName(trimmed);
                          setDraftStudentName(trimmed);
                          setIsEditingName(false);
                        }}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "none",
                          backgroundColor: palette.sage,
                          color: "#fff",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDraftStudentName(studentName);
                          setIsEditingName(false);
                        }}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(39,1,21,0.2)",
                          backgroundColor: "transparent",
                          color: palette.deepBurgundy,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span style={{ fontWeight: 600 }}>{studentName}</span>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(true)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(39,1,21,0.2)",
                          backgroundColor: "rgba(255,255,255,0.7)",
                          color: palette.deepBurgundy,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Edit name
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "220px 1fr",
                  borderBottom: "1px solid rgba(39,1,21,0.08)",
                }}
              >
                <div style={{ padding: "14px 16px", fontWeight: 700, color: palette.deepBurgundy }}>Email</div>
                <div style={{ padding: "14px 16px", fontWeight: 600 }}>{email}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "220px 1fr" }}>
                <div style={{ padding: "14px 16px", fontWeight: 700, color: palette.deepBurgundy }}>Notifications</div>
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    aria-pressed={notificationsEnabled}
                    onClick={() => setNotificationsEnabled((v) => !v)}
                    style={{
                      width: 52,
                      height: 30,
                      borderRadius: 999,
                      border: "1px solid rgba(39,1,21,0.2)",
                      backgroundColor: notificationsEnabled ? "rgba(122,155,118,0.95)" : "rgba(140,140,140,0.35)",
                      position: "relative",
                      cursor: "pointer",
                      transition: "background-color 150ms ease",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 3,
                        left: notificationsEnabled ? 25 : 3,
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        backgroundColor: "#fff",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                        transition: "left 150ms ease",
                      }}
                    />
                  </button>
                  <span style={{ fontWeight: 700, color: notificationsEnabled ? palette.sage : "rgba(39,1,21,0.55)" }}>
                    {notificationsEnabled ? "On" : "Off"}
                  </span>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {editorOpen && (
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
            if (e.target === e.currentTarget) closeEditorDiscard();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-photo-editor-title"
            style={{
              width: "min(400px, 100%)",
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
              border: "1px solid rgba(214,214,214,0.5)",
              boxSizing: "border-box",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div
              id="profile-photo-editor-title"
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: palette.deepBurgundy,
                marginBottom: 18,
              }}
            >
              Update profile photo
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleModalFileChange}
            />

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <AvatarCircle
                size={MODAL_AVATAR}
                imageUrl={draftUrl}
                emptyLabel="Preview"
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "none",
                    backgroundColor: palette.crimson,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Choose image
                </button>
                <button
                  type="button"
                  onClick={handleEditorSave}
                  disabled={!draftFile}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: `1px solid ${palette.lightGray}`,
                    backgroundColor: draftFile ? palette.sage : "rgba(122,155,118,0.35)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: draftFile ? "pointer" : "not-allowed",
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={closeEditorDiscard}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: `1px solid rgba(39,1,21,0.2)`,
                    backgroundColor: "transparent",
                    color: palette.deepBurgundy,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
