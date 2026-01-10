import { useEffect, useMemo, useState } from "react";
import Layout from "./Layout";
import DiagnosticsPanel from "./DiagnosticsPanel";

type Sample = {
  id: string;
  code: string;
  title: string | null;
  current_step: string | null;
  updated_at: string | null;
  locked: boolean | null;
};

type SampleRow = {
  id: string;
  sample_code: string;
  title: string | null;
  current_step: string | null;
  updated_at: string | null;
  locked: boolean | null;
};

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: { code: string; message: string; details?: unknown } };
type ApiResp<T> = ApiOk<T> | ApiErr;

type Page = "samples" | "diagnostics";

export default function App() {
  const [page, setPage] = useState<Page>("samples");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [samples, setSamples] = useState<Sample[]>([]);

  const pageTitle = page === "samples" ? "検体" : "機器テスト";

  const styles = useMemo(() => {
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
        tableLayout: "fixed",
      } as const,
      th: {
        position: "sticky",
        top: 0,
        background: headerBg,
        color: subtle,
        fontSize: 12,
        fontWeight: 700,
        textAlign: "left",
        padding: "10px 12px",
        borderBottom: `1px solid ${borderColor}`,
        whiteSpace: "nowrap",
      } as const,
      td: {
        padding: "10px 12px",
        borderBottom: `1px solid ${borderColor}`,
        verticalAlign: "middle",
        color: text,
        fontSize: 14,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      } as const,
      trHover: {
        background: "#fafafa",
      } as const,
      colCode: { width: 160 } as const,
      colTitle: { width: "auto" } as const,
      colStep: { width: 160 } as const,
      colUpdated: { width: 210 } as const,
      colLock: { width: 120 } as const,
      codeText: {
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 13,
        color: "#0f172a",
      } as const,
      titleText: {
        color: text,
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

  async function fetchSamples() {
    setLoading(true);
    setError("");
    try {
      const tokenResp = await fetch("/api/token", {
        method: "POST",
        credentials: "include",
      });
      if (!tokenResp.ok) {
        throw new Error(`Token request failed: ${tokenResp.status}`);
      }
      const tokenJson = (await tokenResp.json()) as ApiResp<{ user?: unknown }>;
      if (!tokenJson.ok) {
        throw new Error(`${tokenJson.error.code}: ${tokenJson.error.message}`);
      }

      const resp = await fetch("/api/samples?limit=10", {
        method: "GET",
        credentials: "include",
      });
      if (!resp.ok) {
        throw new Error(`Samples request failed: ${resp.status}`);
      }
      const json = (await resp.json()) as ApiResp<SampleRow[]>;
      if (!json.ok) {
        throw new Error(`${json.error.code}: ${json.error.message}`);
      }
      const rows = Array.isArray(json.data) ? json.data : [];
      setSamples(
        rows.map((row) => ({
          id: row.id,
          code: row.sample_code,
          title: row.title,
          current_step: row.current_step,
          updated_at: row.updated_at,
          locked: row.locked,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSamples([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSamples();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onHome = () => setPage("samples");

  const formatUpdatedAt = (v: Sample["updated_at"]) => {
    if (v == null) return "";
    const s = String(v).trim();
    if (!s) return "";
    const d = new Date(String(v));
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString();
  };

  const samplesView = (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <div style={styles.navGroup}>
          <button
            type="button"
            style={styles.button}
            onClick={() => setPage("samples")}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = styles.buttonHover.background;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = styles.button.background;
            }}
          >
            検体
          </button>
          <button
            type="button"
            style={styles.buttonSecondary}
            onClick={() => setPage("diagnostics")}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = styles.buttonHover.background;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = styles.buttonSecondary.background;
            }}
          >
            機器テスト
          </button>
        </div>

        <div style={styles.navGroup}>
          <button
            type="button"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : null),
            }}
            onClick={() => fetchSamples()}
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.background = styles.buttonHover.background;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = styles.button.background;
            }}
          >
            再読み込み
          </button>
        </div>
      </div>

      <div style={styles.hintRow}>
        <span style={styles.statusPill}>
          {loading ? "読み込み中…" : `件数: ${samples.length}`}
        </span>
        {error ? <span style={{ color: "#b91c1c" }}>エラー: {error}</span> : null}
      </div>

      {error ? <div style={styles.errorBox}>{error}</div> : null}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <colgroup>
            <col style={styles.colCode} />
            <col style={styles.colTitle} />
            <col style={styles.colStep} />
            <col style={styles.colUpdated} />
            <col style={styles.colLock} />
          </colgroup>
          <thead>
            <tr>
              <th style={styles.th}>検体コード</th>
              <th style={styles.th}>タイトル</th>
              <th style={styles.th}>工程</th>
              <th style={styles.th}>更新日時</th>
              <th style={styles.th}>ロック</th>
            </tr>
          </thead>
          <tbody>
            {samples.length === 0 && !loading ? (
              <tr>
                <td style={{ ...styles.td, borderBottom: "none" }} colSpan={5}>
                  <div style={styles.emptyText}>表示する検体がありません。</div>
                </td>
              </tr>
            ) : null}

            {samples.map((s) => {
              const updated = formatUpdatedAt(s.updated_at);
              const stepText = (s.current_step ?? "").trim();
              const isLocked = Boolean(s.locked);
              return (
                <tr
                  key={s.id}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = styles.trHover.background;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                  }}
                >
                  <td style={styles.td} title={s.code}>
                    <span style={styles.codeText}>{s.code}</span>
                  </td>
                  <td style={styles.td} title={s.title ?? ""}>
                    <span style={styles.titleText}>{s.title ?? ""}</span>
                  </td>
                  <td style={styles.td} title={stepText}>
                    {stepText ? <span style={styles.badge}>{stepText}</span> : <span style={styles.mutedDash}>—</span>}
                  </td>
                  <td style={styles.td} title={updated || (s.updated_at ?? "")}>
                    {updated ? updated : <span style={styles.mutedDash}>—</span>}
                  </td>
                  <td style={styles.td}>
                    {isLocked ? (
                      <span style={styles.lockWrap}>
                        <span style={styles.lockMain}>ロック</span>
                        <span style={styles.lockSub}>操作制限</span>
                      </span>
                    ) : (
                      <span style={styles.mutedDash}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={styles.footerNote}>※ 表示は読み取り専用です。</div>
    </div>
  );

  return (
    <Layout pageTitle={pageTitle} onHome={onHome}>
      {page === "diagnostics" ? <DiagnosticsPanel /> : samplesView}
    </Layout>
  );
}
