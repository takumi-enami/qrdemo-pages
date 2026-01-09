import React, { useEffect, useMemo, useRef, useState } from "react";

type HistoryItem = {
  id: string;
  text: string;
  at: number; // epoch ms
};

function formatLocalTime(ms: number): string {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return String(ms);
  }
}

function makeId(): string {
  // crypto.randomUUID が使える環境ならそれを使う
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function DiagnosticsPanel() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState<string>("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const description = useMemo(
    () => [
      "多くのQRリーダーはキーボードとして動作し、読み取り結果が入力欄に文字列として入力され、最後にEnterが送信されることが多いです。",
      "この画面では入力欄にフォーカスした状態でQRを読み取り、Enterで確定すると履歴に追加されます。"
    ],
    []
  );

  useEffect(() => {
    // 初期フォーカス（邪魔なら削除OK）
    inputRef.current?.focus();
  }, []);

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1200);
    } catch {
      // clipboardが使えない場合のフォールバック
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopiedId(id);
        window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1200);
      } catch {
        // 何もしない（UIは壊さない）
      }
    }
  }

  function addHistory(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const item: HistoryItem = {
      id: makeId(),
      text: trimmed,
      at: Date.now(),
    };

    setHistory((prev) => [item, ...prev]);
    setValue("");
  }

  return (
    <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <h2 style={{ margin: "8px 0 12px" }}>Diagnostics</h2>

      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, marginBottom: 16 }}>
        {description.map((line, idx) => (
          <p key={idx} style={{ margin: idx === 0 ? 0 : "8px 0 0" }}>
            {line}
          </p>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addHistory(value);
          }}
          placeholder="ここにフォーカスしてQRを読み取ってください"
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1px solid #ccc",
            borderRadius: 8,
            fontSize: 16,
          }}
        />
        <button
          type="button"
          onClick={() => setValue("")}
          style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc" }}
        >
          クリア
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc" }}
        >
          フォーカス
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>入力履歴</h3>
        <button
          type="button"
          onClick={() => setHistory([])}
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc" }}
        >
          履歴を全消去
        </button>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
        {history.length === 0 ? (
          <div style={{ padding: 12, color: "#666" }}>まだ履歴はありません。入力してEnterで追加してください。</div>
        ) : (
          history.map((h) => (
            <div
              key={h.id}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: 12,
                borderTop: "1px solid #eee",
              }}
            >
              <div style={{ width: 180, fontSize: 12, color: "#666", flexShrink: 0 }}>
                {formatLocalTime(h.at)}
              </div>
              <div style={{ flex: 1, wordBreak: "break-all" }}>{h.text}</div>
              <button
                type="button"
                onClick={() => copyToClipboard(h.text, h.id)}
                style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc" }}
              >
                コピー
              </button>
              <div style={{ width: 70, fontSize: 12, color: "#2a7" }}>
                {copiedId === h.id ? "copied" : ""}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
