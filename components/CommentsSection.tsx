"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";
import type { Comment } from "@/lib/types";

type CommentsSectionProps = {
  companySlug: string;
  companyName: string;
  isLoggedIn: boolean;
  currentUserEmail?: string | null;
};

export default function CommentsSection({
  companySlug,
  companyName,
  isLoggedIn,
  currentUserEmail,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/companies/${companySlug}/comments`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.comments)) {
        setComments(data.comments);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [companySlug]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error("Please log in to comment.");

      const res = await fetch(`/api/companies/${companySlug}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post comment.");

      setNewComment("");
      await fetchComments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostReply = async (parentId: string, replyToUsername?: string) => {
    if (!replyContent.trim()) return;
    setSubmittingReply(true);

    try {
      const supabase = createBrowserClient();
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error("Please log in to reply.");

      const res = await fetch(`/api/companies/${companySlug}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parent_id: parentId,
          reply_to_username: replyToUsername,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post reply.");

      setReplyContent("");
      setReplyingToId(null);
      await fetchComments();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to post reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="comments-container" style={{ marginTop: "32px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          borderBottom: "1px solid #e5e5dc",
          paddingBottom: "12px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "20px",
            fontFamily: "var(--font-source-serif), Georgia, serif",
            fontWeight: 600,
            color: "#111",
          }}
        >
          Comments & Feedback ({comments.length})
        </h3>
        <span style={{ fontSize: "13px", color: "var(--muted)" }}>
          Ask questions or leave comments for the founders
        </span>
      </div>

      {/* Post comment form */}
      {isLoggedIn ? (
        <form onSubmit={handlePostComment} style={{ marginBottom: "28px" }}>
          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                marginBottom: "12px",
              }}
            >
              {error}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Share feedback, congratulations, or questions for ${companyName}...`}
              rows={3}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "8px",
                border: "1px solid #c8c8c2",
                fontSize: "14px",
                fontFamily: "inherit",
                resize: "vertical",
                backgroundColor: "#ffffff",
                boxSizing: "border-box",
                outline: "none",
              }}
              required
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="yc-btn-primary"
                style={{
                  padding: "8px 20px",
                  fontSize: "14px",
                  opacity: submitting || !newComment.trim() ? 0.6 : 1,
                  cursor: submitting || !newComment.trim() ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div
          style={{
            backgroundColor: "#fbfbfa",
            border: "1px solid #e5e5dc",
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h4 style={{ margin: "0 0 4px", fontSize: "15px", color: "#111" }}>
              Join the conversation
            </h4>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
              Log in to leave comments, ask questions, and chat with the founders.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link href="/login" className="yc-btn-secondary" style={{ padding: "6px 14px", fontSize: "13px" }}>
              Log in
            </Link>
            <Link href="/login?mode=signup" className="yc-btn-primary" style={{ padding: "6px 16px", fontSize: "13px" }}>
              Sign up
            </Link>
          </div>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading comments...</p>
      ) : comments.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "36px 20px",
            backgroundColor: "#fafaf9",
            borderRadius: "8px",
            border: "1px dashed #dcdcd6",
          }}
        >
          <p style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 500, color: "#333" }}>
            No comments yet
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
            Be the first to share your thoughts or congratulate the team!
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e5dc",
                borderRadius: "10px",
                padding: "16px 18px",
              }}
            >
              {/* Comment Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "14px",
                      color: "#111",
                    }}
                  >
                    {comment.user_name}
                  </span>
                  {comment.user_username && (
                    <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>
                      @{comment.user_username}
                    </span>
                  )}
                  {comment.is_founder && (
                    <span
                      style={{
                        backgroundColor: "#ff6600",
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: "999px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Founder
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                  {formatTimestamp(comment.created_at)}
                </span>
              </div>

              {/* Comment Body */}
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  color: "#222",
                  whiteSpace: "pre-wrap",
                }}
              >
                {comment.content}
              </p>

              {/* Reply Button */}
              {isLoggedIn && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (replyingToId === comment.id) {
                        setReplyingToId(null);
                        setReplyContent("");
                      } else {
                        setReplyingToId(comment.id);
                        setReplyContent("");
                      }
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#666",
                      fontSize: "12px",
                      cursor: "pointer",
                      padding: 0,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    💬 {replyingToId === comment.id ? "Cancel reply" : "Reply"}
                  </button>
                </div>
              )}

              {/* Reply Input Form */}
              {replyingToId === comment.id && (
                <div
                  style={{
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px dashed #e2e2dc",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${comment.user_username ? `@${comment.user_username}` : comment.user_name}...`}
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #c8c8c2",
                      fontSize: "13px",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setReplyingToId(null)}
                      className="yc-btn-secondary"
                      style={{ padding: "4px 12px", fontSize: "12px" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePostReply(comment.id, comment.user_username || comment.user_name)}
                      disabled={submittingReply || !replyContent.trim()}
                      className="yc-btn-primary"
                      style={{ padding: "4px 14px", fontSize: "12px" }}
                    >
                      {submittingReply ? "Posting..." : "Reply"}
                    </button>
                  </div>
                </div>
              )}

              {/* Nested Replies */}
              {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                <div
                  style={{
                    marginTop: "14px",
                    marginLeft: "18px",
                    paddingLeft: "14px",
                    borderLeft: "2px solid #e5e5dc",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {comment.replies.map((reply) => (
                    <div
                      key={reply.id}
                      style={{
                        backgroundColor: "#fbfbfa",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        border: "1px solid #ecece6",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                          flexWrap: "wrap",
                          gap: "4px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, fontSize: "13px", color: "#111" }}>
                            {reply.user_name}
                          </span>
                          {reply.user_username && (
                            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                              @{reply.user_username}
                            </span>
                          )}
                          {reply.reply_to_username && (
                            <span style={{ fontSize: "11px", color: "var(--orange)", fontWeight: 500 }}>
                              ↳ replying to @{reply.reply_to_username}
                            </span>
                          )}
                          {reply.is_founder && (
                            <span
                              style={{
                                backgroundColor: "#ff6600",
                                color: "#fff",
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "1px 6px",
                                borderRadius: "999px",
                                textTransform: "uppercase",
                              }}
                            >
                              Founder
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                          {formatTimestamp(reply.created_at)}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: "0 0 6px",
                          fontSize: "13px",
                          lineHeight: 1.45,
                          color: "#333",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {reply.content}
                      </p>

                      {/* Reply button on reply */}
                      {isLoggedIn && (
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              if (replyingToId === reply.id) {
                                setReplyingToId(null);
                                setReplyContent("");
                              } else {
                                setReplyingToId(reply.id);
                                setReplyContent("");
                              }
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#666",
                              fontSize: "11px",
                              cursor: "pointer",
                              padding: 0,
                              fontWeight: 500,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            💬 {replyingToId === reply.id ? "Cancel" : "Reply"}
                          </button>
                        </div>
                      )}

                      {/* Inline Reply Form for Reply-to-Reply */}
                      {replyingToId === reply.id && (
                        <div
                          style={{
                            marginTop: "8px",
                            paddingTop: "8px",
                            borderTop: "1px dashed #e2e2dc",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                          }}
                        >
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={`Reply to @${reply.user_username || reply.user_name}...`}
                            rows={2}
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              borderRadius: "6px",
                              border: "1px solid #c8c8c2",
                              fontSize: "12px",
                              boxSizing: "border-box",
                              fontFamily: "inherit",
                            }}
                          />
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => setReplyingToId(null)}
                              className="yc-btn-secondary"
                              style={{ padding: "3px 10px", fontSize: "11px" }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePostReply(comment.id, reply.user_username || reply.user_name)}
                              disabled={submittingReply || !replyContent.trim()}
                              className="yc-btn-primary"
                              style={{ padding: "3px 12px", fontSize: "11px" }}
                            >
                              {submittingReply ? "Posting..." : "Reply"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
