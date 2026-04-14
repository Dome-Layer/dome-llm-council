"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { listDeliberations, deleteDeliberation, type DeliberationSummary } from "@/lib/api";
import type { MemberResponsePayload } from "@/types/sse";
import ConfidenceBar from "@/app/components/ConfidenceBar";

const MEMBER_DISPLAY: Record<string, { displayName: string; defaultRole: string }> = {
  claude: { displayName: "Claude",   defaultRole: "Strategic Advisor" },
  gemini: { displayName: "Gemini",   defaultRole: "Research Analyst"  },
  openai: { displayName: "Chat-GPT", defaultRole: "Critical Advisor"  },
};
const MEMBER_ORDER = ["claude", "gemini", "openai"];

function MemberResponsesSection({ responses }: { responses: MemberResponsePayload[] }) {
  const [activeRounds, setActiveRounds] = useState<Record<string, 1 | 2>>({});

  const byMember: Record<string, { r1: MemberResponsePayload | null; r2: MemberResponsePayload | null; role: string }> = {};
  for (const r of responses) {
    if (!byMember[r.member_id]) byMember[r.member_id] = { r1: null, r2: null, role: r.role };
    if (r.round === 1) byMember[r.member_id].r1 = r;
    if (r.round === 2) byMember[r.member_id].r2 = r;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {MEMBER_ORDER.filter(id => byMember[id]).map(id => {
        const { r1, r2, role } = byMember[id];
        const hasBoth = r1 !== null && r2 !== null;
        const activeRound: 1 | 2 = activeRounds[id] ?? (r2 ? 2 : 1);
        const current = activeRound === 2 ? r2 : r1;
        const display = MEMBER_DISPLAY[id] ?? { displayName: id, defaultRole: role };

        return (
          <div
            key={id}
            style={{
              background: "var(--color-bg-muted)",
              border: "0.5px solid var(--color-border-default)",
              borderRadius: "var(--radius-md)",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {/* Member header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <div>
                <p style={{ fontSize: "var(--text-label)", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
                  {display.displayName}
                </p>
                <p className="eyebrow" style={{ marginTop: 2 }}>{role}</p>
              </div>
              {hasBoth && (
                <div style={{ display: "flex", gap: "4px" }}>
                  {([1, 2] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setActiveRounds(prev => ({ ...prev, [id]: r }))}
                      className={activeRound === r ? "badge badge-accent" : "badge badge-neutral"}
                      style={{ cursor: "pointer", border: "none", fontFamily: "inherit", background: "none" }}
                    >
                      R{r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Response text */}
            {current && (
              <>
                <p style={{
                  fontSize: "var(--text-body-sm)",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.65,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}>
                  {current.response}
                </p>
                <div>
                  <p style={{
                    fontSize: "var(--text-caption)",
                    color: "var(--color-text-tertiary)",
                    fontWeight: 500,
                    margin: "0 0 5px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}>
                    Confidence
                  </p>
                  <ConfidenceBar value={current.confidence} />
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const level = pct >= 75 ? "high" : pct >= 50 ? "medium" : "low";
  const colorMap = {
    high:   { background: "var(--color-success-subtle)", color: "var(--color-success)",  border: "var(--color-success-border)" },
    medium: { background: "var(--color-warning-subtle)", color: "var(--color-warning)",  border: "var(--color-warning-border)" },
    low:    { background: "var(--color-error-subtle)",   color: "var(--color-error)",    border: "var(--color-error-border)" },
  };
  const s = colorMap[level];
  return (
    <span className="badge" style={{ background: s.background, color: s.color, borderColor: s.border }}>
      {pct}% consensus
    </span>
  );
}

function DeliberationRow({
  item,
  onDelete,
}: {
  item: DeliberationSummary;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const closeModal = useCallback(() => setModalOpen(false), []);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [modalOpen, closeModal]);

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteDeliberation(item.id);
      onDelete(item.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const savedAt = new Date(item.saved_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <>
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px",
        borderBottom: "0.5px solid var(--color-border-subtle)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {item.label && (
              <p style={{ fontSize: "var(--text-caption)", color: "var(--color-text-tertiary)", marginBottom: "2px" }}>
                {item.label}
              </p>
            )}
            <p style={{
              fontSize: "var(--text-body-sm)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              marginBottom: "4px",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}>
              {item.question}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <ConfidenceBadge value={item.consensus_confidence} />
              <span style={{ fontSize: "var(--text-caption)", color: "var(--color-text-tertiary)" }}>
                {savedAt}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <button
              onClick={() => setModalOpen(true)}
              className="btn btn-neutral"
              style={{ padding: "6px 12px", fontSize: "var(--text-caption)" }}
            >
              View
            </button>

            {confirmDelete ? (
              <>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn btn-primary"
                  style={{ padding: "6px 12px", fontSize: "var(--text-caption)" }}
                >
                  {deleting ? "Deleting…" : "Confirm"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="btn btn-neutral"
                  style={{ padding: "6px 12px", fontSize: "var(--text-caption)" }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleDelete}
                className="btn btn-neutral"
                style={{ padding: "6px 12px", fontSize: "var(--text-caption)" }}
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {item.verdict_summary && (
          <p className="prose-compact" style={{
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>
            {item.verdict_summary}
          </p>
        )}
      </div>

      {/* ── Detail modal ─────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="response-modal-backdrop" onClick={closeModal}>
          <div className="response-modal" onClick={(e) => e.stopPropagation()}>

            {/* Modal header */}
            <div className="response-modal-header">
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="eyebrow" style={{ marginBottom: 4 }}>Panel verdict</p>
                <p style={{
                  fontSize: "var(--text-body-sm)",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  margin: 0,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}>
                  {item.question}
                </p>
              </div>
              <button
                onClick={closeModal}
                aria-label="Close"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-md)",
                  border: "0.5px solid var(--color-border-default)",
                  background: "transparent",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  fontSize: 20,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            {/* Modal body */}
            <div className="prose response-modal-body" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

              {/* Verdict text */}
              <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
                {item.verdict_summary}
              </p>

              {/* Recommendation */}
              {item.full_payload?.recommendation && (
                <div>
                  <p style={{ fontSize: "var(--text-label)", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 6px" }}>
                    Recommendation
                  </p>
                  <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)", lineHeight: 1.65, margin: 0 }}>
                    {item.full_payload.recommendation}
                  </p>
                </div>
              )}

              {/* Dissenting views */}
              {(item.full_payload?.dissenting_views?.length ?? 0) > 0 && (
                <div>
                  <p style={{ fontSize: "var(--text-label)", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
                    Dissenting views
                  </p>
                  <ul style={{ margin: 0, paddingLeft: "var(--space-4)", listStyleType: "disc", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                    {item.full_payload!.dissenting_views.map((view, i) => (
                      <li key={i} style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                        {view}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Member responses */}
              {(item.full_payload?.member_responses?.length ?? 0) > 0 && (
                <div>
                  <hr style={{ border: "none", borderTop: "0.5px solid var(--color-border-subtle)", margin: "0 0 20px" }} />
                  <p className="eyebrow" style={{ marginBottom: "16px" }}>Panel members</p>
                  <MemberResponsesSection responses={item.full_payload!.member_responses} />
                </div>
              )}
            </div>

            {/* Modal footer — confidence + date */}
            <div className="response-modal-footer">
              <p style={{
                fontSize: "var(--text-caption)",
                color: "var(--color-text-tertiary)",
                fontWeight: 500,
                margin: "0 0 6px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}>
                Consensus confidence
              </p>
              <ConfidenceBar value={item.consensus_confidence} />
              <p style={{ fontSize: "var(--text-caption)", color: "var(--color-text-tertiary)", marginTop: "10px", marginBottom: 0 }}>
                Saved {savedAt}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function SavedPage() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<DeliberationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    listDeliberations()
      .then((res) => {
        setItems(res.deliberations);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load saved deliberations.");
        setLoading(false);
      });
  }, [isAuthenticated]);

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: "32px" }}>
        <p className="eyebrow" style={{ marginBottom: "8px" }}>Library</p>
        <h1 style={{
          fontSize: "var(--text-h2)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          margin: 0,
        }}>
          Saved deliberations
        </h1>
      </div>

      {!isAuthenticated && (
        <div style={{
          background: "var(--color-bg-muted)",
          border: "0.5px solid var(--color-border-default)",
          borderRadius: "var(--radius-lg)",
          padding: "32px",
          textAlign: "center",
        }}>
          <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
            Sign in to view your saved deliberations.
          </p>
          <Link href="/" style={{ color: "var(--color-accent)", fontSize: "var(--text-body-sm)", textDecoration: "none" }}>
            ← Back to Council
          </Link>
        </div>
      )}

      {isAuthenticated && loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "48px 0" }}>
          <span className="spinner" />
          <span className="eyebrow">Loading</span>
        </div>
      )}

      {isAuthenticated && error && (
        <div style={{
          background: "var(--color-error-subtle)",
          border: "0.5px solid var(--color-error-border)",
          borderRadius: "var(--radius-md)",
          padding: "16px",
        }}>
          <p className="eyebrow" style={{ color: "var(--color-error)", marginBottom: "4px" }}>Error</p>
          <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)" }}>{error}</p>
        </div>
      )}

      {isAuthenticated && !loading && !error && items.length === 0 && (
        <div style={{
          background: "var(--color-bg-muted)",
          border: "0.5px solid var(--color-border-default)",
          borderRadius: "var(--radius-lg)",
          padding: "48px 32px",
          textAlign: "center",
        }}>
          <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
            No saved deliberations yet. Complete a deliberation and save it to see it here.
          </p>
          <Link href="/" style={{ color: "var(--color-accent)", fontSize: "var(--text-body-sm)", textDecoration: "none" }}>
            ← Back to Council
          </Link>
        </div>
      )}

      {isAuthenticated && !loading && !error && items.length > 0 && (
        <div style={{
          background: "var(--color-bg-base)",
          border: "0.5px solid var(--color-border-default)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}>
          {items.map((item) => (
            <DeliberationRow key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
