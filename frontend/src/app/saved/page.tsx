"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { listDeliberations, deleteDeliberation, type DeliberationSummary } from "@/lib/api";

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
