"use client";

import React from "react";
import type { SocialLink } from "@/lib/types";

export const SOCIAL_PLATFORMS = [
  { value: "github", label: "GitHub", placeholder: "https://github.com/organization" },
  { value: "crunchbase", label: "Crunchbase", placeholder: "https://crunchbase.com/organization/..." },
  { value: "instagram", label: "Instagram", placeholder: "https://instagram.com/handle" },
  { value: "facebook", label: "Facebook", placeholder: "https://facebook.com/page" },
  { value: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel" },
  { value: "discord", label: "Discord", placeholder: "https://discord.gg/invite" },
  { value: "substack", label: "Substack / Blog", placeholder: "https://publication.substack.com" },
  { value: "custom", label: "Custom Link", placeholder: "https://..." },
] as const;

interface SocialLinksEditorProps {
  links: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}

export default function SocialLinksEditor({ links, onChange }: SocialLinksEditorProps) {
  const addLink = () => {
    onChange([
      ...links,
      { platform: "github", url: "", label: "" },
    ]);
  };

  const updateLink = (index: number, patch: Partial<SocialLink>) => {
    const next = links.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
    onChange(next);
  };

  const removeLink = (index: number) => {
    onChange(links.filter((_, idx) => idx !== index));
  };

  return (
    <div style={{ marginTop: "12px", marginBottom: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground, #1e293b)" }}>
          Additional Links & Socials (Optional)
        </span>
        {links.length < 8 && (
          <button
            type="button"
            onClick={addLink}
            style={{
              background: "none",
              border: "1px dashed #d1d5db",
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: "12px",
              fontWeight: 500,
              color: "#ff6600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            + Add Link / Social
          </button>
        )}
      </div>

      {links.length === 0 ? (
        <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0" }}>
          Add links like GitHub, Crunchbase, Instagram, YouTube, Discord, Substack, etc. to display on your profile.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {links.map((link, idx) => {
            const currentPlatform = SOCIAL_PLATFORMS.find((p) => p.value === link.platform) || SOCIAL_PLATFORMS[0];
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  padding: "8px",
                  borderRadius: "6px",
                  flexWrap: "wrap",
                }}
              >
                <select
                  value={link.platform}
                  onChange={(e) => updateLink(idx, { platform: e.target.value })}
                  style={{
                    minWidth: "125px",
                    height: "36px",
                    padding: "0 8px",
                    fontSize: "13px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "#fff",
                    color: "#111",
                  }}
                >
                  {SOCIAL_PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>

                <input
                  type="url"
                  value={link.url}
                  placeholder={currentPlatform.placeholder}
                  onChange={(e) => updateLink(idx, { url: e.target.value })}
                  style={{
                    flex: "2 1 200px",
                    height: "36px",
                    padding: "0 10px",
                    fontSize: "13px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "#fff",
                    color: "#111",
                  }}
                />

                {link.platform === "custom" && (
                  <input
                    type="text"
                    value={link.label || ""}
                    placeholder="Label (e.g. Docs)"
                    onChange={(e) => updateLink(idx, { label: e.target.value })}
                    style={{
                      flex: "1 1 110px",
                      height: "36px",
                      padding: "0 10px",
                      fontSize: "13px",
                      borderRadius: "4px",
                      border: "1px solid #d1d5db",
                      backgroundColor: "#fff",
                      color: "#111",
                    }}
                  />
                )}

                <button
                  type="button"
                  onClick={() => removeLink(idx)}
                  title="Remove link"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#9ca3af",
                    fontSize: "15px",
                    cursor: "pointer",
                    padding: "4px 8px",
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#ef4444")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9ca3af")}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
