import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { ProfessorSidebar } from "../../ProfessorSidebar";
import { useProfessorGroups } from "../../ProfessorGroupContext";
import { useTranslation } from "react-i18next";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

const GROUPS_API = "/api/groups";

export function ProfessorHomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth0();
  const { groups, isLoading, reload, setSelectedGroupId } = useProfessorGroups();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleCreateGroup = async () => {
    if (!newTitle.trim() || !user?.sub) return;
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch(GROUPS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          professorId: user.sub,
        }),
      });

      if (!response.ok) throw new Error("Failed to create group.");

      setNewTitle("");
      setNewDescription("");
      setShowCreateModal(false);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSignOut = () => {
    window.localStorage.removeItem("diya_role");
    window.sessionStorage.removeItem("pendingSignupRole");
    void logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    navigate("/professor/forum");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: palette.cream,
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        display: "flex",
      }}
    >
      <ProfessorSidebar activeItem="home" onSignOut={handleSignOut} />

      <div style={{ flex: 1, padding: "32px 36px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 900, color: palette.deepBurgundy, letterSpacing: -0.8 }}>
              {t("home.title")}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(92,30,38,0.55)", marginTop: 4 }}>
              {t("home.subtitle", { count: groups.length })}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #5C1E26 0%, #7b1f33 100%)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(92,30,38,0.25)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t("home.createButton")}
          </button>
        </div>

        {error && (
          <div style={{ padding: 16, borderRadius: 12, backgroundColor: "rgba(220,53,69,0.08)", color: "#DC3545", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {isLoading && (
          <div style={{ padding: 32, textAlign: "center", color: palette.deepBurgundy, fontWeight: 700, fontSize: 14 }}>
            {t("home.loading")}
          </div>
        )}

        {!isLoading && groups.length === 0 && (
          <div
            style={{
              padding: "48px 32px",
              textAlign: "center",
              backgroundColor: "#fff",
              borderRadius: 16,
              border: "1px solid rgba(214,214,214,0.3)",
              boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 8 }}>
              {t("home.empty.title")}
            </div>
            <div style={{ fontSize: 14, color: "rgba(92,30,38,0.55)", fontWeight: 600 }}>
              {t("home.empty.subtitle")}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {groups.map((group) => {
            const isHovered = hoveredId === group.id;
            return (
              <div
                key={group.id}
                onClick={() => handleSelectGroup(group.id)}
                onMouseEnter={() => setHoveredId(group.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: "22px 24px",
                  border: `2px solid ${isHovered ? palette.crimson : "rgba(214,214,214,0.3)"}`,
                  boxShadow: isHovered ? "0 12px 36px rgba(0,0,0,0.15)" : "0 4px 18px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  transition: "all 120ms ease",
                  transform: isHovered ? "translateY(-2px)" : "none",
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 6 }}>
                  {group.title}
                </div>
                {group.description && (
                  <div style={{ fontSize: 13, color: "rgba(92,30,38,0.55)", fontWeight: 600, marginBottom: 12, lineHeight: 1.5 }}>
                    {group.description}
                  </div>
                )}
                <div style={{ display: "flex", gap: 12, fontSize: 12, fontWeight: 700 }}>
                  <div
                    style={{
                      padding: "5px 10px",
                      borderRadius: 8,
                      backgroundColor: "rgba(122,155,118,0.12)",
                      color: palette.sage,
                    }}
                  >
                    {t("home.groupCard.members", { count: group.members.length })}
                  </div>
                  <div
                    style={{
                      padding: "5px 10px",
                      borderRadius: 8,
                      backgroundColor: "rgba(162,34,55,0.08)",
                      color: palette.crimson,
                    }}
                  >
                    {t("home.groupCard.view")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => { setShowCreateModal(false); setNewTitle(""); setNewDescription(""); setError(null); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: "28px 28px 22px",
              width: 440,
              maxWidth: "90vw",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 18 }}>
              {t("home.modal.title")}
            </div>

            <label style={{ fontSize: 13, fontWeight: 700, color: palette.deepBurgundy, display: "block", marginBottom: 6 }}>
              {t("home.modal.groupTitleLabel")}
            </label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t("home.modal.groupTitlePlaceholder")}
              autoFocus
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(39,1,21,0.2)",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 14,
              }}
            />

            <label style={{ fontSize: 13, fontWeight: 700, color: palette.deepBurgundy, display: "block", marginBottom: 6 }}>
              {t("home.modal.descriptionLabel")}
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder={t("home.modal.descriptionPlaceholder")}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(39,1,21,0.2)",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 18,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <button
                type="button"
                onClick={() => { setShowCreateModal(false); setNewTitle(""); setNewDescription(""); setError(null); }}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "1px solid rgba(39,1,21,0.2)",
                  backgroundColor: "transparent",
                  color: palette.deepBurgundy,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t("home.modal.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleCreateGroup()}
                disabled={isCreating || !newTitle.trim()}
                style={{
                  padding: "10px 24px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: palette.crimson,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isCreating || !newTitle.trim() ? "not-allowed" : "pointer",
                  opacity: isCreating || !newTitle.trim() ? 0.5 : 1,
                }}
              >
                {isCreating ? t("home.modal.creating") : t("home.modal.create")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
