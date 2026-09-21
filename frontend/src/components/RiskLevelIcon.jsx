import React from "react";

export default function RiskLevelIcon({
  level,
  size = 18,
  className = "",
}) {
  const normalizedLevel = String(level || "LOW").toUpperCase();

  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": "true",
  };

  /* =====================================================
     CRITICAL — WARNING TRIANGLE
     ===================================================== */

  if (normalizedLevel === "CRITICAL") {
    return (
      <svg {...commonProps}>
        <path d="M12 3L21 20H3L12 3Z" />
        <path d="M12 9V14" />
        <circle cx="12" cy="17" r="0.8" fill="currentColor" />
      </svg>
    );
  }

  /* =====================================================
     HIGH — PULSE / ACTIVITY
     ===================================================== */

  if (normalizedLevel === "HIGH") {
    return (
      <svg {...commonProps}>
        <path d="M3 12H7L9.5 6L13 18L16 10L17.5 12H21" />
      </svg>
    );
  }

  /* =====================================================
     MEDIUM — CLOCK
     ===================================================== */

  if (normalizedLevel === "MEDIUM") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7V12L15.5 14" />
      </svg>
    );
  }

  /* =====================================================
     LOW — SHIELD + CHECK
     ===================================================== */

  return (
    <svg {...commonProps}>
      <path d="M12 3L19 6V11C19 15.5 16.4 19 12 21C7.6 19 5 15.5 5 11V6L12 3Z" />
      <path d="M8.5 12L10.8 14.3L15.8 9.2" />
    </svg>
  );
}