"use client";

import { useState } from "react";
import { requestMagicLink } from "@/lib/api";

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestMagicLink({
        email,
        redirect_to: `${window.location.origin}/auth/callback`,
      });
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send link.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="response-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="response-modal" style={{ maxWidth: "440px" }}>
        {!sent ? (
          <div className="response-modal-body" style={{ padding: "32px" }}>
            <p className="eyebrow mb-4">Sign in</p>
            <h2 className="section-heading mb-2">Access your deliberations</h2>
            <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)", marginBottom: "24px", lineHeight: "1.6" }}>
              Enter your email and we&apos;ll send a sign-in link. No password required.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label htmlFor="llm-email" className="input-label">Email address</label>
                <input
                  id="llm-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="input"
                />
              </div>

              {error && (
                <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-error)" }}>{error}</p>
              )}

              <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                  {loading ? "Sending…" : "Send link"}
                </button>
                <button type="button" onClick={onClose} className="btn btn-neutral">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="response-modal-body" style={{ padding: "32px", textAlign: "center" }}>
            <p className="eyebrow mb-4">Link sent</p>
            <h2 className="section-heading mb-2">Check your email</h2>
            <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-secondary)", marginBottom: "24px", lineHeight: "1.6" }}>
              A sign-in link has been sent to <strong>{email}</strong>. It expires in 60 minutes.
            </p>
            <button onClick={onClose} className="btn btn-neutral" style={{ width: "100%" }}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
