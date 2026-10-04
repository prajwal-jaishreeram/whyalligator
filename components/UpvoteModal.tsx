"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";

type UpvoteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  company: {
    id: string;
    slug: string;
    company_name: string;
    website_url: string;
    upvotes_count?: number;
  };
  hasUpvoted?: boolean;
  isOwnCompany?: boolean;
  onUpvoteSuccess: (newCount: number, hasUpvoted: boolean) => void;
  isLoggedIn: boolean;
};

export default function UpvoteModal({
  isOpen,
  onClose,
  company,
  hasUpvoted = false,
  isOwnCompany = false,
  onUpvoteSuccess,
  isLoggedIn,
}: UpvoteModalProps) {
  const [visited, setVisited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessToast(false);
      // Check if user already visited this company's website in this browser session
      const alreadyVisited = localStorage.getItem(`visited_${company.id}`) === "true";
      setVisited(alreadyVisited);
    }
  }, [isOpen, company.id]);

  if (!isOpen) return null;

  const handleVisitWebsite = () => {
    let url = company.website_url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    setVisited(true);
    localStorage.setItem(`visited_${company.id}`, "true");
  };

  const handleCastVote = async () => {
    if (!isLoggedIn) {
      setError("Please log in first to cast your upvote.");
      return;
    }
    if (isOwnCompany) {
      setError("You cannot upvote your own startup.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;

      if (!token) {
        throw new Error("Session expired. Please log in again.");
      }

      const res = await fetch(`/api/companies/${company.slug}/upvote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upvote.");
      }

      // If user removed their upvote, clear visited state so they must visit website again to re-vote
      if (!data.has_upvoted) {
        localStorage.removeItem(`visited_${company.id}`);
        setVisited(false);
      }

      onUpvoteSuccess(data.upvotes_count, data.has_upvoted);
      setSuccessToast(true);
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error casting upvote.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-card"
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "460px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.18)",
          overflow: "hidden",
          border: "1px solid #e2e2dc",
          position: "relative",
          animation: "modalFadeIn 0.2s ease-out",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "22px 24px 16px",
            borderBottom: "1px solid #f0f0eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h3
              style={{
                margin: "0 0 4px",
                fontSize: "20px",
                fontFamily: "var(--font-source-serif), Georgia, serif",
                fontWeight: 600,
                color: "#111",
              }}
            >
              How to upvote
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#666",
              }}
            >
              Explore the product first, then cast your vote.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "22px",
              lineHeight: 1,
              cursor: "pointer",
              color: "#888",
              padding: "4px",
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 24px" }}>
          {!isLoggedIn ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔒</div>
              <h4 style={{ margin: "0 0 8px", fontSize: "17px", color: "#111" }}>
                Login required to upvote
              </h4>
              <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#666", lineHeight: 1.5 }}>
                To keep votes fair and genuine, please sign in or create a free account to upvote{" "}
                <strong>{company.company_name}</strong>.
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <Link
                  href="/login"
                  className="yc-btn-secondary"
                  style={{ fontSize: "14px", padding: "8px 20px" }}
                >
                  Log in
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="yc-btn-primary"
                  style={{ fontSize: "14px", padding: "8px 20px" }}
                >
                  Sign up free
                </Link>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    marginBottom: "16px",
                  }}
                >
                  {error}
                </div>
              )}

              {isOwnCompany && (
                <div
                  style={{
                    backgroundColor: "#fffbeb",
                    border: "1px solid #fde68a",
                    color: "#92400e",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    marginBottom: "16px",
                    lineHeight: 1.5,
                  }}
                >
                  <strong>Founder Notice:</strong> You are listed as a founder/partner of <strong>{company.company_name}</strong>. Founders cannot upvote their own startup to ensure fair community rankings.
                </div>
              )}

              {successToast && (
                <div
                  style={{
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    color: "#15803d",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    marginBottom: "16px",
                    fontWeight: 500,
                  }}
                >
                  {hasUpvoted ? "✓ Upvote removed!" : "🎉 Upvote recorded! Thank you for supporting!"}
                </div>
              )}

              {/* Steps List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Step 1 */}
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: visited ? "#10b981" : "#111",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {visited ? "✓" : "1"}
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: "0 0 2px",
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#111",
                      }}
                    >
                      Visit the product
                    </h4>
                    <p style={{ margin: 0, fontSize: "13px", color: "#666", lineHeight: 1.45 }}>
                      Check out {company.company_name}&apos;s website to see what they&apos;ve built.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: visited ? "#111" : "#e5e5dc",
                      color: visited ? "#fff" : "#777",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    2
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: "0 0 2px",
                        fontSize: "15px",
                        fontWeight: 600,
                        color: visited ? "#111" : "#555",
                      }}
                    >
                      Come back here
                    </h4>
                    <p style={{ margin: 0, fontSize: "13px", color: "#666", lineHeight: 1.45 }}>
                      After exploring, return to this page. This dialog stays open.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: visited ? "#ff6600" : "#e5e5dc",
                      color: visited ? "#fff" : "#777",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    3
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: "0 0 2px",
                        fontSize: "15px",
                        fontWeight: 600,
                        color: visited ? "#111" : "#555",
                      }}
                    >
                      Cast your upvote
                    </h4>
                    <p style={{ margin: 0, fontSize: "13px", color: "#666", lineHeight: 1.45 }}>
                      Click the upvote button below to show your support.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Actions */}
        {isLoggedIn && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #f0f0eb",
              backgroundColor: "#fafaf8",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#666",
                fontSize: "14px",
                cursor: "pointer",
                padding: "8px 12px",
              }}
            >
              Close
            </button>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                type="button"
                onClick={handleVisitWebsite}
                className="yc-btn-secondary"
                style={{ fontSize: "14px", padding: "8px 16px" }}
              >
                Visit website ↗
              </button>

              <button
                type="button"
                onClick={handleCastVote}
                disabled={isOwnCompany || submitting || (!hasUpvoted && !visited)}
                className="yc-btn-primary"
                style={{
                  fontSize: "14px",
                  padding: "8px 20px",
                  backgroundColor: isOwnCompany
                    ? "#9ca3af"
                    : (hasUpvoted || visited)
                    ? "#ff6600"
                    : "#ccc",
                  borderColor: isOwnCompany
                    ? "#9ca3af"
                    : (hasUpvoted || visited)
                    ? "#ff6600"
                    : "#ccc",
                  color: "#fff",
                  cursor: isOwnCompany || (!hasUpvoted && !visited) ? "not-allowed" : "pointer",
                  opacity: isOwnCompany ? 0.7 : (!hasUpvoted && !visited) ? 0.6 : 1,
                }}
                title={
                  isOwnCompany
                    ? "Founders cannot upvote their own startup"
                    : !hasUpvoted && !visited
                    ? "Visit website first to unlock upvote"
                    : undefined
                }
              >
                {isOwnCompany
                  ? "Cannot upvote own startup"
                  : submitting
                  ? "Processing..."
                  : hasUpvoted
                  ? "Remove Vote"
                  : "▲ Upvote"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
