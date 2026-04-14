import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Bell, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { StudentSidebar } from "./StudentSidebar";
import { db } from "./firebase";

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

  return {
    emailAlerts,
    newForumReplies,
  };
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
          checked
            ? "border-[#7A9B76] bg-[#7A9B76]"
            : "border-[#d7c2c7] bg-[#f4eaed]"
        } ${disabled || isSaving ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-7" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}

export function StudentProfilePage() {
  const { user } = useAuth0();
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(defaultNotificationPreferences);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [savingPreferenceKey, setSavingPreferenceKey] = useState<keyof NotificationPreferences | null>(null);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const displayName = user?.name?.trim() || user?.nickname?.trim() || "D.I.Y.A Student";
  const email = user?.email?.trim() || "";
  const avatarUrl = user?.picture;
  const isVerified = Boolean(user?.email_verified);
  const userDocId = user?.sub?.trim() || "";
  const lastUpdated = user?.updated_at
    ? new Date(user.updated_at).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      if (!userDocId) {
        if (isMounted) {
          setNotificationPreferences(defaultNotificationPreferences);
          setIsLoadingPreferences(false);
        }
        return;
      }

      setIsLoadingPreferences(true);

      try {
        const userRef = doc(db, "users", userDocId);
        const snapshot = await getDoc(userRef);

        if (!snapshot.exists()) {
          await setDoc(
            userRef,
            {
              id: userDocId,
              authId: userDocId,
              email: email || `${userDocId}@auth.local`,
              name: displayName,
              emailAlerts: defaultNotificationPreferences.emailAlerts,
              newForumReplies: defaultNotificationPreferences.newForumReplies,
              notificationPreferences: defaultNotificationPreferences,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );

          if (isMounted) {
            setNotificationPreferences(defaultNotificationPreferences);
          }
          return;
        }

        const loadedPreferences = readNotificationPreferences(snapshot.data() as Record<string, unknown> | undefined);

        if (isMounted) {
          setNotificationPreferences(loadedPreferences);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to load notification preferences.", error);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPreferences(false);
        }
      }
    };

    void loadPreferences();

    return () => {
      isMounted = false;
    };
  }, [displayName, email, userDocId]);

  const handlePasswordReset = async () => {
    if (!email) {
      console.error("Password reset requires an Auth0 user email.");
      return;
    }

    setIsSendingPasswordReset(true);

    try {
      const response = await fetch(`https://${auth0Domain}/dbconnections/change_password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: auth0ClientId,
          email,
          connection: auth0Connection,
        }),
      });

      const message = await response.text();

      if (!response.ok) {
        throw new Error(message || "Auth0 could not send a password reset email.");
      }

      setSuccessMessage(`Password reset email sent to ${email}. Check your inbox for the secure link.`);
    } catch (error) {
      console.error("Failed to send password reset email.", error);
    } finally {
      setIsSendingPasswordReset(false);
    }
  };

  const handleTogglePreference = async (key: keyof NotificationPreferences) => {
    if (!userDocId) {
      console.error("Notification preferences require a signed-in user.");
      return;
    }

    const previousPreferences = notificationPreferences;
    const nextPreferences = {
      ...notificationPreferences,
      [key]: !notificationPreferences[key],
    };

    setNotificationPreferences(nextPreferences);
    setSavingPreferenceKey(key);

    try {
      await updateDoc(doc(db, "users", userDocId), {
        emailAlerts: nextPreferences.emailAlerts,
        newForumReplies: nextPreferences.newForumReplies,
        notificationPreferences: nextPreferences,
        updatedAt: serverTimestamp(),
      });

      setSuccessMessage(`${key === "emailAlerts" ? "Email alerts" : "New forum reply notifications"} updated successfully.`);
    } catch (error) {
      console.error("Failed to save notification preferences.", error);
      setNotificationPreferences(previousPreferences);
    } finally {
      setSavingPreferenceKey(null);
    }
  };

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
          width: 220,
          background: "linear-gradient(160deg, #4a1850 0%, #2d0f38 50%, #1c0a24 100%)",
          padding: "0 10px 16px",
          boxSizing: "border-box",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "4px 0 32px rgba(0,0,0,0.25)",
        }}
      >
        <StudentSidebar activeItem="profile" />
      </aside>

      <main className="flex-1 overflow-y-auto px-6 py-8 text-left lg:px-9 lg:py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="rounded-[28px] border border-[#eadadf] bg-white px-6 py-6 shadow-[0_14px_40px_rgba(39,1,21,0.08)] sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center gap-4 sm:gap-5">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-20 w-20 rounded-full border-4 border-[#f2e6e9] object-cover shadow-md sm:h-24 sm:w-24"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#a22237_0%,#5C1E26_100%)] text-3xl font-extrabold text-white shadow-md sm:h-24 sm:w-24">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold uppercase tracking-[0.28em] text-[#a22237]">Student settings</div>
                  <h1 className="mt-2 text-3xl font-black tracking-tight text-[#270115] sm:text-4xl">Manage your account</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d5560] sm:text-base">
                    Update your security preferences, review your account details, and control how D.I.Y.A notifies you about important activity.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${isVerified ? "bg-[#edf4eb] text-[#5f825b]" : "bg-[#fdf0f2] text-[#a22237]"}`}>
                      <span className={`h-2 w-2 rounded-full ${isVerified ? "bg-[#7A9B76]" : "bg-[#a22237]"}`} />
                      {isVerified ? "Email verified" : "Email verification pending"}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#f8f1f3] px-3 py-1.5 text-xs font-semibold text-[#5C1E26]">
                      <ShieldCheck size={14} />
                      Last synced {lastUpdated}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid min-w-[240px] gap-3 rounded-3xl border border-[#efe1e5] bg-[#fcf8f9] p-4 shadow-sm">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#8c6d76]">Account</div>
                  <div className="mt-2 text-lg font-bold text-[#5C1E26]">{displayName}</div>
                  <div className="mt-1 break-all text-sm text-[#6d5560]">{email || "No email available"}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white px-3 py-3 text-left shadow-sm">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8c6d76]">Email alerts</div>
                    <div className="mt-2 text-lg font-black text-[#270115]">{notificationPreferences.emailAlerts ? "On" : "Off"}</div>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3 text-left shadow-sm">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8c6d76]">Forum replies</div>
                    <div className="mt-2 text-lg font-black text-[#270115]">{notificationPreferences.newForumReplies ? "On" : "Off"}</div>
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

          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
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
                        Send a secure Auth0 password reset email to <span className="font-semibold text-[#5C1E26]">{email || "your account email"}</span>.
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

            <section className="rounded-[28px] border border-[#eadadf] bg-white p-6 shadow-[0_12px_34px_rgba(39,1,21,0.08)] sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef5ec] text-[#5d8159]">
                  <Bell size={22} />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-extrabold text-[#270115]">Notifications</h2>
                  <p className="mt-1 text-sm leading-6 text-[#6d5560]">
                    These preferences load directly from your Firestore user document and save immediately when you toggle them.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <ToggleRow
                  title="Email Alerts"
                  description="Receive email notifications for important account activity and appointment-related updates."
                  checked={notificationPreferences.emailAlerts}
                  disabled={isLoadingPreferences}
                  isSaving={savingPreferenceKey === "emailAlerts"}
                  onToggle={() => void handleTogglePreference("emailAlerts")}
                />

                <ToggleRow
                  title="New Forum Replies"
                  description="Be notified when there is new activity or a reply on discussions that matter to your coursework."
                  checked={notificationPreferences.newForumReplies}
                  disabled={isLoadingPreferences}
                  isSaving={savingPreferenceKey === "newForumReplies"}
                  onToggle={() => void handleTogglePreference("newForumReplies")}
                />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
