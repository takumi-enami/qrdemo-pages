import { useCallback, useEffect, useState } from 'react'
import './App.css'
import DiagnosticsPanel from './DiagnosticsPanel'

type Sample = {
  sample_code: string
  title: string
  current_step: string
  updated_at: string
}

type View = 'samples' | 'diagnostics'

function App() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>('samples')

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch('/api/token', {
        method: 'POST',
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error(`Failed to create session (${res.status})`)
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
      return false
    }
  }, [])

  const loadSamples = useCallback(
    async ({
      ensureToken,
      retryOn401,
    }: {
      ensureToken: boolean
      retryOn401: boolean
    }) => {
      setLoading(true)
      setError(null)
      try {
        if (ensureToken) {
          const ok = await fetchToken()
          if (!ok) {
            return
          }
        }

        let res = await fetch('/api/samples?limit=10', {
          credentials: 'include',
        })

        if (res.status === 401 && retryOn401) {
          const ok = await fetchToken()
          if (!ok) {
            return
          }
          res = await fetch('/api/samples?limit=10', {
            credentials: 'include',
          })
        }

        if (!res.ok) {
          throw new Error(`Failed to load samples (${res.status})`)
        }

        const data = await res.json()
        setSamples(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error')
      } finally {
        setLoading(false)
      }
    },
    [fetchToken]
  )

  useEffect(() => {
    loadSamples({ ensureToken: true, retryOn401: false })
  }, [loadSamples])

  return (
    <>
      <h1>{view === 'samples' ? 'QRDEMO Samples' : 'QRDEMO Diagnostics'}</h1>
      <div className="tabs">
        <button
          type="button"
          className={`tab-button${view === 'samples' ? ' active' : ''}`}
          onClick={() => setView('samples')}
        >
          Samples
        </button>
        <button
          type="button"
          className={`tab-button${view === 'diagnostics' ? ' active' : ''}`}
          onClick={() => setView('diagnostics')}
        >
          Diagnostics
        </button>
      </div>
      {view === 'samples' ? (
        <div className="card">
          <button
            type="button"
            onClick={() => loadSamples({ ensureToken: false, retryOn401: true })}
            disabled={loading}
          >
            Reload
          </button>
          {loading ? <p>Loading...</p> : null}
          {error ? <p role="alert">{error}</p> : null}
          <table>
            <thead>
              <tr>
                <th>sample_code</th>
                <th>title</th>
                <th>current_step</th>
                <th>updated_at</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((sample) => (
                <tr key={sample.sample_code}>
                  <td>{sample.sample_code}</td>
                  <td>{sample.title}</td>
                  <td>{sample.current_step}</td>
                  <td>{sample.updated_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <DiagnosticsPanel />
      )}
    </>
  )
}

export default App
