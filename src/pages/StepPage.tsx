import { useEffect, useMemo, useState } from "react";
import PageShell from "../PageShell";
import {
  advanceSample,
  formatApiError,
  getSamples,
  rollbackSample,
  type Sample,
  type StepCode,
} from "../api";
import { useTableStyles } from "../ui";

type StepPageProps = {
  step: StepCode;
  title: string;
};

export default function StepPage(props: StepPageProps) {
  const { step, title } = props;
  const styles = useTableStyles();
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [samples, setSamples] = useState<Sample[]>([]);

  async function fetchSamples() {
    setLoading(true);
    setError("");
    try {
      const data = await getSamples({ limit: 50 });
      setSamples(data.filter((row) => row.current_step === step));
    } catch (e) {
      setError(formatApiError(e));
      setSamples([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSamples();
  }, [step]);

  const formatUpdatedAt = (v: Sample["updated_at"]) => {
    if (v == null) return "";
    const s = String(v).trim();
    if (!s) return "";
    const d = new Date(String(v));
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString();
  };

  const actionButtons = useMemo(
    () => ({
      advance: "次へ進める",
      rollback: "戻す",
    }),
    []
  );

  async function handleAdvance(sample: Sample) {
    setActionError("");
    setMessage("");
    setActionLoadingId(sample.id);
    try {
      const updated = await advanceSample(sample.id, {
        expected_version: sample.version,
        note: note.trim() ? note.trim() : null,
        meta: {},
      });
      setMessage(`Advance OK: ${updated.code} → ${updated.current_step} (v${updated.version})`);
      await fetchSamples();
    } catch (e) {
      setActionError(formatApiError(e));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleRollback(sample: Sample) {
    setActionError("");
    setMessage("");
    setActionLoadingId(sample.id);
    try {
      const updated = await rollbackSample(sample.id, {
        expected_version: sample.version,
        note: note.trim() ? note.trim() : null,
        meta: {},
      });
      setMessage(`Rollback OK: ${updated.code} → ${updated.current_step} (v${updated.version})`);
      await fetchSamples();
    } catch (e) {
      setActionError(formatApiError(e));
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <PageShell title={title}>
      <div style={styles.container}>
        <div style={styles.topBar}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>注記</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="操作時のメモ"
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 13,
                width: 220,
              }}
            />
          </div>
        </div>

        <div style={styles.hintRow}>
          <span style={styles.statusPill}>
            {loading ? "読み込み中…" : `件数: ${samples.length}`}
          </span>
          {error ? <span style={{ color: "#b91c1c" }}>エラー: {error}</span> : null}
        </div>

        {error ? <div style={styles.errorBox}>{error}</div> : null}
        {actionError ? <div style={styles.errorBox}>{actionError}</div> : null}
        {message ? <div style={styles.successBox}>{message}</div> : null}

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <colgroup>
              <col style={styles.colCode} />
              <col style={styles.colTitle} />
              <col style={styles.colStep} />
              <col style={styles.colUpdated} />
              <col style={styles.colLock} />
              <col style={styles.colVersion} />
              <col style={styles.colActions} />
            </colgroup>
            <thead>
              <tr>
                <th style={styles.th}>検体コード</th>
                <th style={styles.th}>タイトル</th>
                <th style={styles.th}>工程</th>
                <th style={styles.th}>更新日時</th>
                <th style={styles.th}>ロック</th>
                <th style={styles.th}>版数</th>
                <th style={styles.th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {samples.length === 0 && !loading ? (
                <tr>
                  <td style={{ ...styles.td, borderBottom: "none" }} colSpan={7}>
                    <div style={styles.emptyText}>対象の検体がありません。</div>
                  </td>
                </tr>
              ) : null}

              {samples.map((s) => {
                const updated = formatUpdatedAt(s.updated_at);
                const stepText = (s.current_step ?? "").trim();
                const isLocked = Boolean(s.locked);
                const isBusy = actionLoadingId === s.id;
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
                    <td style={styles.td}>{s.version}</td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          style={{
                            ...styles.buttonGhost,
                            ...(isBusy ? styles.buttonDisabled : null),
                          }}
                          onClick={() => handleAdvance(s)}
                          disabled={isBusy}
                        >
                          {actionButtons.advance}
                        </button>
                        <button
                          type="button"
                          style={{
                            ...styles.buttonDanger,
                            ...(isBusy ? styles.buttonDisabled : null),
                          }}
                          onClick={() => handleRollback(s)}
                          disabled={isBusy}
                        >
                          {actionButtons.rollback}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={styles.footerNote}>※ 操作後は一覧を再読み込みします。</div>
      </div>
    </PageShell>
  );
}
