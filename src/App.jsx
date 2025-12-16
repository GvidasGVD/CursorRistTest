import { useState } from 'react'
import './App.css'

function App() {
  const [name, setName] = useState('')

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
      </div>
    </div>
  )
}

export default App

