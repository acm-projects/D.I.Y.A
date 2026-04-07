import { useEffect, useRef, useState } from "react";
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

interface Improvement {
  section: string;
  suggestion: string;
}

type BackendImprovement = {
  section?: string;
  suggestion?: string;
  title?: string;
  description?: string;
};

interface GradeReport {
  id: string;
  assignmentName: string;
  rubricName: string;
  potentialGrade: string;
  letterGrade: string;
  improvements: Improvement[];
  timestamp: Date;
}

type BackendSelfCheck = {
  id: string;
  assignmentName: string;
  rubricName: string;
  potentialGrade: string;
  letterGrade: string;
  improvements: BackendImprovement[];
  createdAt?: { _seconds?: number; seconds?: number } | string;
};

type UploadedSelfCheckFile = {
  name: string;
  mimeType: string;
  base64Data: string;
};

const SELF_CHECK_API_BASE_URL = "/api/self-check";

function getTimestampMs(value?: BackendSelfCheck["createdAt"]): number {
  if (!value) return Date.now();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }

  const seconds = value._seconds ?? value.seconds;
  return typeof seconds === "number" ? seconds * 1000 : Date.now();
}

function toGradeReport(record: BackendSelfCheck): GradeReport {
  return {
    id: record.id,
    assignmentName: record.assignmentName,
    rubricName: record.rubricName,
    potentialGrade: record.potentialGrade,
    letterGrade: record.letterGrade,
    improvements: record.improvements.map((improvement, index) => ({
      section: improvement.section || improvement.title || `Improvement ${index + 1}`,
      suggestion: improvement.suggestion || improvement.description || "No suggestion provided.",
    })),
    timestamp: new Date(getTimestampMs(record.createdAt)),
  };
}

async function fileToUploadedPayload(file: File): Promise<UploadedSelfCheckFile> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return {
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    base64Data: btoa(binary),
  };
}

export function StudentSelfCheckPage() {
  const { user } = useAuth0();
  const rubricInputRef = useRef<HTMLInputElement>(null);
  const workInputRef = useRef<HTMLInputElement>(null);

  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const [workFile, setWorkFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentReport, setCurrentReport] = useState<GradeReport | null>(null);
  const [history, setHistory] = useState<GradeReport[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      if (!user?.sub) {
        if (isMounted) {
          setHistory([]);
          setIsLoadingHistory(false);
        }
        return;
      }

      setIsLoadingHistory(true);
      setError(null);

      try {
        const response = await fetch(`${SELF_CHECK_API_BASE_URL}/student/${user.sub}`);

        if (!response.ok) {
          throw new Error("Failed to load self-check history.");
        }

        const records = (await response.json()) as BackendSelfCheck[];

        if (isMounted) {
          setHistory(records.map(toGradeReport));
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load self-check history.");
          setHistory([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, [user?.sub]);

  const handleAnalyze = async () => {
    if (!rubricFile || !workFile || !user?.sub) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const [rubricPayload, workPayload] = await Promise.all([
        fileToUploadedPayload(rubricFile),
        fileToUploadedPayload(workFile),
      ]);

      const response = await fetch(`${SELF_CHECK_API_BASE_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: user.sub,
          assignmentName: workFile.name,
          rubricName: rubricFile.name,
          workFile: workPayload,
          rubricFile: rubricPayload,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze your work.");
      }

      const record = toGradeReport((await response.json()) as BackendSelfCheck);
      setCurrentReport(record);
      setHistory((prev) => [record, ...prev.filter((item) => item.id !== record.id)]);
      setRubricFile(null);
      setWorkFile(null);
      if (rubricInputRef.current) rubricInputRef.current.value = "";
      if (workInputRef.current) workInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze your work.");
    } finally {
      setIsAnalyzing(false);
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
        <StudentSidebar activeItem="selfcheck" />
      </aside>

      <main style={{ flex: 1, padding: "32px 36px 56px 24px", boxSizing: "border-box", overflowY: "auto" }}>
        <div style={{ maxWidth: 1400 }}>
          <div
            style={{
              color: palette.crimson,
              fontSize: 44,
              fontWeight: 850,
              letterSpacing: -1,
              lineHeight: 1.1,
            }}
          >
            Self-Check
          </div>

          <div
            style={{
              height: 1,
              backgroundColor: "rgba(39,1,21,0.12)",
              marginTop: 14,
              marginBottom: 24,
            }}
          />

          {error && (
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                padding: 18,
                border: "1px solid rgba(214,214,214,0.3)",
                boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                marginBottom: 20,
                color: palette.crimson,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          )}

          {/* upload section */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              padding: "24px 28px",
              border: "1px solid rgba(214,214,214,0.4)",
              boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
              marginBottom: 28,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 4 }}>
              Check Your Work
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(92,30,38,0.6)", marginBottom: 20 }}>
              Upload your assignment rubric and your work to get an AI-estimated grade report.
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
              {/* rubric upload */}
              <div style={{ flex: "1 1 240px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: palette.deepBurgundy, marginBottom: 8 }}>
                  Assignment Rubric
                </div>
                <input
                  ref={rubricInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg"
                  onChange={(e) => setRubricFile(e.target.files?.[0] ?? null)}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => rubricInputRef.current?.click()}
                  style={{
                    width: "100%",
                    padding: "28px 16px",
                    borderRadius: 12,
                    border: `2px dashed ${rubricFile ? palette.sage : "rgba(39,1,21,0.2)"}`,
                    backgroundColor: rubricFile ? "rgba(122,155,118,0.06)" : "rgba(39,1,21,0.03)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke={rubricFile ? palette.sage : palette.deepBurgundy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" stroke={rubricFile ? palette.sage : palette.deepBurgundy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: rubricFile ? palette.sage : palette.deepBurgundy }}>
                    {rubricFile ? rubricFile.name : "Click to upload rubric"}
                  </span>
                </button>
              </div>

              {/* work upload */}
              <div style={{ flex: "1 1 240px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: palette.deepBurgundy, marginBottom: 8 }}>
                  Your Work
                </div>
                <input
                  ref={workInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.py,.java,.js,.ts,.c,.cpp,.zip,.png,.jpg"
                  onChange={(e) => setWorkFile(e.target.files?.[0] ?? null)}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => workInputRef.current?.click()}
                  style={{
                    width: "100%",
                    padding: "28px 16px",
                    borderRadius: 12,
                    border: `2px dashed ${workFile ? palette.sage : "rgba(39,1,21,0.2)"}`,
                    backgroundColor: workFile ? "rgba(122,155,118,0.06)" : "rgba(39,1,21,0.03)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke={workFile ? palette.sage : palette.deepBurgundy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" stroke={workFile ? palette.sage : palette.deepBurgundy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: workFile ? palette.sage : palette.deepBurgundy }}>
                    {workFile ? workFile.name : "Click to upload your work"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!rubricFile || !workFile || isAnalyzing}
              style={{
                padding: "12px 28px",
                borderRadius: 10,
                border: "none",
                backgroundColor: rubricFile && workFile && !isAnalyzing ? palette.crimson : "rgba(162,34,55,0.3)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: rubricFile && workFile && !isAnalyzing ? "pointer" : "not-allowed",
              }}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze My Work"}
            </button>
          </div>

          {/* loading state */}
          {isAnalyzing && (
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                padding: "32px 28px",
                border: "1px solid rgba(214,214,214,0.4)",
                boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                marginBottom: 28,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: palette.deepBurgundy, marginBottom: 8 }}>
                Analyzing your work...
              </div>
              <div style={{ fontSize: 13, color: "rgba(92,30,38,0.5)" }}>
                Comparing your submission against the rubric criteria
              </div>
              <div
                style={{
                  marginTop: 16,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "rgba(39,1,21,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "60%",
                    height: "100%",
                    borderRadius: 2,
                    backgroundColor: palette.crimson,
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
          )}

          {/* current grade report */}
          {currentReport && !isAnalyzing && (
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                padding: "24px 28px",
                border: `2px solid ${palette.sage}`,
                boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                marginBottom: 28,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: palette.deepBurgundy }}>
                  Grade Report
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(92,30,38,0.5)",
                  }}
                >
                  {currentReport.timestamp.toLocaleDateString()} at{" "}
                  {currentReport.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
                <div
                  style={{
                    flex: "0 0 auto",
                    padding: "16px 24px",
                    borderRadius: 12,
                    backgroundColor: "rgba(122,155,118,0.1)",
                    border: `1px solid ${palette.sage}`,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: palette.sage, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                    Potential Grade
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: palette.deepBurgundy }}>
                    {currentReport.letterGrade}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: palette.deepBurgundy }}>
                    {currentReport.potentialGrade}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 8,
                        backgroundColor: "rgba(39,1,21,0.05)",
                        fontSize: 12,
                        fontWeight: 600,
                        color: palette.deepBurgundy,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={palette.deepBurgundy} strokeWidth="2" strokeLinejoin="round" /></svg>
                      {currentReport.assignmentName}
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 8,
                        backgroundColor: "rgba(122,155,118,0.08)",
                        fontSize: 12,
                        fontWeight: 600,
                        color: palette.sage,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke={palette.sage} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={palette.sage} strokeWidth="2" strokeLinejoin="round" /></svg>
                      {currentReport.rubricName}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 15, fontWeight: 800, color: palette.crimson, marginBottom: 12 }}>
                Areas for Improvement
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {currentReport.improvements.map((imp, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 10,
                      backgroundColor: "rgba(162,34,55,0.04)",
                      border: "1px solid rgba(162,34,55,0.1)",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 4 }}>
                      {imp.section}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(17,17,17,0.7)", lineHeight: 1.5 }}>
                      {imp.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* history section */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 14 }}>
              Past Checks
            </div>

            {isLoadingHistory && (
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 14,
                  padding: 22,
                  border: "1px solid rgba(214,214,214,0.3)",
                  boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
                  color: "rgba(92,30,38,0.5)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Loading your previous checks...
              </div>
            )}

            {!isLoadingHistory && history.length === 0 && (
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 14,
                  padding: 22,
                  border: "1px solid rgba(214,214,214,0.3)",
                  boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
                  color: "rgba(92,30,38,0.5)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                No past checks yet. Upload your first assignment above to get started.
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {history.map((report) => {
                const isExpanded = expandedHistoryId === report.id;
                return (
                  <div
                    key={report.id}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 14,
                      border: isExpanded ? `1px solid ${palette.crimson}` : "1px solid rgba(214,214,214,0.4)",
                      boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedHistoryId(isExpanded ? null : report.id)}
                      style={{
                        width: "100%",
                        padding: "16px 20px",
                        border: "none",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 10,
                            backgroundColor: "rgba(122,155,118,0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 16,
                            fontWeight: 900,
                            color: palette.deepBurgundy,
                          }}
                        >
                          {report.letterGrade}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: palette.deepBurgundy }}>
                            {report.assignmentName}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(92,30,38,0.5)", marginTop: 2 }}>
                            {report.timestamp.toLocaleDateString()} · {report.potentialGrade}
                          </div>
                        </div>
                      </div>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms ease" }}
                      >
                        <path d="M6 9l6 6 6-6" stroke={palette.crimson} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div style={{ padding: "0 20px 18px" }}>
                        <div style={{ height: 1, backgroundColor: "rgba(39,1,21,0.08)", marginBottom: 14 }} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: palette.crimson, marginBottom: 10 }}>
                          Areas for Improvement
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {report.improvements.map((imp, i) => (
                            <div
                              key={i}
                              style={{
                                padding: "12px 14px",
                                borderRadius: 8,
                                backgroundColor: "rgba(162,34,55,0.04)",
                                border: "1px solid rgba(162,34,55,0.08)",
                              }}
                            >
                              <div style={{ fontSize: 12, fontWeight: 800, color: palette.deepBurgundy, marginBottom: 3 }}>
                                {imp.section}
                              </div>
                              <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(17,17,17,0.65)", lineHeight: 1.5 }}>
                                {imp.suggestion}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
