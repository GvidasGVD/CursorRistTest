import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [name, setName] = useState('')
  const [savedNames, setSavedNames] = useState([])
  const [status, setStatus] = useState('')

  const apiBase = 'http://localhost:4000/api'

  async function fetchNames() {
    try {
      const res = await fetch(`${apiBase}/names`)
      if (!res.ok) throw new Error('Failed to load names')
      const data = await res.json()
      setSavedNames(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchNames()
  }, [])

  async function handleSave() {
    if (!name.trim()) {
      setStatus('Please enter a name first.')
      return
    }
    try {
      setStatus('Saving...')
      const res = await fetch(`${apiBase}/names`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || 'Failed to save name')
      }
      setName('')
      setStatus('Name saved to database.')
      await fetchNames()
    } catch (err) {
      console.error(err)
      setStatus('Error saving name.')
    }
  }

  return (
    <div className="app">
      <h1>Hello{name ? `, ${name}` : ''}!</h1>
      <div className="input-container">
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={handleSave}>Save to database</button>
      </div>
      {status && <p>{status}</p>}

      <h2>Saved names (from SQL Server)</h2>
      <table className="user-table">
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Created At (UTC)</th>
          </tr>
        </thead>
        <tbody>
          {savedNames.map((row) => (
            <tr key={row.Id}>
              <td>{row.Id}</td>
              <td>{row.Name}</td>
              <td>{row.CreatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App
