import { useState } from 'react'
import './App.css'

function App() {
  const [name, setName] = useState('')

  const mockedUsers = [
    { name: 'Alice Johnson', address: '123 Main St, Springfield', email: 'alice@example.com' },
    { name: 'Bob Smith', address: '456 Oak Ave, Metropolis', email: 'bob.smith@example.com' },
    { name: 'Charlie Brown', address: '789 Pine Rd, Gotham', email: 'charlie.brown@example.com' },
  ]

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

      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {mockedUsers.map((user, index) => (
            <tr key={index}>
              <td>{user.name}</td>
              <td>{user.address}</td>
              <td>{user.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App
