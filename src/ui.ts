import { useMemo } from "react";
import type { StepCode } from "./api";

const STEP_LABELS: Record<StepCode, string> = {
  RECEIVE: "受入",
  PREP: "前処理",
  WEIGH: "秤量",
  ANALYZE: "分析",
  REPORT: "報告",
  CERTIFY: "証明",
};

export function stepLabel(step?: StepCode | string | null): string {
  if (!step) return "";
  const key = String(step) as StepCode;
  return STEP_LABELS[key] ?? String(step);
}

export function useTableStyles() {
  return useMemo(() => {
    const borderColor = "#e5e7eb";
    const headerBg = "#f7f9fc";
    const text = "#111827";
    const subtle = "#6b7280";
    const blue = "#2563eb";
    const blueHover = "#1d4ed8";

    return {
      container: {
        padding: 16,
      } as const,
      topBar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 12,
      } as const,
      navGroup: {
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
      } as const,
      filterGroup: {
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
      } as const,
      filterInput: {
        border: `1px solid ${borderColor}`,
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: 13,
        lineHeight: 1.3,
        minWidth: 160,
      } as const,
      filterInputWide: {
        minWidth: 220,
      } as const,
      clearButton: {
        border: `1px solid ${borderColor}`,
        borderRadius: 999,
        padding: "6px 10px",
        background: "white",
        color: subtle,
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
      } as const,
      button: {
        border: "none",
        borderRadius: 8,
        padding: "8px 12px",
        background: blue,
        color: "white",
        cursor: "pointer",
        fontSize: 14,
        lineHeight: 1,
        fontWeight: 600,
      } as const,
      buttonSecondary: {
        border: "none",
        borderRadius: 8,
        padding: "8px 12px",
        background: blue,
        color: "white",
        cursor: "pointer",
        fontSize: 14,
        lineHeight: 1,
        fontWeight: 600,
        opacity: 0.92,
      } as const,
      buttonGhost: {
        border: `1px solid ${borderColor}`,
        borderRadius: 8,
        padding: "6px 10px",
        background: "white",
        color: text,
        cursor: "pointer",
        fontSize: 13,
        lineHeight: 1.2,
        fontWeight: 600,
      } as const,
      buttonDanger: {
        border: "1px solid #fecaca",
        borderRadius: 8,
        padding: "6px 10px",
        background: "#fff1f2",
        color: "#b91c1c",
        cursor: "pointer",
        fontSize: 13,
        lineHeight: 1.2,
        fontWeight: 700,
      } as const,
      buttonDisabled: {
        opacity: 0.6,
        cursor: "not-allowed",
      } as const,
      hintRow: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        color: subtle,
        fontSize: 13,
        marginBottom: 10,
      } as const,
      statusPill: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: `1px solid ${borderColor}`,
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: 12,
        color: subtle,
        background: "white",
      } as const,
      errorBox: {
        border: "1px solid #fecaca",
        background: "#fff1f2",
        color: "#991b1b",
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        fontSize: 13,
        whiteSpace: "pre-wrap",
      } as const,
      successBox: {
        border: "1px solid #bbf7d0",
        background: "#f0fdf4",
        color: "#166534",
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        fontSize: 13,
        whiteSpace: "pre-wrap",
      } as const,
      tableWrap: {
        width: "100%",
        overflowX: "auto",
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        background: "white",
      } as const,
      table: {
        width: "100%",
        borderCollapse: "separate",
        borderSpacing: 0,
      } as const,
      th: {
        position: "sticky",
        top: 0,
        background: headerBg,
        color: subtle,
        fontSize: 12,
        fontWeight: 700,
        textAlign: "center",
        padding: "10px 12px",
        borderBottom: `1px solid ${borderColor}`,
        whiteSpace: "nowrap",
      } as const,
      thButton: {
        appearance: "none",
        border: "none",
        background: "transparent",
        padding: 0,
        margin: 0,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 700,
        color: subtle,
      } as const,
      sortIndicator: {
        color: blue,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.3,
      } as const,
      td: {
        padding: "10px 12px",
        borderBottom: `1px solid ${borderColor}`,
        verticalAlign: "middle",
        color: text,
        fontSize: 14,
        textAlign: "center",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      } as const,
      trHover: {
        background: "#fafafa",
      } as const,
      colCode: { width: 160 } as const,
      colTitle: { width: "auto" } as const,
      colStep: { width: 140 } as const,
      colUpdated: { width: 210 } as const,
      colLock: { width: 110 } as const,
      colVersion: { width: 90 } as const,
      colActions: { width: 180 } as const,
      codeText: {
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 13,
        color: "#0f172a",
      } as const,
      titleText: {
        color: text,
      } as const,
      linkText: {
        color: blue,
        textDecoration: "none",
        fontWeight: 600,
      } as const,
      emptyText: {
        color: subtle,
        fontSize: 13,
        padding: 16,
      } as const,
      badge: {
        display: "inline-flex",
        alignItems: "center",
        maxWidth: "100%",
        padding: "3px 10px",
        borderRadius: 999,
        border: `1px solid ${borderColor}`,
        background: "#f3f4f6",
        color: "#374151",
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      } as const,
      lockWrap: {
        display: "inline-flex",
        alignItems: "baseline",
        gap: 8,
        minHeight: 18,
      } as const,
      lockMain: {
        fontSize: 12,
        fontWeight: 800,
        color: "#b91c1c",
        background: "#fee2e2",
        border: "1px solid #fecaca",
        borderRadius: 999,
        padding: "2px 8px",
        lineHeight: 1.2,
      } as const,
      lockSub: {
        fontSize: 11,
        color: subtle,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      } as const,
      mutedDash: {
        color: "#9ca3af",
      } as const,
      footerNote: {
        marginTop: 10,
        fontSize: 12,
        color: subtle,
      } as const,
      buttonHover: {
        background: blueHover,
      } as const,
    };
  }, []);
}
