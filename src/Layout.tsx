import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const accountLabel = useMemo(() => resolveAccountLabel(me), [me]);

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore logout failure
    } finally {
      setMenuOpen(false);
      window.location.assign("/");
    }
  }

  const styles: Record<string, React.CSSProperties> = {
    root: {
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
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
    accountButton: {
      appearance: "none",
      border: "1px solid rgba(17,24,39,0.08)",
      background: "rgba(17,24,39,0.06)",
      padding: "6px 10px",
      borderRadius: 999,
      fontSize: 13,
      color: "#111827",
      maxWidth: 360,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      cursor: "pointer",
    },
    menu: {
      position: "absolute",
      top: "calc(100% + 8px)",
      right: 0,
      background: "#ffffff",
      border: "1px solid rgba(17,24,39,0.1)",
      borderRadius: 10,
      boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
      minWidth: 180,
      padding: 6,
      zIndex: 20,
    },
    menuItem: {
      display: "flex",
      alignItems: "center",
      padding: "8px 10px",
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 600,
      color: "#111827",
      textDecoration: "none",
      cursor: "pointer",
    },
    menuItemMuted: {
      color: "#b91c1c",
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
      margin: "0 auto",
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
          <button type="button" onClick={onHome} style={styles.homeButton} aria-label="Home" title="Home">
            QRDemo
          </button>
        </div>

        <div style={styles.right}>
          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              type="button"
              style={styles.accountButton}
              aria-label="Current account"
              title={accountLabel}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {accountLabel}
            </button>
            {menuOpen ? (
              <div style={styles.menu}>
                <Link to="/settings/devices" style={styles.menuItem} onClick={() => setMenuOpen(false)}>
                  機器設定
                </Link>
                <button
                  type="button"
                  style={{ ...styles.menuItem, ...styles.menuItemMuted }}
                  onClick={handleLogout}
                >
                  ログアウト
                </button>
              </div>
            ) : null}
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
