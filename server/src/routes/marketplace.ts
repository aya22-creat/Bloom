import { Router } from 'express'
import { Database } from '../lib/database'

const router = Router()

router.get('/products', (req, res) => {
  const onlyVerified = String(req.query.verified || '').toLowerCase() === 'true'
  const category = String(req.query.category || '')
  const sql = `SELECT p.*, v.name as vendor_name FROM products p JOIN vendors v ON v.id=p.vendor_id WHERE p.active=1 ${onlyVerified ? 'AND p.verified=1' : ''} ${category ? 'AND p.category=?' : ''}`
  const params: any[] = []
  if (category) params.push(category)
  Database.db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: 'db_error' })
    res.json({ success: true, data: rows })
  })
})

router.post('/vendors', (req, res) => {
  const { name, contact_email, contact_phone } = req.body || {}
  if (!name) return res.status(400).json({ success: false, error: 'name_required' })
  Database.db.run(
    `INSERT INTO vendors (name, contact_email, contact_phone, verified) VALUES (?, ?, ?, 0)`,
    [name, contact_email || null, contact_phone || null],
    function (this: any) {
      res.json({ success: true, id: this?.lastID || null })
    }
  )
})

router.post('/products', (req, res) => {
  const { vendor_id, name, description, category, price, currency } = req.body || {}
  if (!vendor_id || !name) return res.status(400).json({ success: false, error: 'required_fields' })
  Database.db.run(
    `INSERT INTO products (vendor_id, name, description, category, price, currency, verified, active) VALUES (?, ?, ?, ?, ?, ?, 0, 1)`,
    [vendor_id, name, description || '', category || '', price || null, currency || 'USD'],
    function (this: any) {
      res.json({ success: true, id: this?.lastID || null })
    }
  )
})

router.put('/products/:id/verify', (req, res) => {
  const id = Number(req.params.id)
  const verified = String(req.body?.verified ?? 'true').toLowerCase() === 'true' ? 1 : 0
  Database.db.run(`UPDATE products SET verified=? WHERE id=?`, [verified, id], function () {
    res.json({ success: true })
  })
})

export default router
