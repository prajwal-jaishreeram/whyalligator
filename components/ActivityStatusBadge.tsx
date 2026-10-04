import React from "react";

export type ActivityStatus = "Active" | "Stealth" | "Public" | "Acquired";

interface ActivityStatusBadgeProps {
  status?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

export function ActivityStatusIcon({ status }: { status?: string | null }) {
  const norm = (status || "Active").trim().toLowerCase();

  if (norm === "public") {
    // Orange - Landmark / Financial market building
    return (
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <line x1="3" y1="21" x2="21" y2="21" />
        <line x1="6" y1="21" x2="6" y2="10" />
        <line x1="10" y1="21" x2="10" y2="10" />
        <line x1="14" y1="21" x2="14" y2="10" />
        <line x1="18" y1="21" x2="18" y2="10" />
        <polygon points="12 3 2 10 22 10 12 3" />
      </svg>
    );
  }

  if (norm === "acquired") {
    // Purple - Merger / Partnership intersecting rings
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <circle cx="9" cy="12" r="6" />
        <circle cx="15" cy="12" r="6" />
      </svg>
    );
  }

  if (norm === "stealth") {
    // Subtle Slate - Eye-off / Incognito
    return (
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" y1="2" x2="22" y2="22" />
      </svg>
    );
  }

  // Default: Active (Green) - Pulse / Activity wave
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export function ActivityStatusBadge({
  status,
  className = "",
  style = {},
}: ActivityStatusBadgeProps) {
  const rawStatus = (status || "Active").trim();
  const norm = rawStatus.toLowerCase();

  // Color mappings
  let bg = "#f0fdf4";
  let border = "#bbf7d0";
  let text = "#15803d";
  let label = rawStatus || "Active";

  if (norm === "public") {
    bg = "#fff7ed";
    border = "#fed7aa";
    text = "#c2410c";
    label = "Public";
  } else if (norm === "acquired") {
    bg = "#faf5ff";
    border = "#e9d5ff";
    text = "#7e22ce";
    label = "Acquired";
  } else if (norm === "stealth") {
    bg = "#f1f5f9";
    border = "#cbd5e1";
    text = "#475569";
    label = "Stealth";
  } else {
    // Active
    bg = "#f0fdf4";
    border = "#bbf7d0";
    text = "#15803d";
    label = "Active";
  }

  return (
    <span
      className={`pill ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        background: bg,
        border: `1px solid ${border}`,
        color: text,
        fontWeight: 600,
        fontSize: "12px",
        padding: "3px 9px",
        borderRadius: "9999px",
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        ...style,
      }}
      title={`Status: ${label}`}
    >
      <ActivityStatusIcon status={label} />
      <span>{label}</span>
    </span>
  );
}
