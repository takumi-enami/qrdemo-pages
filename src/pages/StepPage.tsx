import { useEffect, useMemo, useState } from "react";
import PageShell from "../PageShell";
import {
  advanceSample,
  formatApiError,
  getSamplesFiltered,
  getStations,
  rollbackSample,
  type Sample,
  type StepCode,
} from "../api";
import { stepLabel, useTableStyles } from "../ui";

type StepPageProps = {
  step: StepCode;
  title: string;
};

export default function StepPage(props: StepPageProps) {
  const { step, title } = props;
  const styles = useTableStyles();
  const [loading, setLoading] = useState<boolean>(false);
  const [stationLoading, setStationLoading] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [samples, setSamples] = useState<Sample[]>([]);
  const [stationId, setStationId] = useState<string>("");
  const [sampleCode, setSampleCode] = useState<string>("");
  const [titleFilter, setTitleFilter] = useState<string>("");

  async function fetchSamples(next: { sampleCode: string; title: string }) {
    setLoading(true);
    setError("");
    try {
      const data = await getSamplesFiltered({
        limit: 50,
        step,
        sample_code: next.sampleCode,
        title: next.title,
      });
      setSamples(data);
    } catch (e) {
      setError(formatApiError(e));
      setSamples([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStationsList() {
    setStationLoading(true);
    try {
      const data = await getStations(step);
      if (data.length > 0) {
        setStationId(data[0].id);
      } else {
        setStationId("");
      }
    } catch (e) {
      setActionError(formatApiError(e));
      setStationId("");
    } finally {
      setStationLoading(false);
    }
  }

  useEffect(() => {
    fetchSamples({ sampleCode, title: titleFilter });
    fetchStationsList();
  }, [step]);

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchSamples({ sampleCode, title: titleFilter });
    }, 300);
    return () => clearTimeout(handle);
  }, [sampleCode, titleFilter, step]);

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
    if (!stationId) {
      setActionError("ステーションが未設定です。");
      return;
    }
    setActionLoadingId(sample.id);
    try {
      const body: { station_id: string; expected_version: number; meta: Record<string, unknown>; note?: string } = {
        station_id: stationId,
        expected_version: sample.version,
        meta: {},
      };
      const updated = await advanceSample(sample.id, body);
      setMessage(`Advance OK: ${updated.code} → ${stepLabel(updated.current_step)} (更新回数 ${updated.version})`);
      await fetchSamples({ sampleCode, title: titleFilter });
    } catch (e) {
      setActionError(formatApiError(e));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleRollback(sample: Sample) {
    setActionError("");
    setMessage("");
    if (!stationId) {
      setActionError("ステーションが未設定です。");
      return;
    }
    setActionLoadingId(sample.id);
    try {
      const body: { station_id: string; expected_version: number; meta: Record<string, unknown>; note?: string } = {
        station_id: stationId,
        expected_version: sample.version,
        meta: {},
      };
      const updated = await rollbackSample(sample.id, body);
      setMessage(`Rollback OK: ${updated.code} → ${stepLabel(updated.current_step)} (更新回数 ${updated.version})`);
      await fetchSamples({ sampleCode, title: titleFilter });
    } catch (e) {
      setActionError(formatApiError(e));
    } finally {
      setActionLoadingId(null);
    }
  }

  const canAct = Boolean(stationId) && !stationLoading;

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
              onClick={() => fetchSamples({ sampleCode, title: titleFilter })}
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
              placeholder="Sample code"
              value={sampleCode}
              onChange={(e) => setSampleCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchSamples({ sampleCode, title: titleFilter });
              }}
              style={styles.filterInput}
            />
            <input
              type="text"
              placeholder="Title"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchSamples({ sampleCode, title: titleFilter });
              }}
              style={{ ...styles.filterInput, ...styles.filterInputWide }}
            />
            <button
              type="button"
              style={styles.clearButton}
              onClick={() => {
                setSampleCode("");
                setTitleFilter("");
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <div style={styles.hintRow}>
          <span style={styles.statusPill}>
            {loading ? "読み込み中…" : `件数: ${samples.length}`}
          </span>
          {stationLoading ? <span>ステーション読み込み中…</span> : null}
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
                <th style={styles.th}>更新回数</th>
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
                const stepText = stepLabel(s.current_step);
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
                            ...(isBusy || !canAct ? styles.buttonDisabled : null),
                          }}
                          onClick={() => handleAdvance(s)}
                          disabled={isBusy || !canAct}
                        >
                          {actionButtons.advance}
                        </button>
                        <button
                          type="button"
                          style={{
                            ...styles.buttonDanger,
                            ...(isBusy || !canAct ? styles.buttonDisabled : null),
                          }}
                          onClick={() => handleRollback(s)}
                          disabled={isBusy || !canAct}
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
