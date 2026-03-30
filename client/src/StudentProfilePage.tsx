import { useAuth0 } from "@auth0/auth0-react";
import { StudentSidebar } from "./StudentSidebar";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

export function StudentProfilePage() {
  const { user } = useAuth0();

  const displayName = user?.name || user?.nickname || "D.I.Y.A Student";
  const email = user?.email || "No email available";
  const avatarUrl = user?.picture;
  const isVerified = Boolean(user?.email_verified);
  const lastUpdated = user?.updated_at
    ? new Date(user.updated_at).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

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
        <StudentSidebar activeItem="profile" />
      </aside>

      <main style={{ flex: 1, padding: "32px 36px 56px 24px", boxSizing: "border-box", overflowY: "auto" }}>
        <div style={{ maxWidth: 1100 }}>
          <div
            style={{
              color: palette.crimson,
              fontSize: 44,
              fontWeight: 850,
              letterSpacing: -1,
              lineHeight: 1.1,
            }}
          >
            Your Profile
          </div>

          <div
            style={{
              height: 1,
              backgroundColor: "rgba(39,1,21,0.12)",
              marginTop: 14,
              marginBottom: 24,
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(320px, 420px) minmax(280px, 1fr)",
              gap: 24,
              alignItems: "start",
            }}
          >
            <section
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                border: "1px solid rgba(214,214,214,0.45)",
                boxShadow: "0 10px 28px rgba(39,1,21,0.08)",
                padding: "32px 28px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    style={{
                      width: 116,
                      height: 116,
                      borderRadius: 999,
                      objectFit: "cover",
                      border: `4px solid rgba(92,30,38,0.14)`,
                      boxShadow: "0 10px 22px rgba(39,1,21,0.12)",
                      marginBottom: 18,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 116,
                      height: 116,
                      borderRadius: 999,
                      background: `linear-gradient(135deg, ${palette.crimson} 0%, ${palette.deepBurgundy} 100%)`,
                      color: "#fff",
                      fontSize: 36,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 18,
                    }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div style={{ fontSize: 28, fontWeight: 800, color: palette.deepBurgundy, lineHeight: 1.2 }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, color: "rgba(92,30,38,0.72)", marginTop: 8 }}>
                  {email}
                </div>

                <div
                  style={{
                    marginTop: 18,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    borderRadius: 999,
                    backgroundColor: isVerified ? "rgba(122,155,118,0.14)" : "rgba(162,34,55,0.12)",
                    color: isVerified ? palette.sage : palette.crimson,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: isVerified ? palette.sage : palette.crimson,
                    }}
                  />
                  {isVerified ? "Email verified" : "Email verification pending"}
                </div>
              </div>
            </section>

            <section style={{ display: "grid", gap: 20 }}>
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 20,
                  border: "1px solid rgba(214,214,214,0.45)",
                  boxShadow: "0 10px 28px rgba(39,1,21,0.08)",
                  padding: "28px 30px",
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 18 }}>
                  Account Overview
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                  <div style={{ padding: "16px 18px", borderRadius: 14, backgroundColor: "rgba(39,1,21,0.04)" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(92,30,38,0.55)", marginBottom: 8 }}>
                      Full Name
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: palette.deepBurgundy }}>{displayName}</div>
                  </div>

                  <div style={{ padding: "16px 18px", borderRadius: 14, backgroundColor: "rgba(39,1,21,0.04)" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(92,30,38,0.55)", marginBottom: 8 }}>
                      Email Address
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: palette.deepBurgundy, overflowWrap: "anywhere" }}>{email}</div>
                  </div>

                  <div style={{ padding: "16px 18px", borderRadius: 14, backgroundColor: "rgba(39,1,21,0.04)" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(92,30,38,0.55)", marginBottom: 8 }}>
                      Last Synced
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: palette.deepBurgundy }}>{lastUpdated}</div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: `linear-gradient(135deg, rgba(162,34,55,0.12) 0%, rgba(92,30,38,0.08) 100%)`,
                  borderRadius: 20,
                  border: "1px solid rgba(162,34,55,0.12)",
                  padding: "24px 26px",
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 8 }}>
                  Connected with Auth0
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(39,1,21,0.72)" }}>
                  Your profile details on this page are pulled directly from your Auth0 session. As you continue wiring the rest of the app, this page is now ready to serve as the authenticated student profile screen.
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
