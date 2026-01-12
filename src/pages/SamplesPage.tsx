import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageShell from "../PageShell";
import { formatApiError, getSamplesFiltered, type Sample } from "../api";
import { stepLabel, useTableStyles } from "../ui";

export default function SamplesPage() {
  const styles = useTableStyles();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [samples, setSamples] = useState<Sample[]>([]);
  const [sampleId, setSampleId] = useState<string>(searchParams.get("id") ?? "");
  const [sampleCode, setSampleCode] = useState<string>(searchParams.get("sample_code") ?? "");
  const [title, setTitle] = useState<string>(searchParams.get("title") ?? "");
  const [order, setOrder] = useState<"asc" | "desc">(searchParams.get("order") === "asc" ? "asc" : "desc");

  const sortLabel = useMemo(() => (order === "asc" ? "ASC" : "DESC"), [order]);

  async function fetchSamples(next: { sampleId: string; sampleCode: string; title: string; order: "asc" | "desc" }) {
    setLoading(true);
    setError("");
    try {
      const data = await getSamplesFiltered({
        limit: 50,
        id: next.sampleId,
        sample_code: next.sampleCode,
        title: next.title,
        sort: "updated_at",
        order: next.order,
      });
      setSamples(data);
    } catch (e) {
      setError(formatApiError(e));
      setSamples([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const nextSampleId = searchParams.get("id") ?? "";
    const nextSampleCode = searchParams.get("sample_code") ?? "";
    const nextTitle = searchParams.get("title") ?? "";
    const nextOrder = searchParams.get("order") === "asc" ? "asc" : "desc";
    setSampleId(nextSampleId);
    setSampleCode(nextSampleCode);
    setTitle(nextTitle);
    setOrder(nextOrder);
    fetchSamples({ sampleId: nextSampleId, sampleCode: nextSampleCode, title: nextTitle, order: nextOrder });
  }, [searchParams]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams();
      if (sampleId.trim()) next.set("id", sampleId.trim());
      if (sampleCode.trim()) next.set("sample_code", sampleCode.trim());
      if (title.trim()) next.set("title", title.trim());
      next.set("sort", "updated_at");
      next.set("order", order);
      setSearchParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(handle);
  }, [sampleId, sampleCode, title, order, setSearchParams]);

  function handleRefresh() {
    fetchSamples({ sampleId, sampleCode, title, order });
  }

  function handleClear() {
    setSampleId("");
    setSampleCode("");
    setTitle("");
  }

  function toggleOrder() {
    setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  const formatUpdatedAt = (v: Sample["updated_at"]) => {
    if (v == null) return "";
    const s = String(v).trim();
    if (!s) return "";
    const d = new Date(String(v));
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString();
  };

  return (
    <PageShell title="検体一覧">
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div style={styles.navGroup}>
            <button
              type="button"
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : null),
              }}
              onClick={handleRefresh}
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
          <div style={styles.filterGroup}>
            <input
              type="text"
              placeholder="ID (UUID)"
              value={sampleId}
              onChange={(e) => setSampleId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRefresh();
              }}
              style={{ ...styles.filterInput, ...styles.filterInputWide }}
            />
            <input
              type="text"
              placeholder="Sample code"
              value={sampleCode}
              onChange={(e) => setSampleCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRefresh();
              }}
              style={styles.filterInput}
            />
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRefresh();
              }}
              style={styles.filterInput}
            />
            <button type="button" style={styles.clearButton} onClick={handleClear}>
              Clear
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
              <col style={styles.colVersion} />
            </colgroup>
            <thead>
              <tr>
                <th style={styles.th}>検体コード</th>
                <th style={styles.th}>タイトル</th>
                <th style={styles.th}>工程</th>
                <th style={styles.th}>
                  <button type="button" style={styles.thButton} onClick={toggleOrder} disabled={loading}>
                    <span>更新日時</span>
                    <span style={styles.sortIndicator}>{sortLabel}</span>
                  </button>
                </th>
                <th style={styles.th}>ロック</th>
                <th style={styles.th}>更新回数</th>
              </tr>
            </thead>
            <tbody>
              {samples.length === 0 && !loading ? (
                <tr>
                  <td style={{ ...styles.td, borderBottom: "none" }} colSpan={6}>
                    <div style={styles.emptyText}>表示する検体がありません。</div>
                  </td>
                </tr>
              ) : null}

              {samples.map((s) => {
                const updated = formatUpdatedAt(s.updated_at);
                const stepText = stepLabel(s.current_step);
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
                      <Link to={`/samples/${s.id}`} style={styles.linkText}>
                        <span style={styles.codeText}>{s.code}</span>
                      </Link>
                    </td>
                    <td style={styles.td} title={s.title ?? ""}>
                      <Link to={`/samples/${s.id}`} style={styles.linkText}>
                        <span style={styles.titleText}>{s.title ?? ""}</span>
                      </Link>
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
                    <td style={styles.td}>{s.version}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={styles.footerNote}>※ 表示は読み取り専用です。</div>
      </div>
    </PageShell>
  );
}
