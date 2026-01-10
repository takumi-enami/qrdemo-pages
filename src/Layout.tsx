import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
type MeResponse = {
  display_name?: string | null;
  email?: string | null;
  identifier?: string | null;
  id?: string | number | null;
  username?: string | null;
  name?: string | null;
  user?: {
    display_name?: string | null;
    email?: string | null;
    identifier?: string | null;
    id?: string | number | null;
    username?: string | null;
    name?: string | null;
  } | null;
};

type LayoutProps = {
  pageTitle: string;
  onHome: () => void;
  children: ReactNode;
};

function resolveAccountLabel(me: MeResponse | null): string {
  if (!me) return "(unknown)";

  const u = (me.user ?? null) as MeResponse["user"] | null;

  const candidates = [
    me.display_name,
    u?.display_name,
    me.name,
    u?.name,
    me.username,
    u?.username,
    me.email,
    u?.email,
    me.identifier,
    u?.identifier,
    me.id != null ? String(me.id) : null,
    u?.id != null ? String(u.id) : null,
  ];

  for (const c of candidates) {
    const v = (c ?? "").toString().trim();
    if (v) return v;
  }
  return "(unknown)";
}

export default function Layout(props: LayoutProps) {
  const { pageTitle, onHome, children } = props;

  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/me", { method: "GET", credentials: "include" });
        if (!res.ok) throw new Error(`GET /api/me failed (${res.status})`);
        const data = (await res.json()) as MeResponse;
        if (!cancelled) setMe(data ?? null);
      } catch {
        if (!cancelled) setMe(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const accountLabel = useMemo(() => resolveAccountLabel(me), [me]);

  const styles: Record<string, React.CSSProperties> = {
    root: {
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",  // ←これを必ず（flex-start なら置換）
      background: "#f6f7fb",
      color: "#111827",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    },

    topBar: {
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 16px",
      borderBottom: "1px solid rgba(17,24,39,0.08)",
      background: "#ffffff",
      boxSizing: "border-box",
      position: "sticky",
      top: 0,
      zIndex: 10,
    },
    left: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      minWidth: 120,
    },
    homeButton: {
      appearance: "none",
      border: "none",
      background: "transparent",
      padding: "8px 10px",
      margin: 0,
      cursor: "pointer",
      borderRadius: 8,
      fontSize: 15,
      fontWeight: 700,
      color: "#111827",
      lineHeight: "20px",
    },
    right: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      minWidth: 160,
      gap: 8,
    },
    accountChip: {
      maxWidth: 360,
      padding: "6px 10px",
      borderRadius: 999,
      background: "rgba(17,24,39,0.06)",
      border: "1px solid rgba(17,24,39,0.08)",
      fontSize: 13,
      color: "#111827",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    main: {
      flex: 1,
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      padding: "24px 16px 40px",
      boxSizing: "border-box",
    },
    card: {
      width: "100%",
      maxWidth: 980,
      margin: "0 auto",          // ←これ重要（flexでも効く）
      background: "#ffffff",
      border: "1px solid rgba(17,24,39,0.08)",
      borderRadius: 12,
      boxShadow: "0 8px 24px rgba(17,24,39,0.06)",
      padding: 20,
      boxSizing: "border-box",
    },

    titleRow: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    pageTitle: {
      margin: 0,
      fontSize: 18,
      fontWeight: 700,
      lineHeight: "24px",
      color: "#111827",
    },
    content: {
      width: "100%",
    },
  };

  return (
    <div style={styles.root}>
      <div style={styles.topBar}>
        <div style={styles.left}>
          <button
            type="button"
            onClick={onHome}
            style={styles.homeButton}
            aria-label="Home"
            title="Home"
          >
            QRDemo
          </button>
        </div>

        <div style={styles.right}>
          <div style={styles.accountChip} aria-label="Current account" title={accountLabel}>
            {accountLabel}
          </div>
        </div>
      </div>

      <div style={styles.main}>
        <div style={styles.card}>
          <div style={styles.titleRow}>
            <h1 style={styles.pageTitle}>{pageTitle}</h1>
          </div>
          <div style={styles.content}>{children}</div>
        </div>
      </div>
    </div>
  );
}