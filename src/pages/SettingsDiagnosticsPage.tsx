import { Link } from "react-router-dom";
import DiagnosticsPanel from "../DiagnosticsPanel";
import PageShell from "../PageShell";

export default function SettingsDiagnosticsPage() {
  return (
    <PageShell title="機器診断">
      <div style={{ marginBottom: 12 }}>
        <Link to="/settings/devices" style={{ fontSize: 13, color: "#2563eb" }}>
          ← 機器設定へ戻る
        </Link>
      </div>
      <DiagnosticsPanel />
    </PageShell>
  );
}
