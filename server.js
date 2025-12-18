import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import sql from 'mssql'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, // e.g. localhost or localhost\\SQLEXPRESS
  database: process.env.DB_NAME,
  options: {
    encrypt: false, // set true if required by your setup
    trustServerCertificate: true,
  },
}

let pool

async function getPool() {
  if (pool) return pool
  pool = await sql.connect(dbConfig)
  return pool
}

app.post('/api/names', async (req, res) => {
  try {
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' })
    }

    // Table creation is handled in the .NET backend.
    // This endpoint assumes that the "Names" table already exists.
    const pool = await getPool()
    const result = await pool
      .request()
      .input('name', sql.NVarChar(255), name.trim())
      .query('INSERT INTO Names (Name) OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.CreatedAt VALUES (@name)')

    res.status(201).json(result.recordset[0])
  } catch (err) {
    console.error('Error inserting name:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/names', async (req, res) => {
  try {
    // Table creation is handled in the .NET backend.
    // This endpoint assumes that the "Names" table already exists.
    const pool = await getPool()
    const result = await pool.request().query('SELECT Id, Name, CreatedAt FROM Names ORDER BY CreatedAt DESC')
    res.json(result.recordset)
  } catch (err) {
    console.error('Error fetching names:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
