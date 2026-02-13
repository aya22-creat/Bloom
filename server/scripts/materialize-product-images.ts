import 'dotenv/config'
import fs from 'fs'
import path from 'path'

async function ensureDir(p: string) {
  await fs.promises.mkdir(p, { recursive: true })
}

async function run() {
  const base = process.env.TEST_BASE_URL || 'http://localhost:4000'
  const publicDir = path.join(process.cwd(), 'src', '..', 'public', 'products')
  await ensureDir(publicDir)

  const get = async (pathUrl: string) => {
    const res = await fetch(`${base}${pathUrl}`)
    const json = await res.json()
    if (!res.ok) throw new Error(`GET ${pathUrl} failed: ${res.status}`)
    return json
  }

  const put = async (pathUrl: string, body: any) => {
    const res = await fetch(`${base}${pathUrl}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok || json?.success === false) throw new Error(`PUT ${pathUrl} failed: ${JSON.stringify(json)}`)
    return json
  }

  const list = await get('/api/marketplace/products')
  const items = Array.isArray(list?.data) ? list.data : []

  for (const p of items) {
    const src = String(p.image_url || '')
    if (!src) continue
    try {
      const img = await fetch(src)
      const buf = new Uint8Array(await img.arrayBuffer())
      const dest = path.join(publicDir, `${p.id}.png`)
      await fs.promises.writeFile(dest, buf)
      const rel = `/static/products/${p.id}.png`
      await put(`/api/marketplace/products/${p.id}/image`, { image_url: rel })
      console.log(`✔ materialized product ${p.id} -> ${rel}`)
    } catch (e: any) {
      console.warn(`⚠ failed for product ${p.id}: ${e?.message || e}`)
    }
  }

  const updated = await get('/api/marketplace/products')
  console.log(JSON.stringify(updated, null, 2))
}

run().catch((e) => {
  console.error('Materialize product images failed:', e?.message || e)
  process.exit(1)
})

