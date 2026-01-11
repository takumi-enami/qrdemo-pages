import { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import PageShell from "../PageShell";
import {
  advanceSample,
  createSample,
  formatApiError,
  getSamples,
  getStations,
  rollbackSample,
  type Sample,
} from "../api";
import { stepLabel, useTableStyles } from "../ui";

export default function ReceivePage() {
  const step = "RECEIVE";
  const styles = useTableStyles();
  const [loading, setLoading] = useState<boolean>(false);
  const [stationLoading, setStationLoading] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [samples, setSamples] = useState<Sample[]>([]);
  const [stationId, setStationId] = useState<string>("");
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [sampleCode, setSampleCode] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [inputUuid, setInputUuid] = useState<string>("");
  const [createError, setCreateError] = useState<string>("");
  const [created, setCreated] = useState<Sample | null>(null);
  const [copyMessage, setCopyMessage] = useState<string>("");

  async function fetchSamples() {
    setLoading(true);
    setError("");
    try {
      const data = await getSamples({ limit: 50, step });
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
      if (!stationId && data.length > 0) {
        setStationId(data[0].id);
      }
    } catch (e) {
      setActionError(formatApiError(e));
      setStationId("");
    } finally {
      setStationLoading(false);
    }
  }

  useEffect(() => {
    fetchSamples();
    fetchStationsList();
  }, []);

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
      await fetchSamples();
    } catch (e) {
      setActionError(formatApiError(e));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleCreate() {
    setCreateError("");
    setCreated(null);
    setCopyMessage("");
    const trimmedCode = sampleCode.trim();
    if (!trimmedCode) {
      setCreateError("検体コードは必須です。");
      return;
    }
    try {
      const data = await createSample({
        sample_code: trimmedCode,
        title: title.trim() ? title.trim() : null,
        id_uuid: inputUuid.trim() ? inputUuid.trim() : null,
      });
      setCreated(data);
      setSampleCode("");
      setTitle("");
      setInputUuid("");
      await fetchSamples();
    } catch (e) {
      setCreateError(formatApiError(e));
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("コピーしました");
    } catch {
      setCopyMessage("コピーに失敗しました");
    }
    window.setTimeout(() => setCopyMessage(""), 1500);
  }

  const canAct = Boolean(stationId) && !stationLoading;

  return (
    <PageShell title="受入">
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
            <button
              type="button"
              style={styles.buttonSecondary}
              onClick={() => setShowCreate((prev) => !prev)}
            >
              新規
            </button>
          </div>
        </div>

        {showCreate ? (
          <div style={{ marginBottom: 16, padding: 12, border: "1px solid #e5e7eb", borderRadius: 10 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                検体コード (必須)
                <input
                  value={sampleCode}
                  onChange={(e) => setSampleCode(e.target.value)}
                  placeholder="S-0001"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db", minWidth: 200 }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                タイトル (任意)
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="検体タイトル"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db", minWidth: 240 }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                UUID (任意)
                <input
                  value={inputUuid}
                  onChange={(e) => setInputUuid(e.target.value)}
                  placeholder="既存QRのUUIDを貼り付け"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db", minWidth: 280 }}
                />
              </label>
              <button type="button" style={styles.button} onClick={handleCreate}>
                作成
              </button>
            </div>
            {createError ? <div style={{ ...styles.errorBox, marginTop: 10 }}>{createError}</div> : null}
            {created ? (
              <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>作成されたUUID</div>
                  <div style={{ fontFamily: styles.codeText.fontFamily, fontSize: 13 }}>{created.id}</div>
                  <button
                    type="button"
                    onClick={() => handleCopy(created.id)}
                    style={{ marginTop: 6, ...styles.buttonGhost }}
                  >
                    コピー
                  </button>
                  {copyMessage ? <div style={{ fontSize: 12, color: "#16a34a" }}>{copyMessage}</div> : null}
                </div>
                <QRCodeCanvas value={created.id} size={160} />
              </div>
            ) : null}
          </div>
        ) : null}

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
