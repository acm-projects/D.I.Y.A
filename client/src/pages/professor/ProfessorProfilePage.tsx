import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Bell, Globe, LockKeyhole, Mail, Palette, ShieldCheck, User, Trash2 } from "lucide-react";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ProfessorSidebar } from "../../ProfessorSidebar";
import { db } from "../../firebase";
import { useTheme } from "../../context/ThemeContext";

const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

type NotificationPreferences = {
  emailAlerts: boolean;
  newForumReplies: boolean;
};

const defaultNotificationPreferences: NotificationPreferences = {
  emailAlerts: true,
  newForumReplies: true,
};

const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const auth0Connection = import.meta.env.VITE_AUTH0_CONNECTION || "Username-Password-Authentication";

function readNotificationPreferences(data: Record<string, unknown> | undefined): NotificationPreferences {
  const nested = data?.notificationPreferences;
  const nestedPrefs = typeof nested === "object" && nested ? (nested as Record<string, unknown>) : null;

  const emailAlerts = typeof nestedPrefs?.emailAlerts === "boolean"
    ? nestedPrefs.emailAlerts
    : typeof data?.emailAlerts === "boolean"
      ? data.emailAlerts
      : defaultNotificationPreferences.emailAlerts;

  const newForumReplies = typeof nestedPrefs?.newForumReplies === "boolean"
    ? nestedPrefs.newForumReplies
    : typeof data?.newForumReplies === "boolean"
      ? data.newForumReplies
      : defaultNotificationPreferences.newForumReplies;

  return { emailAlerts, newForumReplies };
}

function ToggleRow({
  title,
  description,
  checked,
  disabled,
  isSaving,
  onToggle,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  isSaving: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#edd9dd] bg-white/90 px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="pr-2 text-left">
        <div className="text-sm font-semibold text-[#5C1E26]">{title}</div>
        <div className="mt-1 text-sm leading-6 text-[#6d5560]">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        disabled={disabled || isSaving}
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-all duration-200 ${
          checked ? "border-[#7A9B76] bg-[#7A9B76]" : "border-[#d7c2c7] bg-[#f4eaed]"
        } ${disabled || isSaving ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-7" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

export function ProfessorProfilePage() {
  const { user, logout } = useAuth0();
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(defaultNotificationPreferences);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [savingPreferenceKey, setSavingPreferenceKey] = useState<keyof NotificationPreferences | null>(null);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savedDisplayName, setSavedDisplayName] = useState<string>("");
  const [nameInput, setNameInput] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [savedBio, setSavedBio] = useState("");
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const { theme, setTheme } = useTheme();

  const email = user?.email?.trim() || "";
  const displayName = savedDisplayName || user?.name?.trim() || user?.nickname?.trim() || "";
  const displayLabel = displayName && displayName !== email ? displayName : "";
  const avatarUrl = user?.picture;
  const userDocId = user?.sub?.trim() || "";
  const lastUpdated = user?.updated_at
    ? new Date(user.updated_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : "Recently";

  const handleSignOut = () => {
    window.localStorage.removeItem("diya_role");
    window.sessionStorage.removeItem("pendingSignupRole");
    void logout({ logoutParams: { returnTo: window.location.origin } });
  };

  useEffect(() => {
    if (!successMessage) return undefined;
    const id = window.setTimeout(() => setSuccessMessage(null), 4500);
    return () => window.clearTimeout(id);
  }, [successMessage]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!userDocId) { setIsLoadingPreferences(false); return; }
      setIsLoadingPreferences(true);
      try {
        const snap = await getDoc(doc(db, "users", userDocId));
        if (!snap.exists()) { if (isMounted) setIsLoadingPreferences(false); return; }
        const data = snap.data() as Record<string, unknown> | undefined;
        const prefs = readNotificationPreferences(data);
        const savedName = typeof data?.displayName === "string" ? data.displayName.trim() : "";
        const savedBioVal = typeof data?.bio === "string" ? data.bio.trim() : "";
        const savedTz = typeof data?.timezone === "string" ? data.timezone : Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (isMounted) {
          setNotificationPreferences(prefs);
          setSavedDisplayName(savedName);
          setNameInput(savedName);
          setSavedBio(savedBioVal);
          setBioInput(savedBioVal);
          setTimezone(savedTz);
        }
      } catch (error) {
        if (isMounted) console.error("Failed to load preferences.", error);
      } finally {
        if (isMounted) setIsLoadingPreferences(false);
      }
    };
    void load();
    return () => { isMounted = false; };
  }, [userDocId]);

  const handlePasswordReset = async () => {
    if (!email) return;
    setIsSendingPasswordReset(true);
    try {
      const response = await fetch(`https://${auth0Domain}/dbconnections/change_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: auth0ClientId, email, connection: auth0Connection }),
      });
      if (!response.ok) throw new Error(await response.text());
      setSuccessMessage(`Password reset email sent to ${email}.`);
    } catch (error) {
      console.error("Failed to send password reset email.", error);
    } finally {
      setIsSendingPasswordReset(false);
    }
  };

  const handleTogglePreference = async (key: keyof NotificationPreferences) => {
    if (!userDocId) return;
    const prev = notificationPreferences;
    const next = { ...prev, [key]: !prev[key] };
    setNotificationPreferences(next);
    setSavingPreferenceKey(key);
    try {
      await updateDoc(doc(db, "users", userDocId), {
        emailAlerts: next.emailAlerts,
        newForumReplies: next.newForumReplies,
        notificationPreferences: next,
        updatedAt: serverTimestamp(),
      });
      setSuccessMessage(`${key === "emailAlerts" ? "Email alerts" : "Forum reply notifications"} updated.`);
    } catch (error) {
      console.error("Failed to save notification preferences.", error);
      setNotificationPreferences(prev);
    } finally {
      setSavingPreferenceKey(null);
    }
  };

  const handleSaveName = async () => {
    if (!userDocId) return;
    const trimmed = nameInput.trim();
    setIsSavingName(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userDocId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: trimmed }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSavedDisplayName(trimmed);
      setSuccessMessage("Display name updated successfully.");
    } catch (error) {
      console.error("Failed to save display name.", error);
      setSuccessMessage("Failed to save name. Please try again.");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSaveBio = async () => {
    if (!userDocId) return;
    setIsSavingBio(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userDocId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioInput.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSavedBio(bioInput.trim());
      setSuccessMessage("Bio updated successfully.");
    } catch (error) {
      console.error("Failed to save bio.", error);
      setSuccessMessage("Failed to save bio. Please try again.");
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleSaveTimezone = async (tz: string) => {
    if (!userDocId) return;
    setTimezone(tz);
    try {
      await updateDoc(doc(db, "users", userDocId), { timezone: tz, updatedAt: serverTimestamp() });
      setSuccessMessage("Timezone updated.");
    } catch (error) {
      console.error("Failed to save timezone.", error);
    }
  };

  const handleToggleTheme = async () => {
    if (!userDocId) return;
    const next = theme === "light" ? "dark" as const : "light" as const;
    setTheme(next);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userDocId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSuccessMessage(`Theme set to ${next}.`);
    } catch (error) {
      console.error("Failed to save theme.", error);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: theme === "dark" ? "#1a1020" : palette.cream,
        textAlign: "left",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        color: theme === "dark" ? "#e8dfe3" : "#111",
        display: "flex",
        transition: "background-color 0.3s, color 0.3s",
      }}
    >
      <ProfessorSidebar activeItem="profile" onSignOut={handleSignOut} />

      <main className="flex-1 overflow-y-auto px-6 py-8 text-left lg:px-9 lg:py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          {/* ── Hero header ── */}
          <div className="rounded-[28px] border border-[#eadadf] bg-white px-6 py-6 shadow-[0_14px_40px_rgba(39,1,21,0.08)] sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center gap-4 sm:gap-5">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayLabel || email} className="h-20 w-20 rounded-full border-4 border-[#f2e6e9] object-cover shadow-md sm:h-24 sm:w-24" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#a22237_0%,#5C1E26_100%)] text-3xl font-extrabold text-white shadow-md sm:h-24 sm:w-24">
                    {(displayLabel || email || "P").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold uppercase tracking-[0.28em] text-[#a22237]">Professor settings</div>
                  <h1 className="mt-2 text-3xl font-black tracking-tight text-[#270115] sm:text-4xl">Manage your account</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d5560] sm:text-base">
                    Update your profile, security preferences, and control how D.I.Y.A notifies you about important activity.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#f8f1f3] px-3 py-1.5 text-xs font-semibold text-[#5C1E26]">
                      <ShieldCheck size={14} />
                      Last synced {lastUpdated}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid min-w-[200px] gap-2 rounded-3xl border border-[#efe1e5] bg-[#fcf8f9] p-4 shadow-sm">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#8c6d76]">Account</div>
                  <div className="mt-1 text-lg font-bold text-[#5C1E26]">{displayLabel || email || "Professor"}</div>
                  {displayLabel && <div className="mt-0.5 break-all text-sm text-[#6d5560]">{email}</div>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-white px-3 py-2 text-left shadow-sm">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8c6d76]">Email alerts</div>
                    <div className="mt-1 text-lg font-black text-[#270115]">{notificationPreferences.emailAlerts ? "On" : "Off"}</div>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-2 text-left shadow-sm">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8c6d76]">Forum replies</div>
                    <div className="mt-1 text-lg font-black text-[#270115]">{notificationPreferences.newForumReplies ? "On" : "Off"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {successMessage ? (
            <div className="rounded-2xl border border-[#d7ead3] bg-[#edf7eb] px-5 py-4 text-sm font-semibold text-[#476942] shadow-sm">
              {successMessage}
            </div>
          ) : null}

          {/* ── Personal Information ── */}
          <section className="rounded-[28px] border border-[#eadadf] bg-white p-6 shadow-[0_12px_34px_rgba(39,1,21,0.08)] sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f3eef5] text-[#6b4f7a]">
                <User size={22} />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-extrabold text-[#270115]">Personal Information</h2>
                <p className="mt-1 text-sm leading-6 text-[#6d5560]">
                  Set your display name so students and colleagues can identify you.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#efe1e5] bg-[#fcf8f9] p-4">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-[#8c6d76]">Display Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name..."
                  className="mt-2 w-full rounded-xl border border-[#d7c2c7] bg-white px-3 py-2.5 text-sm text-[#270115] outline-none focus:border-[#a22237]"
                />
                <button
                  type="button"
                  onClick={() => void handleSaveName()}
                  disabled={isSavingName || nameInput.trim() === savedDisplayName}
                  className={`mt-3 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition ${
                    isSavingName || nameInput.trim() === savedDisplayName ? "cursor-not-allowed bg-[#c9b3b9]" : "bg-[#7A9B76] hover:bg-[#5f8a5c]"
                  }`}
                >
                  {isSavingName ? "Saving..." : "Save Name"}
                </button>
              </div>

              <div className="rounded-2xl border border-[#efe1e5] bg-[#fcf8f9] p-4">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-[#8c6d76]">Bio / About</label>
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder="Tell others about yourself..."
                  rows={3}
                  className="mt-2 w-full resize-vertical rounded-xl border border-[#d7c2c7] bg-white px-3 py-2.5 text-sm text-[#270115] outline-none focus:border-[#a22237]"
                />
                <button
                  type="button"
                  onClick={() => void handleSaveBio()}
                  disabled={isSavingBio || bioInput.trim() === savedBio}
                  className={`mt-3 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition ${
                    isSavingBio || bioInput.trim() === savedBio ? "cursor-not-allowed bg-[#c9b3b9]" : "bg-[#7A9B76] hover:bg-[#5f8a5c]"
                  }`}
                >
                  {isSavingBio ? "Saving..." : "Save Bio"}
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[#efe1e5] bg-[#fcf8f9] p-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#8c6d76]">Email Address</div>
                <div className="mt-1 break-all text-sm font-semibold text-[#5C1E26]">{email || "Not available"}</div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
            {/* ── Account Security ── */}
            <section className="rounded-[28px] border border-[#eadadf] bg-white p-6 shadow-[0_12px_34px_rgba(39,1,21,0.08)] sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff1f4] text-[#a22237]">
                  <LockKeyhole size={22} />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-extrabold text-[#270115]">Account Security</h2>
                  <p className="mt-1 text-sm leading-6 text-[#6d5560]">
                    Use Auth0 to manage your password and keep your login secure.
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-[#efe1e5] bg-[#fcf8f9] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-[#5C1E26]">Password reset</div>
                      <div className="mt-1 text-sm leading-6 text-[#6d5560]">
                        Send a secure password reset email to <span className="font-semibold text-[#5C1E26]">{email || "your account email"}</span>.
                      </div>
                    </div>
                    <Mail className="mt-1 shrink-0 text-[#a22237]" size={18} />
                  </div>
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={isSendingPasswordReset}
                    className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition ${isSendingPasswordReset ? "cursor-not-allowed bg-[#d88c99]" : "bg-[#a22237] hover:bg-[#8f1d30]"}`}
                  >
                    <LockKeyhole size={16} />
                    {isSendingPasswordReset ? "Sending reset email..." : "Change Password"}
                  </button>
                </div>
              </div>
            </section>

            {/* ── Notifications ── */}
            <section className="rounded-[28px] border border-[#eadadf] bg-white p-6 shadow-[0_12px_34px_rgba(39,1,21,0.08)] sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef5ec] text-[#5d8159]">
                  <Bell size={22} />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-extrabold text-[#270115]">Notifications</h2>
                  <p className="mt-1 text-sm leading-6 text-[#6d5560]">
                    These preferences save immediately when you toggle them.
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <ToggleRow
                  title="Email Alerts"
                  description="Receive email notifications for important account activity."
                  checked={notificationPreferences.emailAlerts}
                  disabled={isLoadingPreferences}
                  isSaving={savingPreferenceKey === "emailAlerts"}
                  onToggle={() => void handleTogglePreference("emailAlerts")}
                />
                <ToggleRow
                  title="New Forum Replies"
                  description="Be notified when there is new activity on forum discussions."
                  checked={notificationPreferences.newForumReplies}
                  disabled={isLoadingPreferences}
                  isSaving={savingPreferenceKey === "newForumReplies"}
                  onToggle={() => void handleTogglePreference("newForumReplies")}
                />
              </div>
            </section>
          </div>

          {/* ── Preferences ── */}
          <section className="rounded-[28px] border border-[#eadadf] bg-white p-6 shadow-[0_12px_34px_rgba(39,1,21,0.08)] sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eee8f2] text-[#6b4f7a]">
                <Globe size={22} />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-extrabold text-[#270115]">Preferences</h2>
                <p className="mt-1 text-sm leading-6 text-[#6d5560]">
                  Customize your experience with timezone and appearance settings.
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#efe1e5] bg-[#fcf8f9] p-4">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-[#8c6d76]">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => void handleSaveTimezone(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#d7c2c7] bg-white px-3 py-2.5 text-sm text-[#270115] outline-none focus:border-[#a22237]"
                >
                  {Intl.supportedValuesOf("timeZone").map((tz) => (
                    <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div className="rounded-2xl border border-[#efe1e5] bg-[#fcf8f9] p-4">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-[#8c6d76]">Appearance</label>
                <div className="mt-2 flex items-center gap-3">
                  <Palette size={18} className="text-[#6b4f7a]" />
                  <span className="text-sm font-semibold text-[#5C1E26]">{theme === "light" ? "Light Mode" : "Dark Mode"}</span>
                  <button
                    type="button"
                    onClick={() => void handleToggleTheme()}
                    className="ml-auto rounded-xl border border-[#d7c2c7] bg-white px-3 py-1.5 text-xs font-bold text-[#5C1E26] transition hover:bg-[#f8f1f3]"
                  >
                    Switch to {theme === "light" ? "Dark" : "Light"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-[#8c6d76]">Theme preference is saved and applied across all pages.</p>
              </div>
              <div className="rounded-2xl border border-[#efe1e5] bg-[#fcf8f9] p-4">
                <label className="block text-xs font-bold uppercase tracking-[0.18em] text-[#8c6d76]">Language</label>
                <div className="mt-2 text-sm font-semibold text-[#5C1E26]">English (US)</div>
                <p className="mt-1 text-xs text-[#8c6d76]">Additional languages coming soon.</p>
              </div>
            </div>
          </section>

          {/* ── Danger Zone ── */}
          <section className="rounded-[28px] border border-[#f5d3d3] bg-white p-6 shadow-[0_12px_34px_rgba(39,1,21,0.08)] sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fef2f2] text-[#DC3545]">
                <Trash2 size={22} />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-extrabold text-[#270115]">Danger Zone</h2>
                <p className="mt-1 text-sm leading-6 text-[#6d5560]">
                  Permanent actions that cannot be undone. Please proceed with caution.
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-[#f5d3d3] bg-[#fef8f8] p-4">
              <div className="text-sm font-semibold text-[#5C1E26]">Delete Account</div>
              <div className="mt-1 text-sm leading-6 text-[#6d5560]">
                Permanently remove your account and all associated data. This action is irreversible.
              </div>
              <button
                type="button"
                onClick={() => alert("Please contact your administrator to delete your account.")}
                className="mt-3 rounded-xl border-2 border-[#DC3545] bg-transparent px-4 py-2 text-xs font-bold text-[#DC3545] transition hover:bg-[#DC3545] hover:text-white"
              >
                Request Account Deletion
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
