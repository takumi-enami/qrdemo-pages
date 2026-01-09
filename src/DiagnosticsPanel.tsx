import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

type HistoryItem = {
  id: string
  text: string
  at: number
}

const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function DiagnosticsPanel() {
  const [inputValue, setInputValue] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleConfirm = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      return
    }

    const item: HistoryItem = {
      id: makeId(),
      text: trimmed,
      at: Date.now(),
    }

    setHistory((prev) => [item, ...prev])
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return
    }
    event.preventDefault()
    handleConfirm()
  }

  const handleCopy = async (item: HistoryItem) => {
    try {
      await navigator.clipboard.writeText(item.text)
      setCopiedId(item.id)
      window.setTimeout(() => {
        setCopiedId((current) => (current === item.id ? null : current))
      }, 1500)
    } catch {
      setCopiedId(null)
    }
  }

  return (
    <div className="diagnostics-panel">
      <p className="lead">
        多くのQRリーダーはキーボードとして動作し、読み取り結果が入力欄に文字列として入力され、最後にEnterが送信されることが多い
      </p>
      <p className="lead">
        この画面では入力欄にフォーカスした状態でQRを読み取り、Enterで確定すると履歴に追加される
      </p>

      <div className="diag-card">
        <div className="diag-header">
          <h2>入力テスト</h2>
        </div>
        <input
          ref={inputRef}
          className="diag-input"
          type="text"
          placeholder="ここにフォーカスしてQRを読み取ってください"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="diag-actions">
          <button type="button" onClick={() => setInputValue('')}>クリア</button>
          <button type="button" onClick={() => inputRef.current?.focus()}>フォーカス</button>
        </div>
      </div>

      <div className="diag-card">
        <div className="diag-header">
          <h2>履歴</h2>
          <button type="button" onClick={() => setHistory([])} disabled={history.length === 0}>
            履歴を全消去
          </button>
        </div>
        {history.length === 0 ? (
          <p className="muted">まだ履歴がありません</p>
        ) : (
          <ul className="history-list">
            {history.map((item) => (
              <li key={item.id} className="history-item">
                <div className="history-main">
                  <span className="history-time">{new Date(item.at).toLocaleString()}</span>
                  <span className="history-text">{item.text}</span>
                </div>
                <div className="history-actions">
                  <button type="button" onClick={() => handleCopy(item)}>
                    コピー
                  </button>
                  {copiedId === item.id ? <span className="copy-note">コピーしました</span> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default DiagnosticsPanel
