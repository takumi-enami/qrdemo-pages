import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageShell from "../PageShell";
import {
  ApiRequestError,
  deleteSample,
  formatApiError,
  getSampleById,
  updateSample,
  type SampleDetail,
  type StepCode,
} from "../api";
import { stepLabel, useTableStyles } from "../ui";

const STEP_OPTIONS: StepCode[] = ["RECEIVE", "PREP", "WEIGH", "ANALYZE", "REPORT", "CERTIFY"];

function formatDateTime(value: string | null | undefined): string {
  if (value == null) return "";
  const s = String(value).trim();
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

function displayValue(value: unknown): string {
  if (value == null) return "-";
  const text = String(value).trim();
  return text ? text : "-";
}

export default function SampleDetailPage() {
  const styles = useTableStyles();
  const navigate = useNavigate();
  const { id } = useParams();
  const [sample, setSample] = useState<SampleDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [sampleCode, setSampleCode] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<StepCode>("RECEIVE");

  useEffect(() => {
    if (!id) {
      setError("Missing sample id.");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getSampleById(id);
        if (cancelled) return;
        setSample(data);
        setSampleCode(data.sample_code ?? "");
        setTitle(data.title ?? "");
        setCurrentStep(data.current_step);
      } catch (e) {
        if (!cancelled) {
          setError(formatApiError(e));
          setSample(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const detailRows = useMemo(() => {
    if (!sample) return [];
    return [
      { label: "id", value: sample.id },
      { label: "org_id", value: sample.org_id },
      { label: "sample_code", value: sample.sample_code },
      { label: "title", value: sample.title ?? "" },
      { label: "current_step", value: stepLabel(sample.current_step) || sample.current_step },
      { label: "locked", value: sample.locked ? "true" : "false" },
      { label: "last_rollback_to", value: sample.last_rollback_to ?? "" },
      { label: "last_rollback_reason", value: sample.last_rollback_reason ?? "" },
      { label: "last_rollback_at", value: formatDateTime(sample.last_rollback_at) },
      { label: "created_by", value: sample.created_by ?? "" },
      { label: "created_at", value: formatDateTime(sample.created_at) },
      { label: "updated_at", value: formatDateTime(sample.updated_at) },
      { label: "version", value: sample.version },
    ];
  }, [sample]);

  async function handleSave() {
    if (!id) return;
    const trimmed = sampleCode.trim();
    if (!trimmed) {
      setError("sample_code is required.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        sample_code: trimmed,
        title: title.trim() ? title.trim() : null,
        current_step: currentStep,
      };
      const updated = await updateSample(id, payload);
      setSample(updated);
      setSampleCode(updated.sample_code ?? "");
      setTitle(updated.title ?? "");
      setCurrentStep(updated.current_step);
      setMessage("Saved.");
    } catch (e) {
      if (e instanceof ApiRequestError && e.status === 409) {
        setError("Same sample_code already exists.");
      } else {
        setError(formatApiError(e));
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm("Delete this sample? This cannot be undone.")) return;
    setDeleting(true);
    setError("");
    setMessage("");
    try {
      await deleteSample(id);
      navigate("/", { replace: true });
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageShell title="Sample Detail">
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div style={styles.navGroup}>
            <Link to="/" style={{ ...styles.buttonGhost, textDecoration: "none" }}>
              Back to list
            </Link>
          </div>
          <div style={styles.navGroup}>
            <button
              type="button"
              style={{
                ...styles.button,
                ...(saving || loading ? styles.buttonDisabled : null),
              }}
              onClick={handleSave}
              disabled={saving || loading}
            >
              Save
            </button>
            <button
              type="button"
              style={{
                ...styles.buttonDanger,
                ...(deleting || loading ? styles.buttonDisabled : null),
              }}
              onClick={handleDelete}
              disabled={deleting || loading}
            >
              Delete
            </button>
          </div>
        </div>

        <div style={styles.hintRow}>
          <span style={styles.statusPill}>{loading ? "Loading..." : "Ready"}</span>
          {error ? <span style={{ color: "#b91c1c" }}>Error: {error}</span> : null}
          {message ? <span style={{ color: "#15803d" }}>{message}</span> : null}
        </div>

        {error ? <div style={styles.errorBox}>{error}</div> : null}
        {message ? <div style={styles.successBox}>{message}</div> : null}

        <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>sample_code</span>
            <input
              type="text"
              value={sampleCode}
              onChange={(e) => setSampleCode(e.target.value)}
              style={{ ...styles.filterInput, minWidth: 240 }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ ...styles.filterInput, minWidth: 240 }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>current_step</span>
            <select
              value={currentStep}
              onChange={(e) => setCurrentStep(e.target.value as StepCode)}
              style={{ ...styles.filterInput, minWidth: 220 }}
            >
              {STEP_OPTIONS.map((step) => (
                <option key={step} value={step}>
                  {stepLabel(step) || step}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <colgroup>
              <col style={{ width: 180 }} />
              <col style={{ width: "auto" }} />
            </colgroup>
            <tbody>
              {detailRows.map((row) => (
                <tr key={row.label}>
                  <td style={{ ...styles.td, textAlign: "left", fontWeight: 700, color: "#6b7280" }}>
                    {row.label}
                  </td>
                  <td style={{ ...styles.td, textAlign: "left" }}>{displayValue(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
