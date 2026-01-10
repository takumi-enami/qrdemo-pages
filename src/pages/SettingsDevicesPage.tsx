import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../PageShell";

type DeviceSettings = {
  scannerEnabled: boolean;
  scannerMode: "keyboard" | "custom";
  printerMode: "lan" | "bluetooth";
  printerIp: string;
  printerPort: string;
  printerModel: string;
};

const STORAGE_KEY = "qrdemo-device-settings";

const defaultSettings: DeviceSettings = {
  scannerEnabled: true,
  scannerMode: "keyboard",
  printerMode: "lan",
  printerIp: "",
  printerPort: "9100",
  printerModel: "",
};

export default function SettingsDevicesPage() {
  const [settings, setSettings] = useState<DeviceSettings>(defaultSettings);
  const [message, setMessage] = useState<string>("");
  const [scannerTest, setScannerTest] = useState<string>("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<DeviceSettings>;
      setSettings((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore
    }
  }, []);

  function handleSave() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setMessage("保存しました。");
    } catch {
      setMessage("保存に失敗しました。");
    }
    window.setTimeout(() => setMessage(""), 1500);
  }

  return (
    <PageShell title="機器設定">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>QRスキャナー</h2>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={settings.scannerEnabled}
              onChange={(e) => setSettings((prev) => ({ ...prev, scannerEnabled: e.target.checked }))}
            />
            有効
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            入力方式
            <select
              value={settings.scannerMode}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, scannerMode: e.target.value as DeviceSettings["scannerMode"] }))
              }
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db", width: 220 }}
            >
              <option value="keyboard">キーボード入力</option>
              <option value="custom">専用入力</option>
            </select>
          </label>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>テスト入力</div>
            <input
              value={scannerTest}
              onChange={(e) => setScannerTest(e.target.value)}
              placeholder="スキャン結果をここで確認"
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db", width: "100%" }}
            />
          </div>
        </section>

        <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>ラベルプリンター</h2>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            接続方式
            <select
              value={settings.printerMode}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, printerMode: e.target.value as DeviceSettings["printerMode"] }))
              }
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db", width: 220 }}
            >
              <option value="lan">LAN</option>
              <option value="bluetooth">Bluetooth</option>
            </select>
          </label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
              IP
              <input
                value={settings.printerIp}
                onChange={(e) => setSettings((prev) => ({ ...prev, printerIp: e.target.value }))}
                placeholder="192.168.0.10"
                style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db", minWidth: 180 }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
              ポート
              <input
                value={settings.printerPort}
                onChange={(e) => setSettings((prev) => ({ ...prev, printerPort: e.target.value }))}
                style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db", width: 120 }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
              機種名
              <input
                value={settings.printerModel}
                onChange={(e) => setSettings((prev) => ({ ...prev, printerModel: e.target.value }))}
                placeholder="Zebra 123"
                style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db", minWidth: 200 }}
              />
            </label>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>テスト印刷: 未実装</div>
        </section>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={handleSave}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            設定を保存
          </button>
          {message ? <span style={{ fontSize: 12, color: "#166534" }}>{message}</span> : null}
          <Link to="/settings/diagnostics" style={{ fontSize: 13, color: "#2563eb" }}>
            機器診断へ
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
