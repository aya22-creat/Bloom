import { Router } from 'express'
import { Database } from '../lib/database'

const router = Router()

router.get('/news', (req, res) => {
  Database.db.all(`SELECT * FROM articles ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: 'db_error' })
    res.json({ success: true, data: rows })
  })
})

router.post('/news', (req, res) => {
  const { title, body, source, sponsored } = req.body || {}
  if (!title || !body) return res.status(400).json({ success: false, error: 'required_fields' })
  Database.db.run(
    `INSERT INTO articles (title, body, source, sponsored) VALUES (?, ?, ?, ?)`,
    [title, body, source || '', sponsored ? 1 : 0],
    function (this: any) {
      res.json({ success: true, id: this?.lastID || null })
    }
  )
})

router.get('/events', (req, res) => {
  Database.db.all(`SELECT * FROM events ORDER BY start_date ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: 'db_error' })
    res.json({ success: true, data: rows })
  })
})

router.post('/events', (req, res) => {
  const { title, description, start_date, end_date, location } = req.body || {}
  if (!title || !start_date) return res.status(400).json({ success: false, error: 'required_fields' })
  Database.db.run(
    `INSERT INTO events (title, description, start_date, end_date, location) VALUES (?, ?, ?, ?, ?)`,
    [title, description || '', start_date, end_date || null, location || ''],
    function (this: any) {
      res.json({ success: true, id: this?.lastID || null })
    }
  )
})

router.get('/forum/:topic', (req, res) => {
  const topic = String(req.params.topic)
  Database.db.all(`SELECT * FROM forum_posts WHERE topic = ? ORDER BY created_at DESC`, [topic], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: 'db_error' })
    res.json({ success: true, data: rows })
  })
})

router.post('/forum/:topic', (req, res) => {
  const topic = String(req.params.topic)
  const { user_id, content } = req.body || {}
  if (!content) return res.status(400).json({ success: false, error: 'content_required' })
  Database.db.run(
    `INSERT INTO forum_posts (user_id, topic, content) VALUES (?, ?, ?)`,
    [user_id || null, topic, content],
    function (this: any) {
      res.json({ success: true, id: this?.lastID || null })
    }
  )
})

export default router
