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

// Ensure table exists
async function ensureTable() {
  const pool = await getPool()
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Names' AND xtype='U')
    CREATE TABLE Names (
      Id INT IDENTITY(1,1) PRIMARY KEY,
      Name NVARCHAR(255) NOT NULL,
      CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
    )
  `)
}

app.post('/api/names', async (req, res) => {
  try {
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' })
    }

    await ensureTable()
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
    await ensureTable()
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
